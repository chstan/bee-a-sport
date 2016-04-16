var express = require('express');
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);

var runningPortNumber = process.env.PORT || 8080;

app.configure(function(){
    app.use(express.static(__dirname + '/views'));
    app.use('/static', express.static(__dirname + '/static'));
});


io.sockets.on('connection', function (socket) {

    io.sockets.emit('blast', {msg:"<span style=\"color:red !important\">someone connected</span>"});

    socket.on('blast', function(data, fn) {
        console.log(data);
        io.sockets.emit('blast', {msg:data.msg});

        fn();//call the client back to clear out the field
    });

});

server.listen(runningPortNumber);
