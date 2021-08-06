import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./index.html";

const template = createTemplate(htmlcontents);

class ChainReactionLocal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    const select = this.shadowRoot.querySelector("select");
    const resetbutton = this.shadowRoot.querySelector("button");
    const chainreaction = this.shadowRoot.querySelector("chain-reaction");

    // utility chain reaction methods
    const eliminated = (turn) => {
      const numplayers = +select.value;
      const totalmass = chainreaction.totalmass;
      const firstmove = totalmass < numplayers;
      const mass = chainreaction.mass(turn);
      return !firstmove && !mass;
    };

    const nextturn = () => {
      const numplayers = +select.value;
      for (let i = 1; i < numplayers; i++) {
        const turn = (chainreaction.turn + i) % numplayers;
        if (eliminated(turn)) continue;
        chainreaction.setAttribute("turn", turn);
        chainreaction.setAttribute("player", turn);
        return;
      }
      chainreaction.setAttribute("winner", chainreaction.turn);
    };

    const reset = () => {
      chainreaction.removeAttribute("winner");
      chainreaction.removeAttribute("loading");
      chainreaction.removeAttribute("disabled");
      chainreaction.removeAttribute("message");
      chainreaction.setAttribute("turn", 0);
      chainreaction.setAttribute("player", 0);
      chainreaction.querySelectorAll("chain-reaction-cell").forEach((cell) => {
        cell.setAttribute("mass", 0);
        cell.setAttribute("player", 0);
        cell.removeAttribute("highlight");
      });
    };

    // event handlers
    select.addEventListener("change", (event) => {
      event.stopPropagation();
      reset();
    });

    resetbutton.addEventListener("click", (event) => {
      event.stopPropagation();
      reset();
    });

    chainreaction.addEventListener("cell-click", async (event) => {
      event.stopPropagation();
      const { row, column } = event.detail;
      chainreaction.setAttribute("disabled", "");
      await chainreaction.add(chainreaction.turn, { row, column });
      nextturn();
      chainreaction.removeAttribute("disabled");
    });
  }
}

window.customElements.define("chain-reaction-local", ChainReactionLocal);
