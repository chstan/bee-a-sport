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
    console.log(`Received registration for game ${data.gamekey}`);
    switch (_.size(games[data.gamekey])) {
        case 0:
            games[data.gamekey] = [];
            /* FALL-THROUGH */
        case 1:
            games[data.gamekey].push({
              socket,
            });
            keys[socket] = data.gamekey;
            break;
        default:
            console.log(`Game ${data.gamekey} is full.`)
            return;
    }
    if (games[data.gamekey].length === 2) {
      console.log(`Starting game ${data.gamekey}`);
      setTimeout(() => {
        games[data.gamekey].forEach(u => {
            u.socket.emit('start');
        });
      }, 500);
    }
  });

  socket.on('state-update', beeState => {
    const gamekey = keys[socket];
    if (!gamekey || games[gamekey].length < 2) return;

    const opponent = _.filter(games[gamekey], g => g.socket !== socket)[0];
    opponent.socket.emit('state-update', beeState);
  });

  socket.on('disconnect', () => {
      const gamekey = keys[socket];
      const players = games[gamekey] || [];
      players.forEach(p => {
          delete keys[p.socket];
      });
      delete games[gamekey];
  });
});

server.listen(runningPortNumber, '0.0.0.0');
