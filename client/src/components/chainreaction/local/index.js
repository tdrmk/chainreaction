import { createTemplate } from "../../../utils/shadowdom";
import { Deferred, wait } from "../../../utils/time";
import htmlcontents from "./index.html";

const template = createTemplate(htmlcontents);

class ChainReactionLocal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // DOM references
    this.select = this.shadowRoot.querySelector("select");
    this.resetbutton = this.shadowRoot.querySelector("button");
    this.chainreaction = this.shadowRoot.querySelector("chain-reaction");

    // state variables
    this.deferred = new Deferred("local");
    this.moves = 0;

    // event handlers
    this.select.addEventListener("change", (event) => {
      event.stopPropagation();
      this.deferred.chain(() => this.reset());
    });

    this.resetbutton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.deferred.chain(() => this.reset());
    });

    this.chainreaction.addEventListener("cell-click", (event) => {
      event.stopPropagation();
      const { row, column } = event.detail;
      this.deferred.chain(async () => {
        await this.makemove(row, column);
        if (this.againstAI && !this.chainreaction.gameover) {
          this.worker.postMessage({
            type: "choose-move",
            payload: { player: this.chainreaction.turn },
          });
          // wait for sometime before AI makes a move
          await wait(500);
        }
      });
    });
  }

  // Is Playing Against Computer
  // expected select value of type `ai-<difficulty>`
  get againstAI() {
    return /^ai/.test(this.select.value);
  }

  // Number of Players, (Derived from selected)
  get numplayers() {
    return this.againstAI ? 2 : +this.select.value;
  }

  eliminated = (turn) => {
    const firstmove = this.moves < this.numplayers;
    const mass = this.chainreaction.mass(turn);
    return !firstmove && !mass;
  };

  nextturn = () => {
    this.moves += 1;
    for (let i = 1; i < this.numplayers; i++) {
      const turn = (this.chainreaction.turn + i) % this.numplayers;
      if (this.eliminated(turn)) continue;
      this.chainreaction.setAttribute("turn", turn);
      if (!this.againstAI) this.chainreaction.setAttribute("player", turn);
      return;
    }
    this.chainreaction.setAttribute("winner", this.chainreaction.turn);
  };

  makemove = async (row, column) => {
    this.chainreaction.setAttribute("disabled", "");
    await this.chainreaction.add(this.chainreaction.turn, { row, column });
    if (this.againstAI)
      this.worker.postMessage({
        type: "move",
        payload: { row, column, player: this.chainreaction.turn },
      });
    this.nextturn();
    this.chainreaction.removeAttribute("disabled");
  };

  reset = () => {
    this.moves = 0;
    this.chainreaction.removeAttribute("winner");
    this.chainreaction.removeAttribute("loading");
    this.chainreaction.removeAttribute("disabled");
    this.chainreaction.removeAttribute("message");
    this.chainreaction.setAttribute("turn", 0);
    this.chainreaction.setAttribute("player", 0);
    this.chainreaction
      .querySelectorAll("chain-reaction-cell")
      .forEach((cell) => {
        cell.setAttribute("mass", 0);
        cell.setAttribute("player", 0);
        cell.removeAttribute("highlight");
      });
    if (this.againstAI) {
      // notify worker about desired difficulty
      const difficulty = this.select.value.substr(3);
      this.worker.postMessage({
        type: "reset",
        payload: { difficulty },
      });
    }
  };

  connectedCallback() {
    // Worker will run the computations regarding next move
    this.worker = new Worker(new URL("./worker-bot.js", import.meta.url));
    this.worker.addEventListener("message", (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case "move": {
          const { row, column } = payload;
          this.deferred.chain(async () => {
            await this.makemove(row, column);
          });
          break;
        }
      }
    });
  }

  disconnectedCallback() {
    this.worker.terminate();
  }
}

window.customElements.define("chain-reaction-local", ChainReactionLocal);
