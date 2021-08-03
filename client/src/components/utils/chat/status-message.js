import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./status-message.html";

const template = createTemplate(htmlcontents, { display: "block" });

class StatusMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

window.customElements.define("status-message", StatusMessage);
