import { createTemplate } from "../../../utils/shadowdom";
import { getplayercolor } from "../../chainreaction/chainreaction/utils";
import htmlcontents from "./player-turn.html";
import twcolors from "tailwindcss/colors";

const template = createTemplate(htmlcontents, {
  display: "block",
  position: "relative",
  top: 0,
  "transition-property": "top",
  "transition-duration": "1000ms",
});

class PlayerTurn extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const username = this.shadowRoot.querySelector("#username");
    const container = this.shadowRoot.querySelector("#container");

    const playercolor = getplayercolor(+this.getAttribute("turn"));

    username.textContent = this.getAttribute("username");
    username.style.color = playercolor;
    container.style.borderColor = playercolor;
  }

  static observedAttributes = ["state", "eliminated"];
  attributeChangedCallback(attr, oldvalue, newvalue) {
    const container = this.shadowRoot.querySelector("#container");
    const state = this.shadowRoot.querySelector("#state");
    switch (attr) {
      case "state":
        state.style.backgroundColor =
          newvalue === "CONNECTED"
            ? twcolors.emerald[500]
            : newvalue === "DISCONNECT_WAIT"
            ? twcolors.orange[400]
            : twcolors.red[500];
        break;
      case "eliminated":
        container.style.backgroundColor =
          newvalue === null ? twcolors.white : twcolors.blueGray[400];
        break;
    }
  }
}

window.customElements.define("player-turn", PlayerTurn);
