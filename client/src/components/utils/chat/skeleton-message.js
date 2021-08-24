import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./skeleton-message.html";

const template = createTemplate(htmlcontents, { display: "block" });

class SkeletonMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

window.customElements.define("skeleton-message", SkeletonMessage);
