import htmlcontents from "./play.html";
import { createTemplate } from "../../utils/shadowdom";
import toast from "../../components/utils/toast";
import { Deferred } from "../../utils/time";

const template = createTemplate(htmlcontents, { display: "block" });

export default class PlayPage {
  round;
  moves = [];

  constructor(user, socket) {
    this.user = user;
    this.socket = socket;
    this.deferred = new Deferred("play");
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

    if (this.user.username !== admin) endroundbutton.remove();

    // event handlers
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
      chainreaction.setAttribute("turn", turn);
      chainreaction.removeAttribute("winner");
      if (gameover) {
        chainreaction.setAttribute("winner", winner);
        chainreaction.setAttribute(
          "message",
          `${players[winner].username} won!`
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
      if (endroundbtn) {
        endroundbtn.style.visibility = gameover ? "visible" : "hidden";
        if (round === rounds) endroundbtn.textContent = "End Game";
      }
    });
  }

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
