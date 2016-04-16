#!/bin/bash

webpack --config webpack.config.js --watch&
nodemon -w server.js -I -q server.js
