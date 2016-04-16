//import Bee from 'bee';

var canvas = document.getElementById('game');
var context = canvas.getContext("2d");
var bodyImg = new Image;
bodyImg.src = '../assets/bee_body_draft.svg';
var leftWingImg = new Image;
leftWingImg.src = '../assets/bee_wing_left_draft.svg';
var rightWingImg = new Image;
rightWingImg.src = '../assets/bee_wing_right_draft.svg';
bodyImg.onload = function () {
    context.drawImage(bodyImg, 300, 300);
};
leftWingImg.onload = function () {
    context.drawImage(leftWingImg, 225, 350);
};
rightWingImg.onload = function () {
    context.drawImage(rightWingImg, 450, 350);
};
