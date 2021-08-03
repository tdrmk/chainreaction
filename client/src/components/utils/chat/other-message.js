import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./other-message.html";

const template = createTemplate(htmlcontents, { display: "block" });

class OtherMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

window.customElements.define("other-message", OtherMessage);
