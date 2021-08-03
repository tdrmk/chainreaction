import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./user-message.html";

const template = createTemplate(htmlcontents, { display: "block" });

class UserMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

window.customElements.define("user-message", UserMessage);
