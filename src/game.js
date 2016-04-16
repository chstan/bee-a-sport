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
    console.log(inputs.left);
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

  drawBackground(context, distance) {
    const TOTAL_DISTANCE = 5200 - window.innerHeight;
    context.drawImage(this.assets.background, 0, -TOTAL_DISTANCE*distance);
  }

  drawAsset(asset, x, y, rot = 0, axisX = 0, axisY = 0, reflect = 1) {
    var $canvas = $('#game');
    var context = $canvas[0].getContext('2d');

    context.translate(x, y);
    context.rotate(rot);
    context.scale(reflect, 1);
    context.drawImage(asset, -axisX, -axisY);
    context.scale(reflect, 1);
    context.rotate(-rot);
    context.translate(-x, -y);
  }

  draw() {
    var $canvas = $('#game');
    var context = $canvas[0].getContext('2d');
    context.clearRect(0, 0, $canvas.width(), $canvas.height());

    this.drawBackground(context, this.bee.x);

    const BEE_CENTER = $canvas.width()/2 - 130;
    const BODY_OFFSET = 93.8;

    this.drawAsset(this.assets.bee.body, BEE_CENTER, BEE_CENTER);

    const {
      leftWingAngle, rightWingAngle
    } = this.bee.drawData();
    console.log(this.bee.simpleState);

    // draw rotated wings
    const TEST_ROTATION = ((new Date()).getTime() % 2000) / 2000;
    const ROT_OFFSET = 0; // Tune this
    const AXIS = 90;
    this.drawAsset(
      this.assets.bee.leftWing, $canvas.width()/2, $canvas.width()/2,
      leftWingAngle + ROT_OFFSET,
      BODY_OFFSET + 130, BODY_OFFSET + 130
    );

    this.drawAsset(
      this.assets.bee.leftWing, $canvas.width()/2, $canvas.width()/2,
      -(rightWingAngle + ROT_OFFSET),
      BODY_OFFSET + 130, BODY_OFFSET + 130,
      -1
    );

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
      },
      background: new Image,
    };
    this.assets.bee.body.src = '/assets/bee_body.svg';
    this.assets.bee.leftWing.src = '/assets/bee_wing_left.svg';
    this.assets.bee.rightWing.src = '/assets/bee_wing_right.svg';
    this.assets.background.src = '/assets/bee_background.png';
    this.loadCount = 4;
    this.assets.bee.body.onload = this.assetLoaded;
    this.assets.bee.leftWing.onload = this.assetLoaded;
    this.assets.bee.rightWing.onload = this.assetLoaded;
    this.assets.background.onload = this.assetLoaded;
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
