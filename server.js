var express = require('express');
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var _ = require('lodash');

var runningPortNumber = process.env.PORT || 8080;

app.use(express.static(__dirname + '/views'));
app.use('/static', express.static(__dirname + '/static'));

var games = {};

io.sockets.on('connection', function (socket) {
    socket.on('register', function(key) {
        if (_.size(players[key]) < 2) {
            players[key].push(socket);
        }
    });

    socket.on('move', function(move) {
        _.without(players[key], socket)[0].emit(move);
    });
});

server.listen(runningPortNumber);
