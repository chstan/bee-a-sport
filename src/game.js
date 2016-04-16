import io from 'socket.io-client';
import Bee from './bee';
import ControlsListener from './controls';
import $ from 'jquery';

class Game {
    constructor() {
        this.socket = io.connect('http://localhost:8080');
        this.controls = new ControlsListener();
        this.bee = new Bee();
        this.opponentBee = new Bee();
        this.lastFrame = null;
    }

    register() {
      this.socket.emit('register', 123);
    }

    update() {
      // update our bee
      this.lastFrame = this.lastFrame || (new Date()).getTime();
      const currentFrame = (new Date()).getTime();
      const inputs = this.controls.controlsForBee;
      this.bee.nextFrameFromControls(inputs, currentFrame - this.lastFrame);
      this.lastFrame = currentFrame;

      // send information on our bee to the server
      const beeStateForOpponent = this.bee.simpleState;
      this.socket.emit('state-update', beeStateForOpponent);
    }

    draw() {
      // TODO
      var $canvas = $('#game');
      var context = $canvas[0].getContext('2d');
      context.fillStyle = '#FF0000';

      context.drawImage(this.assets.bee.body, 300, 300);
      context.drawImage(this.assets.bee.leftWing, 225, 350);
      context.drawImage(this.assets.bee.rightWing, 450, 350);

    }

    onLoop() {
      this.update();
      this.draw();
      requestAnimationFrame(this.onLoop.bind(this));
    }

    start() {
        this.socket.on('status-update', function (msg) {
          this.opponentBee.updateFromSimpleState(msg);
        });
        this.loadAssets();

        window.addEventListener('resize', this.resizeCanvas, false);
        this.resizeCanvas();


        this.onLoop();
    }

    resizeCanvas() {
        var $canvas = $('#game');
        $canvas[0].width = window.innerWidth;
        $canvas[0].height = window.innerHeight;
        this.draw();
    }

    loadAssets() {
        this.assets = {
            bee: {
                body: new Image,
                leftWing: new Image,
                rightWing: new Image,
            }
        };
        this.assets.bee.body.src = '/assets/bee_body.svg';
        this.assets.bee.leftWing.src = '/assets/bee_wing_left.svg';
        this.assets.bee.rightWing.src = '/assets/bee_wing_right.svg';
        this.loadCount = 3;
        this.assets.bee.body.onload = this.assetLoaded;
        this.assets.bee.leftWing.onload = this.assetLoaded;
        this.assets.bee.rightWing.onload = this.assetLoaded;
    }

    assetLoaded() {
        this.loadCount -= 1;
    }

}

$(document).ready(() => {
    var game = new Game;
    $('#register-button').click(() => {
        game.register();
    });

    game.start();
});
