import io from 'socket.io-client';
import $ from 'jquery';

class Game {
    constructor() {
        this.socket = io.connect('http://localhost:8080');
    }

    register() {
        this.socket.emit('register', 123);
    }
}

$(document).ready(() => {
    var game = new Game;
    $('#register-button').click(() => {
        game.register();
    });
});
