import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./index.html";

const template = createTemplate(htmlcontents, { display: "block" });

const STATE = {
  ON: "ON",
  OFF: "OFF",
};

class SoundButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // state
    this.state = STATE.ON;

    const onbtn = this.shadowRoot.querySelector("#volume-on");
    const offbtn = this.shadowRoot.querySelector("#volume-off");

    onbtn.style.display = this.state === STATE.ON ? "block" : "none";
    offbtn.style.display = this.state === STATE.ON ? "none" : "block";

    // event handlers
    onbtn.addEventListener("click", (event) => {
      this.state = STATE.OFF;
      onbtn.style.display = "none";
      offbtn.style.display = "block";
    });

    offbtn.addEventListener("click", (event) => {
      this.state = STATE.ON;
      onbtn.style.display = "block";
      offbtn.style.display = "none";
    });
  }

  get enabled() {
    return this.state === STATE.ON;
  }
}

window.customElements.define("sound-button", SoundButton);
