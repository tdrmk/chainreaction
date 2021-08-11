const EventEmitter = require("events");
class Player extends EventEmitter {
  static STATES = {
    CONNECTED: "CONNECTED",
    DISCONNECT_WAIT: "DISCONNECT_WAIT",
    DISCONNECTED: "DISCONNECTED",
  };

  static WAIT_MS = 30000; // 30s
  constructor(user) {
    super();
    // extract out required details
    this.username = user.username;
    this.avatar_id = user.avatar_id;

    this.state = Player.STATES.CONNECTED;
    // used to skip a connected players' turn
    // typically admin should decide
    this.skipped = false;
    this.timeoutid = null;
  }

  disconnect() {
    this.state = Player.STATES.DISCONNECT_WAIT;
    this.timeoutid = setTimeout(() => {
      // dispatch event to indicate asynchronous updates
      this.state = Player.STATES.DISCONNECTED;
      this.emit("update");
    }, Player.WAIT_MS);
  }

  skip(skipped) {
    this.skipped = skipped;
  }

  connect() {
    clearTimeout(this.timeoutid);
    this.state = Player.STATES.CONNECTED;
  }

  get active() {
    return this.state !== Player.STATES.DISCONNECTED && !this.skipped;
  }
}

module.exports = Player;
