import { createTemplate } from "../../../utils/shadowdom";
import { getplayercolor } from "../../chainreaction/chainreaction/utils";
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
    const container = this.shadowRoot.querySelector("#container");

    const playercolor = getplayercolor(+this.getAttribute("turn"));

    avatarviewer.setAttribute("avatar-id", this.getAttribute("avatar-id"));
    username.textContent = this.getAttribute("username");
    username.style.color = playercolor;
    container.style.borderColor = playercolor;
  }

  static observedAttributes = ["score"];
  attributeChangedCallback() {
    this.shadowRoot.querySelector("#score").textContent =
      this.getAttribute("score");
  }
}

window.customElements.define("player-score", PlayerScore);
