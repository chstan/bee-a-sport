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
    this.bee = new Bee(50, 50);
    this.opponentBee = new Bee(50, 50);
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
    this.loopCallback = () => this.onLoop();
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
    this.lastFrame = this.lastFrame || (new Date()).getTime();
    const currentFrame = (new Date()).getTime();
    const inputs = this.controls.controlsForBee;
    this.bee.nextFrameFromControls(inputs, currentFrame - this.lastFrame);
    this.lastFrame = currentFrame;

    // send information on our bee to the server
    const beeStateForOpponent = this.bee.simpleState;
    const pos = _.pick(beeStateForOpponent, ['x', 'y']);
    if (!_.isEqual(pos, this.lastState)) {
      this.socket.emit('state-update', beeStateForOpponent);
    }
    this.lastState = pos;
  }

  draw() {
    // TODO
    var $canvas = $('#game');
    var context = $canvas[0].getContext('2d');
    context.fillStyle = 'yellow';

    /*
       context.drawImage(this.assets.bee.body, 300, 300);
       context.drawImage(this.assets.bee.leftWing, 225, 350);
       context.drawImage(this.assets.bee.rightWing, 450, 350);
       */
    context.clearRect(0, 0, $canvas.width(), $canvas.height());
    const opState = this.opponentBee.simpleState;
    context.fillRect(opState.x + 150, opState.y, 100, 100);

    const myState = this.bee.simpleState;
    context.fillRect(myState.x, myState.y, 100, 100);
  }

  onLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(this.loopCallback);
  }

  start() {
    this.socket.on('state-update', msg => {
      this.opponentBee.updateFromSimpleState(msg);
    });
    this.loadAssets();

    window.addEventListener('resize', this.resizeCanvas.bind(this), false);
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
  var game = new Game();
  game.start();
});
