import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./index.html";

const template = createTemplate(htmlcontents, { display: "block" });

/*

  <app-chat username="" avatar-id=""> </app-chat>
  Use `addUserMessage`, `addOtherMessage` and `addStatusMessage` methods to add messages.

  Dispatches `user-message` custom event, when user clicks submit button with input message.

*/
class Chat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // wrap methods to handle scroll as well
    this.addUserMessage = this.handleScroll(this.addUserMessage);
    this.addOtherMessage = this.handleScroll(this.addOtherMessage);
    this.addStatusMessage = this.handleScroll(this.addStatusMessage);

    const submitbutton = this.shadowRoot.querySelector("button");
    submitbutton.addEventListener("click", (event) => {
      event.stopPropagation();
      const input = this.shadowRoot.querySelector("input");
      const message = input.value.trim();

      if (message) {
        // this.addUserMessage(message);
        this.dispatchEvent(
          new CustomEvent("user-message", { detail: message })
        );
      }
      input.value = "";
    });
  }

  constructmessagefragment(username, message, avatar_id) {
    const fragment = document.createDocumentFragment();

    const usernameSpan = fragment.appendChild(document.createElement("span"));
    usernameSpan.textContent = username;
    usernameSpan.slot = "username";

    const messageSpan = fragment.appendChild(document.createElement("span"));
    messageSpan.textContent = message;
    messageSpan.slot = "message";

    const avatarviewer = fragment.appendChild(
      document.createElement("avatar-viewer")
    );
    avatarviewer.setAttribute("avatar-id", avatar_id);
    avatarviewer.slot = "avatar";

    return fragment;
  }

  addOtherMessage = (username, message, avatar_id) => {
    const othermessage = document.createElement("other-message");
    othermessage.appendChild(
      this.constructmessagefragment(username, message, avatar_id)
    );
    this.appendChild(othermessage);
  };

  addUserMessage = (message) => {
    const usermessage = document.createElement("user-message");
    usermessage.appendChild(
      this.constructmessagefragment(this.username, message, this.avatar_id)
    );
    this.appendChild(usermessage);
  };

  addStatusMessage = (message) => {
    const statusmessage = document.createElement("status-message");

    const span = statusmessage.appendChild(document.createElement("span"));
    span.slot = "message";
    span.textContent = message;

    this.appendChild(statusmessage);
  };

  // ----- scroll related behaviour -----
  handleScroll(handler) {
    return (...args) => {
      const scroll = this.shouldScroll();
      handler(...args);
      if (scroll) this.scrollToBottom();
    };
  }

  shouldScroll() {
    const container = this.shadowRoot.querySelector("#container");
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollTop + clientHeight === scrollHeight;
  }

  scrollToBottom() {
    const container = this.shadowRoot.querySelector("#container");
    const { scrollHeight } = container;
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop
    container.scrollTo({
      top: scrollHeight,
      left: 0,
      behavior: "auto", // or "smooth"
    });
  }

  // getters
  get username() {
    return this.getAttribute("username");
  }

  get avatar_id() {
    return this.getAttribute("avatar-id");
  }
}

window.customElements.define("app-chat", Chat);
