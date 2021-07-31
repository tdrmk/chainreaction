const EventEmitter = require("events");
const ChainReaction = require("./chainreaction");
const Player = require("./player");

class Session extends EventEmitter {
  static STATES = {
    NEW: "NEW",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
  };

  constructor(gameid, admin) {
    super();
    this.gameid = gameid;
    this.admin = admin;
    this.state = Session.STATES.NEW;

    /** @type {Player[]} */ this.players = [];
    this.gameconfig = undefined;
    /** @type {ChainReaction[]} */ this.games = [];
    this.rounds = 0;
  }

  participate(user) {
    if (this.state === Session.STATES.NEW) return true;
    if (this.state === Session.STATES.DONE) return false;
    if (this.players.some((player) => player.username === user.username))
      return true;
    return false;
  }

  join(user) {
    switch (this.state) {
      case Session.STATES.NEW: {
        if (this.players.some((player) => player.username === user.username))
          return;

        const player = new Player(user);
        player.on("update", () => {
          const game = this.games[this.games.length - 1];
          game?.handleplayerstateupdate();
          this.emit("update");
        });
        this.players.push(player);
        break;
      }
      case Session.STATES.DONE:
        throw new Error("session over");

      case Session.STATES.IN_PROGRESS: {
        const player = this.getplayer(user);
        if (!player) throw new Error("can't join in progress game");
        player.connect();
        const game = this.games[this.games.length - 1];
        game.handleplayerstateupdate();
        break;
      }
    }
  }

  disconnect(user) {
    switch (this.state) {
      case Session.STATES.NEW:
        this.players = this.players.filter(
          (player) => player.username !== user.username
        );
        break;
      case Session.STATES.DONE:
        // states don't matter much
        break;
      case Session.STATES.IN_PROGRESS:
        const player = this.getplayer(user);
        if (!player) return;
        player.disconnect();
        break;
    }
  }

  start(user, { rows, columns, rounds }) {
    if (this.state !== Session.STATES.NEW) throw new Error("session started");
    if (this.players.length <= 1) throw new Error("insufficient players");
    if (rows <= 1) throw new Error("insufficient rows");
    if (rows >= 15) throw new Error("excessive rows");
    if (columns <= 1) throw new Error("insufficient columns");
    if (columns >= 15) throw new Error("excessive columns");
    if (rounds < 1) throw new Error("insufficient rounds");
    if (rounds > 5) throw new Error("excessive rounds");
    if (user.username !== this.admin) throw new Error("not admin");

    this.state = Session.STATES.IN_PROGRESS;
    this.rounds = rounds;
    this.gameconfig = { rows, columns };
    this.games.push(new ChainReaction(this.gameconfig, this.players));
  }

  move(user, { row, column }) {
    if (this.state !== Session.STATES.IN_PROGRESS)
      throw new Error("game not in progress");

    const game = this.games[this.games.length - 1];
    const player = this.getplayer(user);

    if (!player) throw new Error("not playing");
    game.add(player, { row, column });
  }

  endround(user) {
    if (this.state !== Session.STATES.IN_PROGRESS)
      throw new Error("session not in progress");

    if (user.username !== this.admin) throw new Error("not admin");
    const game = this.games[this.games.length - 1];
    if (!game.gameover) throw new Error("game in progress");

    const activeplayers = this.players.filter((player) => player.active).length;
    if (activeplayers <= 1) {
      // insufficient players
      this.state = Session.STATES.DONE;
      return;
    }

    if (this.rounds <= this.games.length) {
      // rounds done
      this.state = Session.STATES.DONE;
      return;
    }

    this.games.push(new ChainReaction(this.gameconfig, this.players));
  }

  getplayer(user) {
    return this.players.find((player) => player.username === user.username);
  }
}

module.exports = Session;
