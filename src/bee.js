class Bee {
  constructor() {
    this.pitch = 0.0; // radians

    this.x = initialX;
    this.y = initialY;

    // the wing locations are effectively numbers from
    // 0 to 1, but we record them as continuous floats from
    // 0 so that we know how many revolutions they've gone through
    // (can better keep track of wing speed etc!)
    this.leftWingLocation = 0;
    this.rightWingLocation = 0;
    this.leftWingVelocity = 0;
    this.rightWingVelocity = 0;

    // maintain the wings' position histories
    // so that we can do things like roll the bee
    // depending on how you're doing
    this.leftWingHistory = [];
    this.rightWingHistory = [];
    this.timestamps = [];
  }

  drawData() {
    const ANGLE_MAX = Math.PI / 4; // TODO tune these
    const ANGLE_MIN = -Math.PI / 4;

    function angleFromLocation(location) {
      let l = location % 1;
      if (l < 0.5) {
        return (l * 2) * ANGLE_MAX + (1 - (l * 2)) * ANGLE_MIN;
      } else {
        l -= 0.5;
        return (l * 2) * ANGLE_MIN + (1 - (l * 2)) * ANGLE_MAX;
      }
    }

    return {
      leftWingAngle: angleFromLocation(this.leftWingLocation),
      rightWingAngle: angleFromLocation(this.rightWingLocation),
      pitch: this.pitch,
      x: this.x,
    }
  }

  get instability() {
    // TODO
  }

  get simpleState() {
    // this simple state function and the setter
    // below are mostly so that the bee's information
    // can be sent to the other person playing to animate a bee
    // for them
    return {
      pitch: this.pitch,
      x: this.x,
      y: this.y,
      leftWingLocation: this.leftWingLocation,
      rightWingLocation: this.rightWingLocation,
      leftWingVelocity: this.leftWingVelocity,
      rightWingVelocity: this.rightWingVelocity,
      time: (new Date()).getTime(),
    }
  }

  updateFromSimpleState(state) {
    this.pitch = state.pitch;
    this.x = state.x;
    this.y = state.y;

    this.leftWingLocation = state.leftWingLocation;
    this.rightWingLocation = state.rightWingLocation;
    this.leftWingHistory.push(this.leftWingLocation);
    this.rightWingHistory.push(this.rightWingLocation);

    this.timestamps.push(state.time)
  }

  nextFrameFromControls(inputs, frameDuration) {
    // this function will have to be tuned somewhat in all likelihood
    // currently the inputs are a set of six buttons, three for each wing
    // the wings keep moving for a little while after you stop flapping,
    // but you can keep them at maximum speed by holding the button that's
    // closest to the wing's current angular position
    function forceForWing(wingLocation, inputsForWing) {
      const controlLocations = [1/6, 3/6, 5/6];
      let distances = controlLocations.map(l => {
        const forwardDist = (l - wingLocation) % 1;
        const backwardDist = (wingLocation - l) % 1;
        if (Math.abs(forwardDist) > Math.abs(backwardDist)) {
          return backwardDist;
        }
        return forwardDist;
      });

      // make it so that you can hold the buttons down slightly past the control
      // points
      const kindness = 0.03;
      distances = distances.map(d => Math.abs(d) < kindness ? Math.abs(d) : d);
      let force = 0;
      for (let i = 0; i < 3; i++) {
        if (inputsForWing[i]) {
          force += (1 - distances[i]);
        }
      }

      return force * frameDuration / 50000;
    }

    // all of this should take into account framerate
    const WING_INERTIA = 8;

    let leftWingV = this.leftWingVelocity + (
      forceForWing(this.leftWingLocation, inputs.left) / WING_INERTIA
    );
    let rightWingV = this.rightWingVelocity + (
      forceForWing(this.rightWingLocation, inputs.right) / WING_INERTIA
    );

    const WING_EASING = 0.05;
    leftWingV *= (1- WING_EASING); // this should take into account framerate
    rightWingV *= (1 - WING_EASING);

    const deltaWingLeft = (this.leftWingVelocity + leftWingV) * frameDuration / 2;
    const deltaWingRight = (this.rightWingVelocity + rightWingV) * frameDuration / 2;
    this.leftWingVelocity = leftWingV;
    this.rightWingVelocity = rightWingV;
    this.leftWingLocation += deltaWingLeft;
    this.rightWingLocation += deltaWingRight;

    // TODO calculate wing instability and roll, committing for now

    this.pitch = Math.abs(this.leftWingLocation - this.rightWingLocation) - 0.5;
    if (this.pitch < 0) {
      this.pitch = 0;
    }
    this.pitch /= 5;
    this.pitch *= this.leftWingLocation < this.rightWingLocation ? -1 : 1;

    const SCALE = 0.5;
    if (!this.pitch) {
      this.x += (deltaWingLeft + deltaWingRight) / SCALE;
    }
  }
}

export default Bee;
