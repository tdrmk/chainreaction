import { ignoreErr } from "../../../utils/error";
import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./index.html";

const template = createTemplate(htmlcontents, { display: "block" });

const STATE = {
  ON: "ON",
  OFF: "OFF",
};

const SOUND_PREFERENCE = "sound_preference";
class SoundButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // load from local storage
    const savedstate = ignoreErr(() => localStorage.getItem(SOUND_PREFERENCE));
    this.state = Object.values(STATE).includes(savedstate)
      ? savedstate
      : STATE.ON;

    const onbtn = this.shadowRoot.querySelector("#volume-on");
    const offbtn = this.shadowRoot.querySelector("#volume-off");

    onbtn.style.display = this.state === STATE.ON ? "block" : "none";
    offbtn.style.display = this.state === STATE.ON ? "none" : "block";

    const onupdate = () => {
      this.dispatchEvent(
        new CustomEvent("volumechange", { detail: this.state })
      );

      // persist sound preference
      ignoreErr(() => localStorage.setItem(SOUND_PREFERENCE, this.state));
    };

    // event handlers
    onbtn.addEventListener("click", (event) => {
      this.state = STATE.OFF;
      onbtn.style.display = "none";
      offbtn.style.display = "block";
      onupdate();
    });

    offbtn.addEventListener("click", (event) => {
      this.state = STATE.ON;
      onbtn.style.display = "block";
      offbtn.style.display = "none";
      onupdate();
    });

    // notify initial state
    onupdate();
  }

  get enabled() {
    return this.state === STATE.ON;
  }
}

window.customElements.define("sound-button", SoundButton);
