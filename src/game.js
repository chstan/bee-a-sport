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

class Game {
  constructor() {
    this.socket = io.connect('http://localhost:8080');
    this.controls = new ControlsListener();
    this.bee = new Bee();
    this.opponentBee = new Bee();
    this.lastFrame = null;
    this.state = GameState.SETUP;

    this.socket.on('start', () => {
        var $msg = $('#big-msg');
        $msg.show();
        setTimeout(() => {
            $msg.hide();
        }, 1000);
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
      $('#modal-dim').hide();
      $('#start-modal').hide();

      this.register(data);
    });

    $('#reset').click(() => {
      this.socket.emit('reset');
    });
  }

  update() {
    if (this.bee.x >= 100) {
        this.bee.win = true;
        return;
    }
    if (Math.abs(this.bee.pitch) >= Math.PI/2) {
        this.bee.lose = true;
        return;
    }
    // update our bee
    this.lastFrame = this.lastFrame || (new Date()).getTime();
    const currentFrame = (new Date()).getTime();
    const inputs = this.controls.controlsForBee;
    if (this.state === GameState.STARTED) {
      this.bee.nextFrameFromControls(inputs, currentFrame - this.lastFrame);
    }
    this.lastFrame = currentFrame;

    // send information on our bee to the server
    const beeStateForOpponent = this.bee.simpleState;
    //const pos = _.pick(beeStateForOpponent, ['x', 'y']);
    //if (!_.isEqual(pos, this.lastState)) {
        //console.log(`x: ${pos.x}`)
      this.socket.emit('state-update', beeStateForOpponent);
    //}
    //this.lastState = pos;
  }

  drawBackground(context, distance) {
    const TOTAL_DISTANCE = 5200 - window.innerHeight;
    context.drawImage(this.assets.background, 0, Math.min(-TOTAL_DISTANCE + TOTAL_DISTANCE*(distance/100), 0));
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
    context.drawImage(this.assets.avatar, $canvas.width() - 356, $canvas.height() - 387);

    const BEE_CENTER = - 130;
    const BODY_OFFSET = 93.8;

    const {
      leftWingAngle, rightWingAngle, pitch, x
    } = this.bee.drawData();

    context.translate($canvas.width()/2, $canvas.width()/2);
    context.rotate(pitch);
    // draw rotated wings
    const TEST_ROTATION = ((new Date()).getTime() % 2000) / 2000;
    const AXIS = 90;
    this.drawAsset(this.assets.bee.body, BEE_CENTER, BEE_CENTER);
    this.drawAsset(
        this.assets.bee.leftWing, 0, 0,
        leftWingAngle,
        BODY_OFFSET + 130, BODY_OFFSET + 130
    );
    this.drawAsset(
        this.assets.bee.leftWing, 0, 0,
        -rightWingAngle,
        BODY_OFFSET + 130, BODY_OFFSET + 130,
        -1
    );
    context.rotate(-pitch);
    context.translate(-$canvas.width()/2, -$canvas.width()/2);
    context.font = '50px Comic Sans MS';
    context.textAlign = 'center';
    if (this.bee.lose) {
        context.fillText("You Lose", $canvas.width()/2, $canvas.height()/2);
    } else if (this.bee.win) {
        context.fillText("You Win", $canvas.width()/2, $canvas.height()/2);
    }

    const BEE_START_X = 44;
    const BEE_END_X = 424;

    context.save();
    context.translate($canvas.width()/2 - 250, 25);
    this.drawAsset(this.assets.indicatorBar, 0, 0);
    this.drawAsset(this.assets.indicatorMe, BEE_START_X + this.bee.x / 100 * (BEE_END_X - BEE_START_X), -3);
    this.drawAsset(this.assets.indicatorOpp, BEE_START_X + this.opponentBee.x / 100 * (BEE_END_X - BEE_START_X), 47);
    context.restore();
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
    $canvas[0].width = 1440;
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
      avatar: new Image,
      background: new Image,
      indicatorBar: new Image,
      indicatorMe: new Image,
      indicatorOpp: new Image,
    };
    this.assets.bee.body.src = '/assets/bee_body.svg';
    this.assets.bee.leftWing.src = '/assets/bee_wing_left.svg';
    this.assets.bee.rightWing.src = '/assets/bee_wing_right.svg';
    this.assets.avatar.src = '/assets/bee_avatar.png';
    this.assets.background.src = '/assets/bee_background.png';
    this.assets.indicatorBar.src = '/assets/indicator_bar.png';
    this.assets.indicatorMe.src = '/assets/indicator_yellow.svg';
    this.assets.indicatorOpp.src = '/assets/indicator_blue.svg';
  }

  register(data) {
    if (this.state !== GameState.SETUP) {
      return;
    }

    this.socket.emit('register', data);
    this.state = GameState.WAITING;
  }

  reset() {
    this.state = GameState.SETUP;
  }
}

$(document).ready(() => {
  var game = new Game();
  game.start();
});
