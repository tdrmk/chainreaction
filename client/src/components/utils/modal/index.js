import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./index.html";

const template = createTemplate(htmlcontents);

/*
  Just a base modal, overlay with close button.
*/
class Modal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    const closebutton = this.shadowRoot.querySelector("button");
    closebutton.addEventListener("click", () => this.remove());
  }
}

window.customElements.define("app-modal", Modal);
