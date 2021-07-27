import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./index.html";

const USERNAME_REGEX = /^\w{4,20}$/;
const PASSWORD_REGEX = /^.{4,20}$/;

const template = createTemplate(htmlcontents);

class Signup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // input elements
    this.usernameinput = this.shadowRoot.querySelector("input#username");
    this.passwordinput = this.shadowRoot.querySelector("input#password");
    this.avatarpicker = this.shadowRoot.querySelector("avatar-picker");

    // caption message containers
    this.usernamecaption = this.shadowRoot.querySelector("#username-caption");
    this.passwordcaption = this.shadowRoot.querySelector("#password-caption");

    this.submitbutton = this.shadowRoot.querySelector("button[type='submit']");

    const form = this.shadowRoot.querySelector("form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopPropagation();

      // current input values ..
      const username = this.usernameinput.value;
      const password = this.passwordinput.value;
      const avatar_id = this.avatarpicker.getAttribute("avatar-id");

      // check for errors
      const isvalidusername = USERNAME_REGEX.test(username);
      this.usernameinput.classList.toggle("ring-red-500", !isvalidusername);
      this.usernameinput.classList.toggle("ring-2", !isvalidusername);
      this.usernamecaption.classList.toggle("text-red-500", !isvalidusername);

      const isvalidpassword = PASSWORD_REGEX.test(password);
      this.passwordinput.classList.toggle("ring-red-500", !isvalidpassword);
      this.passwordinput.classList.toggle("ring-2", !isvalidpassword);
      this.passwordcaption.classList.toggle("text-red-500", !isvalidpassword);

      if (isvalidusername && isvalidpassword) {
        this.dispatchEvent(
          new CustomEvent("signup", {
            detail: { username, password, avatar_id },
          })
        );
      }
    });
  }

  clear() {
    this.usernameinput.value = "";
    this.passwordinput.value = "";
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

window.customElements.define("user-signup", Signup);
