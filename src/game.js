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
    this.socket = io.connect(window.location.href);
    this.controls = new ControlsListener();
    this.bee = new Bee();
    this.opponentBee = new Bee();
    this.lastFrame = null;
    this.state = GameState.SETUP;
    this.$canvas = $('#game');

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

  get context() {
    return this.$canvas[0].getContext('2d');
  }

  drawBackground(distance) {
    const TOTAL_DISTANCE = 5200 - this.CANVAS_HEIGHT;
    this.context.drawImage(this.assets.background, 0, Math.min(-TOTAL_DISTANCE + TOTAL_DISTANCE*(distance/100), 0));
  }

  drawAsset(asset, x, y, rot = 0, axisX = 0, axisY = 0, reflect = 1) {
    const context = this.context;

    context.save();
    context.translate(x, y);
    context.rotate(rot);
    context.scale(reflect, 1);
    context.drawImage(asset, -axisX, -axisY);
    context.restore();
  }

  draw() {
    const $canvas = $('#game');
    const context = this.context,
      CANVAS_WIDTH = this.CANVAS_WIDTH,
      CANVAS_HEIGHT = this.CANVAS_HEIGHT;
    this.context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawBackground(this.bee.x);
    context.drawImage(this.assets.avatar, CANVAS_WIDTH - 356, CANVAS_HEIGHT - 387);

    const BEE_CENTER = - 130;
    const BODY_OFFSET = 93.8;

    const {
      leftWingAngle, rightWingAngle, pitch, x
    } = this.bee.drawData();

    context.save();
    let BEE_OFFSET = CANVAS_HEIGHT - 250;
    const FINAL_OFFSET = 500,
      MOVE_THRESHOLD = 90;
    if (this.bee.x > MOVE_THRESHOLD) {
      BEE_OFFSET = FINAL_OFFSET + (BEE_OFFSET - FINAL_OFFSET) * (100 - this.bee.x) / (100 - MOVE_THRESHOLD);
    }
    context.translate(CANVAS_WIDTH/2, BEE_OFFSET);
    context.rotate(pitch);
    // draw rotated wings
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
    context.restore();

    context.font = '50px Comic Sans MS';
    context.textAlign = 'center';
    const textPos = [CANVAS_WIDTH/2, 250];
    if (this.bee.lose) {
        context.fillText("You Lose", ...textPos);
    } else if (this.bee.win) {
        context.fillText("You Win", ...textPos);
    }

    const BEE_START_X = 44;
    const BEE_END_X = 424;

    context.save();
    context.translate(CANVAS_WIDTH/2 - 250, 25);
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
    this.context.restore();
    this.$canvas[0].width = $(window).width();
    this.$canvas[0].height = $(window).height();

    const BACKGROUND_WIDTH = 1440,
      scale = Math.min($(window).width() / BACKGROUND_WIDTH, 1),
      context = this.context;
    context.save();
    context.scale(scale, scale);

    this.CANVAS_WIDTH = BACKGROUND_WIDTH;
    this.CANVAS_HEIGHT = $(window).height() / scale;

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
