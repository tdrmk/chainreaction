import htmlcontents from "./play.html";
import { createTemplate } from "../../utils/shadowdom";
import toast from "../../components/utils/toast";
import { Deferred } from "../../utils/time";
import debug from "debug";
import notificationsound from "../../assets/notification.mp3";

const log = debug("chainreaction:play");

const template = createTemplate(htmlcontents, { display: "block" });

export default class PlayPage {
  round;
  moves = [];
  messages = []; // stores ALL messages

  constructor(user, socket) {
    this.user = user;
    this.socket = socket;
    this.deferred = new Deferred("play");
    this.turnnotification = new TurnNotification();
  }

  render(sessiondetails) {
    const {
      admin,
      round,
      rounds,
      players,
      gameconfig: { rows, columns },
      gamedetails: { turn },
    } = sessiondetails;

    // initialize state
    this.round = round;

    const playpage = template.content.cloneNode(true);
    const chainreaction = playpage.querySelector("chain-reaction");
    const scoreboard = playpage.querySelector("#scoreboard");
    const chat = playpage.querySelector("app-chat");
    const endroundbutton = playpage.querySelector("#endround");
    const addroundbutton = playpage.querySelector("#addround");
    const soundbutton = playpage.querySelector("sound-button");

    // populate template
    scoreboard.append(
      ...players.map(({ username, avatar_id }, turn) =>
        this.renderplayerscore(username, turn, avatar_id, admin)
      )
    );
    chat.setAttribute("username", this.user.username);
    chat.setAttribute("avatar-id", this.user.avatar_id);

    chainreaction.setAttribute("rows", rows);
    chainreaction.setAttribute("columns", columns);
    chainreaction.setAttribute(
      "player",
      players.findIndex((player) => player.username === this.user.username)
    );
    chainreaction.setAttribute("turn", turn);

    if (this.user.username !== admin) {
      endroundbutton.remove();
      addroundbutton.remove();
    }

    this.turnnotification.soundbutton = soundbutton;

    // event handlers
    chat.addEventListener("user-typing", (event) => {
      event.preventDefault();
      this.socket.emit("user-typing");
    });

    chat.addEventListener("user-message", (event) => {
      event.preventDefault();
      const message = event.detail;
      this.socket.emit("user-message", message);
    });
    chainreaction.addEventListener("cell-click", (event) => {
      const { row, column } = event.detail;
      chainreaction.setAttribute("disabled", "");
      this.socket.emit("move", { row, column }, (err) => {
        chainreaction.removeAttribute("disabled");
        if (err) {
          toast(`Cannot Make Move. Reason: ${err}`, "failure");
        }
      });
    });
    endroundbutton.addEventListener("click", (event) => {
      event.preventDefault();
      endroundbutton.setAttribute("disabled", "");
      this.socket.emit("endround", (err) => {
        endroundbutton.removeAttribute("disabled");
        if (err) {
          toast(`Cannot End Round. Reason: ${err}`, "failure");
        }
      });
    });

    addroundbutton.addEventListener("click", (event) => {
      event.preventDefault();
      addroundbutton.setAttribute("disabled", "");
      this.socket.emit("addround", (err) => {
        addroundbutton.removeAttribute("disabled");
        if (err) {
          toast(`Cannot Add Round. Reason: ${err}`, "failure");
        }
      });
    });

    // Elements methods are accessible only after it attaches to DOM in case of template
    this.deferred.chain(() =>
      this.makemoves(chainreaction, sessiondetails, { animate: false })
    );

    return playpage;
  }

  async makemoves(chainreaction, sessiondetails, { animate = true } = {}) {
    const {
      gamedetails: { moves },
    } = sessiondetails;
    for (let i = this.moves.length; i < moves.length; i++) {
      const { row, column, turn } = moves[i];
      await chainreaction.add(turn, { row, column }, animate);
    }
    this.moves = moves;
  }

  update(root, sessiondetails) {
    const {
      round,
      rounds,
      players,
      gamedetails: {
        turn,
        turns: { upcoming, disconnected, eliminated },
        winner,
        gameover,
      },
      messagescount,
    } = sessiondetails;
    const chainreaction = root.querySelector("chain-reaction");

    // handle round related updates, if any
    this.deferred.chain(() => {
      if (this.round !== round) {
        this.round = round;
        this.moves = [];
        resetchainreaction(chainreaction);
        toast(`Starting Round ${round}!`, "success");
      }
      root.querySelector("#round").textContent = `${round}`;
      root.querySelector("#rounds").textContent = `${rounds}`;
    });

    // make the moves
    this.deferred.chain(() => this.makemoves(chainreaction, sessiondetails));

    // update turn and indicate winner, if any
    this.deferred.chain(() => {
      const myturn = players[turn].username === this.user.username && !gameover;
      root.querySelector("#turn-indicator").style.visibility = myturn
        ? "visible"
        : "hidden";
      this.turnnotification.onturnupdate(myturn);
      chainreaction.setAttribute("turn", turn);
      chainreaction.removeAttribute("winner");
      if (gameover) {
        chainreaction.setAttribute("winner", winner);
        const winnerusername = players[winner].username;
        chainreaction.setAttribute(
          "message",
          winnerusername === this.user.username
            ? "Congratulations!"
            : `${winnerusername} won!`
        );
      }
    });

    // update turnboard
    this.deferred.chain(() => {
      // update scores
      players.forEach(({ username, score, state, skipped }) => {
        const scoreitem = root.querySelector(
          `player-score[username='${username}']`
        );
        scoreitem.setAttribute("score", score);
        scoreitem.setAttribute("state", state);
        scoreitem.toggleAttribute("skipped", skipped);
      });

      // update order of scoreboard entries
      let turnorder = players.length;
      upcoming.forEach((turn) => {
        const scoreitem = root.querySelector(`player-score[turn='${turn}']`);
        scoreitem.setAttribute("turnorder", turnorder--);
        scoreitem.removeAttribute("eliminated");
      });
      disconnected.forEach((turn) => {
        const scoreitem = root.querySelector(`player-score[turn='${turn}']`);
        scoreitem.setAttribute("turnorder", turnorder--);
        scoreitem.removeAttribute("eliminated");
      });
      eliminated.forEach((turn) => {
        const scoreitem = root.querySelector(`player-score[turn='${turn}']`);
        scoreitem.setAttribute("turnorder", turnorder--);
        scoreitem.setAttribute("eliminated", "true");
      });
    });

    // show round button, if required
    this.deferred.chain(() => {
      const endroundbtn = root.querySelector("#endround");
      const addroundbtn = root.querySelector("#addround");
      if (endroundbtn) {
        endroundbtn.style.display = gameover ? "flex" : "none";
        if (round === rounds) endroundbtn.textContent = "End Game";
      }
      if (addroundbtn) {
        addroundbtn.style.display =
          round === rounds && gameover ? "flex" : "none";
      }
    });

    // fetch messages if all not available
    if (this.messages.length < messagescount) {
      const chat = root.querySelector("app-chat");
      this.fetchmessages(this.messages.length, messagescount).then(
        (usermessages) => {
          usermessages.forEach(({ username, avatar_id, message, index }) => {
            this.addmessage(chat, { username, avatar_id, message, index });
          });
        }
      );
    }
  }

  addmessage = (chat, { username, avatar_id, message, index }) => {
    log(`got message at ${index}...`);
    this.messages[index] = { username, avatar_id, message };
    if (username === this.user.username) {
      chat?.addUserMessage?.(message, index);
    } else {
      chat?.addOtherMessage?.(username, message, avatar_id, index);
    }
  };

  fetchmessages = (start, end) => {
    return new Promise((resolve) => {
      log(`fetching messages from ${start} to ${end}...`);
      this.socket.emit("fetch-messages", start, end, (usermessages) => {
        resolve(usermessages);
      });
    });
  };

  onusermessage = (root, { username, avatar_id, message, index }) => {
    const chat = root.querySelector("app-chat");
    if (this.messages.length < index) {
      // some missing messages
      this.fetchmessages(this.messages.length, index).then((usermessages) => {
        usermessages.forEach(({ username, avatar_id, message, index }) => {
          this.addmessage(chat, { username, avatar_id, message, index });
        });
      });
    }
    this.addmessage(chat, { username, avatar_id, message, index });
  };

  // ========= utilities ==========
  renderplayerscore = (username, turn, avatar_id, admin) => {
    let description;
    if (username === admin) description = "(admin)";
    if (username === this.user.username) description = "(you)";
    const playerscore = document.createElement("player-score");
    playerscore.setAttribute("username", username);
    if (description) playerscore.setAttribute("description", description);
    playerscore.setAttribute("turn", turn);
    playerscore.setAttribute("avatar-id", avatar_id);
    playerscore.setAttribute("score", 0);
    playerscore.setAttribute("turnorder", 0);
    playerscore.toggleAttribute("options", this.user.username === admin);
    playerscore.addEventListener("skip", (event) => {
      event.stopPropagation();
      const skipped = event.detail;

      playerscore.setAttribute("disabled", "");
      this.socket.emit("skip", { username, skipped }, (err) => {
        playerscore.removeAttribute("disabled");
        if (err) {
          toast(`Cannot (un)skip. Reason: ${err}`, "failure");
        }
      });
    });
    return playerscore;
  };
}

function resetchainreaction(chainreaction) {
  chainreaction.removeAttribute("winner");
  chainreaction.removeAttribute("loading");
  chainreaction.removeAttribute("disabled");
  chainreaction.removeAttribute("message");
  chainreaction.querySelectorAll("chain-reaction-cell").forEach((cell) => {
    cell.setAttribute("mass", 0);
    cell.setAttribute("player", 0);
    cell.removeAttribute("highlight");
  });
}

class TurnNotification {
  constructor() {
    this.audio = new Audio(notificationsound);
    this.audio.volume = 0.5; // keep a low volume
    this.enabled = true;

    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement/Audio#determining_when_playback_can_begin
    this.loaded = false;
    this.audio.addEventListener("canplaythrough", () => {
      this.loaded = true;
    });

    // boolean indicating `already notified user of turn?`
    this.played = false;
  }

  async onturnupdate(myturn) {
    if (!this.loaded || !this.enabled) return;

    if (!myturn) {
      this.played = false;
      this.audio.pause();
      this.audio.currentTime = 0;
      return;
    }

    if (this.played) return;

    try {
      await this.audio.play();
      this.played = true;
    } catch (err) {}
  }

  set soundbutton(soundbutton) {
    soundbutton.addEventListener("volumechange", (event) => {
      this.enabled = soundbutton.enabled;
      if (!this.enabled) {
        this.played = false;
        this.audio.pause();
        this.audio.currentTime = 0;
      }
    });
  }
}
