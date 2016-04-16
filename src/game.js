import io from 'socket.io-client';
import Bee from 'bee';
import ControlsListener from 'controls';
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
      this.lastFrame = this.lastFrame || getTime();
      const currentFrame = getTime();
      const inputs = this.controls.controlsForBee;
      this.bee.nextFrameFromControls(inputs, currentFrame - lastFrame);
      this.lastFrame = currentFrame;

      // send information on our bee to the server
      const beeStateForOpponent = this.bee.simpleState;
      this.socket.emit('state-update', beeStateForOpponent);
    }

    draw() {
      // TODO
    }

    onLoop() {
      this.update();
      this.draw();
      requestAnimationFrame(this.onLoop.bind(this));
    }

    start() {
        var $canvas = $('#game');
        var context = $canvas[0].getContext('2d');
        this.socket.on('status-update', function (msg) {
          this.opponentBee.updateFromSimpleState(msg);
        });
        context.fillStyle = '#FF0000';
        this.loadAssets();

        this.onLoop();
    }

    loadAssets() {
        this.assets = {
            bee: {
                body: new Image,
                leftWing: new Image,
                rightWing: new Image,
            }
        };
        this.assets.bee.body.src = '/assets/bee_body_draft.svg';
        this.assets.bee.leftWing.src = '/assets/bee_wing_left_draft.svg';
        this.assets.bee.rightWing.src = '/assets/bee_wing_right_draft.svg';
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
