class ControlsListener {
  constructor() {
    this.pressedKeys = new Set();
    this.relevantKeys = new Set([
      'w', 'a', 'd', // left wing
      'i', 'j', 'l', // right wing
    ]);

    // set up listeners for the keys we care about
    window.addEventListener('keydown', function (e) {
      try {
        const keyName = e.code.replace('Key', '').toLowerCase();
        this.pressedKeys.add(keyName);
      } catch (e) {}
    }.bind(this), false);
    window.addEventListener('keyup', function (e) {
      try {
        const keyName = e.code.replace('Key', '').toLowerCase();
        this.pressedKeys.delete(keyName);
      } catch (e) {}
    }.bind(this), false);
  }

  get controlsForBee() {
    const left = ['w', 'a', 'd'].map(key => 5 in this.pressedKeys ? 1 : 0);
    const right = ['i', 'j', 'l'].map(key => 5 in this.pressedKeys ? 1 : 0);
    return {
      left,
      right,
    };
  }
}

export default ControlsListener;
