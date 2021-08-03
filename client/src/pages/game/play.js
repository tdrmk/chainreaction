import htmlcontents from "./play.html";
import { createTemplate } from "../../utils/shadowdom";
import toast from "../../components/utils/toast";

const template = createTemplate(htmlcontents, { display: "block" });

export default class PlayPage {
  round;
  moves = [];

  constructor(user, socket) {
    this.user = user;
    this.socket = socket;
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
    const turnboard = playpage.querySelector("#turnboard");
    const chat = playpage.querySelector("app-chat");
    const endroundbutton = playpage.querySelector("#endround");
    const username = playpage.querySelector("#username");
    const avatar = playpage.querySelector("#avatar");

    // populate template
    username.textContent = this.user.username;
    avatar.setAttribute("avatar-id", this.user.avatar_id);
    scoreboard.append(
      ...players.map(({ username, avatar_id }, turn) =>
        this.renderplayerscore(username, turn, avatar_id)
      )
    );
    turnboard.append(
      ...players.map(({ username }, turn) =>
        this.renderplayerturn(username, turn)
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
    // wait for it to get attached to DOM, to call methods on elements in template
    setTimeout(
      () => this.makemoves(chainreaction, sessiondetails, { animate: false }),
      0
    );

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

    // handle round updates
    root.querySelector("#round").textContent = `${round}`;
    root.querySelector("#rounds").textContent = `${rounds}`;
    const endroundbtn = root.querySelector("#endround");
    if (endroundbtn) {
      endroundbtn.style.visibility = gameover ? "visible" : "hidden";
    }

    // handle game updates
    const chainreaction = root.querySelector("chain-reaction");
    if (this.round !== round) {
      resetchainreaction(chainreaction);
      toast(`Starting Round ${round}!`, "success");
      this.round = round;
      this.moves = [];
    }
    setTimeout(async () => {
      await this.makemoves(chainreaction, sessiondetails);
      chainreaction.setAttribute("turn", turn);
      chainreaction.removeAttribute("winner");
      if (gameover) {
        chainreaction.setAttribute("winner", winner);
        chainreaction.setAttribute(
          "message",
          `${players[winner].username} won!`
        );
      }
    }, 0);

    // handle scoreboard and turnboard updates
    players.forEach(({ username, score, state }) => {
      root
        .querySelector(`player-score[username='${username}']`)
        .setAttribute("score", score);
      root
        .querySelector(`player-turn[username='${username}']`)
        .setAttribute("state", state);
    });
    upcoming.forEach((turn, index) => {
      root
        .querySelector(`player-turn[turn='${turn}']`)
        .setAttribute("score", 10000 - index);
    });
    disconnected.forEach((turn, index) => {
      root
        .querySelector(`player-turn[turn='${turn}']`)
        .setAttribute("score", 1000 - index);
    });
    eliminated.forEach((turn, index) => {
      root
        .querySelector(`player-turn[turn='${turn}']`)
        .setAttribute("score", 100 - index);
    });
  }

  // ========= utilities ==========
  renderplayerscore = (username, turn, avatar_id) => {
    const playerscore = document.createElement("player-score");
    playerscore.setAttribute("username", username);
    playerscore.setAttribute("turn", turn);
    playerscore.setAttribute("avatar-id", avatar_id);
    playerscore.setAttribute("score", 0);
    return playerscore;
  };

  renderplayerturn = (username, turn) => {
    const playerturn = document.createElement("player-turn");
    playerturn.setAttribute("username", username);
    playerturn.setAttribute("turn", turn);
    playerturn.setAttribute("score", 0);
    return playerturn;
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
  });
}
