import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./index.html";

const USERNAME_REGEX = /^\w{4,20}$/;
const PASSWORD_REGEX = /^.{4,20}$/;

const template = createTemplate(htmlcontents);

class Login extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // input elements
    this.usernameinput = this.shadowRoot.querySelector("input#username");
    this.passwordinput = this.shadowRoot.querySelector("input#password");
    this.remembermecheckbox = this.shadowRoot.querySelector("#remember-me");

    // error message containers
    this.usernameerror = this.shadowRoot.querySelector("#username-error");
    this.passworderror = this.shadowRoot.querySelector("#password-error");

    this.submitbutton = this.shadowRoot.querySelector("button[type='submit']");

    const form = this.shadowRoot.querySelector("form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopPropagation();

      // current input values ..
      const username = this.usernameinput.value;
      const password = this.passwordinput.value;
      const remember_me = this.remembermecheckbox.checked;

      // check for errors
      const isvalidusername = USERNAME_REGEX.test(username);
      this.usernameinput.classList.toggle("ring-red-500", !isvalidusername);
      this.usernameinput.classList.toggle("ring-2", !isvalidusername);
      this.usernameerror.innerText = isvalidusername ? "" : "invalid username";

      const isvalidpassword = PASSWORD_REGEX.test(password);
      this.passwordinput.classList.toggle("ring-red-500", !isvalidpassword);
      this.passwordinput.classList.toggle("ring-2", !isvalidpassword);
      this.passworderror.innerText = isvalidpassword ? "" : "invalid password";

      if (isvalidusername && isvalidpassword) {
        this.dispatchEvent(
          new CustomEvent("login", {
            detail: { username, password, remember_me },
          })
        );
      }
    });
  }

  clear() {
    this.usernameinput.value = "";
    this.passwordinput.value = "";
    this.remembermecheckbox.checked = false;

    this.usernameerror.textContent = "";
    this.passworderror.textContent = "";
  }

  static observedAttributes = ["disabled"];
  attributeChangedCallback(attr, old, value) {
    switch (attr) {
      case "disabled":
        this.submitbutton.disabled = value !== null;
        break;
    }
  }
}

window.customElements.define("user-login", Login);
