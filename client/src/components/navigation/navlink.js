import { navigateTo } from "../../router";

/**
 * Similar to react-route-dom's NavLink
 * Use <a href="<path>" is='nav-link'>...</a> to prevent refresh
 */
class NavLink extends HTMLAnchorElement {
  connectedCallback() {
    this.addEventListener("click", this.clickhandler);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.clickhandler);
  }

  clickhandler = (event) => {
    event.preventDefault();
    const urlpath = this.getAttribute("href") || "#";
    navigateTo(urlpath);
  };
}

window.customElements.define("nav-link", NavLink, { extends: "a" });
