import { navigateTo } from "../../router";

/**
 * Similar to react-route-dom's Redirect
 * Use <nav-redirect to='<path>'>...</nav-redirect> when you need to render a component, but wish to redirect
 */
class Redirect extends HTMLElement {
  connectedCallback() {
    navigateTo(this.getAttribute("to") || "/");
  }
}

window.customElements.define("nav-redirect", Redirect);
