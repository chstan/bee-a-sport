var express = require('express');
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var _ = require('lodash');

var runningPortNumber = process.env.PORT || 8080;

app.use(express.static(__dirname + '/views'));
app.use('/static', express.static(__dirname + '/static'));
app.use('/assets', express.static(__dirname + '/assets'));

var games = {},
  keys = {};

  io.sockets.on('connection', socket => {
    socket.on('register', data => {
      console.log(`Received registration ${JSON.stringify(data)}`);
      switch (_.size(games[data.gamekey])) {
          case 0:
              games[data.gamekey] = [];
              /* FALL-THROUGH */
          case 1:
              games[data.gamekey].push({
                user: data.name,
                socket,
              });
              keys[socket] = data.gamekey;
              break;
          default:
              console.log(`Game already full for key ${data.gamekey}`)
              return;
      }
      if (games[data.gamekey].length === 2) {
        games[data.gamekey].forEach(u => {
          u.socket.emit('start');
        });
      }
    });

    socket.on('reset', () => {
      console.log('Reseting all games');
      io.emit('reset');
      games = {};
      keys = {};
    });

    socket.on('state-update', beeState => {
      const gamekey = keys[socket];
      if (!gamekey || games[gamekey].length < 2) return;

      const opponent = _.filter(games[gamekey], g => g.socket !== socket)[0];
      opponent.socket.emit('state-update', beeState);
    });
  });

  server.listen(runningPortNumber);
