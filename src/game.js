import io from 'socket.io-client';
import Bee from './bee';
import ControlsListener from './controls';
import $ from 'jquery';
import _ from 'lodash';

var GameState = {
    SETUP: 'SETUP',
    WAITING: 'WAITING',
    STARTED: 'STARTED',
};

function log(message) {
    $('#debug').append(
        $('<li>').text(message)
    );
}

class Game {
    constructor() {
        this.socket = io.connect('http://localhost:8080');
        this.controls = new ControlsListener();
        this.bee = new Bee();
        this.opponentBee = new Bee();
        this.lastFrame = null;
        this.state = GameState.SETUP;

        this.socket.on('start', () => {
            log('Starting');
            this.state = GameState.STARTED;
        });

        this.socket.on('reset', () => {
            this.reset();
        });

        this.bindDOM();
    }

    bindDOM() {
        $('#player-info').submit(e => {
            e.preventDefault();
            var $form = $(e.target);
            var data = _.reduce(
                $form.serializeArray(),
                (acc, input) => {
                    acc[input.name] = input.value
                    return acc;
                },
                {}
            );
            $form.find('input[name="gamekey"]').val('');
            $form.find('input[name="name"]').val('');

            this.register(data);
        });

        $('#reset').click(() => {
            log('Sending reset');
            this.socket.emit('reset');
        });
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
        var $canvas = $('#game');
        var context = $canvas[0].getContext('2d');
        this.socket.on('status-update', function (msg) {
          this.opponentBee.updateFromSimpleState(msg);
        });
        context.fillStyle = '#FF0000';
        this.loadAssets();
        window.addEventListener('resize', resizeCanvas, false);

        function resizeCanvas() {
            $canvas[0].width = window.innerWidth;
            $canvas[0].height = window.innerHeight;
            this.update();
        }
        resizeCanvas();


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

    register(data) {
        if (this.state !== GameState.SETUP) {
            log('Already registered');
            return;
        }

        log('Registering');
        this.socket.emit('register', data);
        this.state = GameState.WAITING;
    }

    reset() {
        log('Reseting');
        this.state = GameState.SETUP;
    }
}

$(document).ready(() => {
    var game = new Game;
    game.start();
});
