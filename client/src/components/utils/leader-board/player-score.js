import { createTemplate } from "../../../utils/shadowdom";
import { getplayercolor } from "../../chainreaction/chainreaction/utils";
import twcolors from "tailwindcss/colors";
import htmlcontents from "./player-score.html";
import skipmodalhtml from "./skip-player-modal.html";

const template = createTemplate(htmlcontents, {
  display: "block",
  position: "relative",
  top: 0,
  "transition-property": "top",
  "transition-duration": "500ms",
});

const skipmodaltemplate = createTemplate(skipmodalhtml);

/**
  player-score
    Evolved from a component simply indicating player score to
    showing player related statuses, skip action buttons, etc

    Static Attributes
  - username
  - avatar-id
  - turn
  - description (optional)

  Dynamic Attributes
  - score - indicating current player score
  - state - indicating connection status
  - eliminated - indicating game related player status
  - skipped - indicates if admin blocked user (user can't make a move, turn is skipped)
  - options - whether to show skip action buttons or not
  - disabled - whether to disable action buttons or not
 */
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
    const playbtn = this.shadowRoot.querySelector("#play");
    const pausebtn = this.shadowRoot.querySelector("#pause");

    // populate contents
    const playercolor = getplayercolor(+this.getAttribute("turn"));
    avatarviewer.setAttribute("avatar-id", this.getAttribute("avatar-id"));
    description.textContent = this.getAttribute("description");
    username.textContent = this.getAttribute("username");
    username.style.color = playercolor;
    container.style.borderColor = playercolor;

    // setup event handlers
    playbtn.addEventListener("click", (event) => {
      event.preventDefault();
      this.dispatchEvent(new CustomEvent("skip", { detail: false }));
    });

    pausebtn.addEventListener("click", (event) => {
      event.preventDefault();
      // show modal to confirm action
      const modalfragment = skipmodaltemplate.content.cloneNode(true);
      const modal = modalfragment.querySelector("app-modal");
      const confirmbtn = modal.querySelector("#confirm");
      const cancelbtn = modal.querySelector("#cancel");
      const username = modal.querySelector("#username");

      // populate fields
      username.textContent = this.getAttribute("username");
      username.style.color = playercolor;

      // handle events
      cancelbtn.addEventListener("click", () => modal.remove());
      confirmbtn.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("skip", { detail: true }));
        modal.remove();
      });

      document.body.appendChild(modalfragment);
    });
  }

  static observedAttributes = [
    "score",
    "state",
    "eliminated",
    "skipped",
    "options",
    "disabled",
  ];

  attributeChangedCallback(attr, oldvalue, newvalue) {
    const state = this.shadowRoot.querySelector("#state");
    const container = this.shadowRoot.querySelector("#container");
    const skipped = this.shadowRoot.querySelector("#skipped");
    const btncontainer = this.shadowRoot.querySelector("#btn-container");
    const playbtn = this.shadowRoot.querySelector("#play");
    const pausebtn = this.shadowRoot.querySelector("#pause");

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
      case "skipped":
        // whether the player was skipped or not
        // correspondingly show the associated action button
        skipped.style.display = newvalue === null ? "none" : "block";
        playbtn.style.display = newvalue === null ? "none" : "block";
        pausebtn.style.display = newvalue === null ? "block" : "none";
        break;
      case "options":
        // whether to show the action button or not
        btncontainer.style.display = newvalue === null ? "none" : "contents";
        break;
      case "disabled":
        // whether to disable the action button's or not
        playbtn.disabled = newvalue !== null;
        pausebtn.disabled = newvalue !== null;
        break;
    }
  }
}

window.customElements.define("player-score", PlayerScore);
