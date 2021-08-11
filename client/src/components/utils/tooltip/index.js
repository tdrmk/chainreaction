import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./index.html";

const template = createTemplate(htmlcontents);

/**
  Wrap the component which needs tooltip with app-tooltip component.
  <app-tooltip message="">
    ...
  </app-tooltip>
 */

class Tooltip extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.shadowRoot.querySelector("#message").textContent =
      this.getAttribute("message");
  }
}

window.customElements.define("app-tooltip", Tooltip);
