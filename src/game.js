import io from 'socket.io-client';
import $ from 'jquery';

class Game {
    constructor() {
        this.socket = io.connect('http://localhost:8080');
    }

    register() {
        this.socket.emit('register', 123);
    }

    start() {
        var $canvas = $('#game');
        var context = $canvas[0].getContext('2d');
        context.fillStyle = '#FF0000';
        this.loadAssets();
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
