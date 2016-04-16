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
    }
}

$(document).ready(() => {
    var game = new Game;
    $('#register-button').click(() => {
        game.register();
    });

    game.start();
});
