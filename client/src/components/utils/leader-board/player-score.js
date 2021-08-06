import { createTemplate } from "../../../utils/shadowdom";
import { getplayercolor } from "../../chainreaction/chainreaction/utils";
import twcolors from "tailwindcss/colors";
import htmlcontents from "./player-score.html";

const template = createTemplate(htmlcontents, {
  display: "block",
  position: "relative",
  top: 0,
  "transition-property": "top",
  "transition-duration": "1000ms",
});

class PlayerScore extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const avatarviewer = this.shadowRoot.querySelector("avatar-viewer");
    const username = this.shadowRoot.querySelector("#username");
    const description = this.shadowRoot.querySelector("#description");
    const container = this.shadowRoot.querySelector("#container");

    const playercolor = getplayercolor(+this.getAttribute("turn"));
    avatarviewer.setAttribute("avatar-id", this.getAttribute("avatar-id"));
    description.textContent = this.getAttribute("description");
    username.textContent = this.getAttribute("username");
    username.style.color = playercolor;
    container.style.borderColor = playercolor;
  }

  static observedAttributes = ["score", "state", "eliminated"];
  attributeChangedCallback(attr, oldvalue, newvalue) {
    const state = this.shadowRoot.querySelector("#state");
    const container = this.shadowRoot.querySelector("#container");
    switch (attr) {
      case "score":
        this.shadowRoot.querySelector("#score").textContent =
          this.getAttribute("score");
        break;
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
          newvalue === null ? twcolors.white : twcolors.blueGray[200];
        break;
    }
  }
}

window.customElements.define("player-score", PlayerScore);
