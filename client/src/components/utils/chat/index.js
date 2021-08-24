import { createTemplate } from "../../../utils/shadowdom";
import { debounce, throttle } from "../../../utils/time";
import htmlcontents from "./index.html";

const template = createTemplate(htmlcontents, { display: "block" });
const MAX_HEIGHT = 96; //in px
const TYPING_DELAY = 5000; // in ms (throttle time to dispatch user typing event)
const INDICATOR_DELAY = 7000; // in ms (time to show indicator on user typing event)

/*

  <app-chat username="" avatar-id=""> </app-chat>
  Use `addUserMessage`, `addOtherMessage` and `addStatusMessage` methods to add messages.
  Use `addTypingUser` to indicate specified user is typing.

  Dispatches `user-message` custom event, when user clicks submit button with input message.
  Dispatches `user-typing` custom event, when user types, in a throttled manner.

*/
class Chat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    // map of typing users to their respective timeouts (username -> timeout id)
    this.typing = new Map();

    // wrap methods to handle scroll as well
    this.addUserMessage = this.handleScroll(this.addUserMessage);
    this.addOtherMessage = this.handleScroll(this.addOtherMessage);
    this.addStatusMessage = this.handleScroll(this.addStatusMessage);

    const form = this.shadowRoot.querySelector("form");
    const textarea = this.shadowRoot.querySelector("textarea");
    const container = this.shadowRoot.querySelector("#container");

    // handle user inputs
    const updateheight = () => {
      textarea.style.height = "auto"; // to help auto-shrink
      textarea.style.height = `${Math.min(
        textarea.scrollHeight,
        MAX_HEIGHT
      )}px`;
    };

    const handlesubmit = () => {
      const message = textarea.value.trim();
      if (message) {
        // this.addUserMessage(message);
        this.dispatchEvent(
          new CustomEvent("user-message", { detail: message })
        );
      }
      textarea.value = "";
      updateheight();
    };

    const handleusertyping = () => {
      const message = textarea.value.trim();
      if (message) {
        this.dispatchEvent(new CustomEvent("user-typing"));
      }
    };

    textarea.addEventListener("input", updateheight);
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // don't add new line
        return handlesubmit();
      }
    });

    // notify others when current user is typing...
    textarea.addEventListener(
      "keyup",
      throttle(handleusertyping, TYPING_DELAY, true)
    );

    form.addEventListener("submit", (event) => {
      event.preventDefault(); // we'll handle form submit
      handlesubmit();
    });

    const handlescrollevent = () => {
      // don't show new message indicator when close to bottom
      const indicator = this.shadowRoot.querySelector("#message-indicator");
      if (this.closeToBottom()) indicator.style.visibility = "hidden";
    };
    container.addEventListener("scroll", throttle(handlescrollevent, 200));
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

  insertAt = (node, index) => {
    if (index === null || this.children.length === index) {
      this.appendChild(node);
    } else if (this.children.length > index) {
      this.replaceChild(node, this.children[index]);
    } else {
      // show skeleton messages for missing messages
      // which will be eventually populated ...
      for (let i = this.children.length; i < index; i++) {
        this.appendChild(document.createElement("skeleton-message"));
      }
      this.appendChild(node);
    }
  };

  addOtherMessage = (username, message, avatar_id, index = null) => {
    const othermessage = document.createElement("other-message");
    othermessage.appendChild(
      this.constructmessagefragment(username, message, avatar_id)
    );
    // this.removeTypingUser({ username });
    this.insertAt(othermessage, index);
  };

  addUserMessage = (message, index = null) => {
    const usermessage = document.createElement("user-message");
    usermessage.appendChild(
      this.constructmessagefragment(this.username, message, this.avatar_id)
    );
    this.insertAt(usermessage, index);
  };

  /* NOTE: Avoid using status when `index` is used with addUserMessage or addOtherMessage */
  addStatusMessage = (message) => {
    const statusmessage = document.createElement("status-message");

    const span = statusmessage.appendChild(document.createElement("span"));
    span.slot = "message";
    span.textContent = message;

    this.appendChild(statusmessage);
  };

  updateTypingIndicator = () => {
    const typingindicator = this.shadowRoot.querySelector("#typing-indicator");
    const typingmessage = this.shadowRoot.querySelector("#typing-message");
    if (this.typing.size) {
      typingindicator.style.visibility = "visible";
      const usernames = [...this.typing.keys()];
      if (this.typing.size === 1) {
        typingmessage.textContent = `${usernames[0]} is typing`;
      } else if (this.typing.size === 2) {
        typingmessage.textContent = `${usernames[0]} and 1 other are typing`;
      } else {
        const otherscount = usernames.length - 1;
        typingmessage.textContent = `${usernames[0]} and ${otherscount} others are typing`;
      }
    } else {
      typingindicator.style.visibility = "hidden";
    }
  };

  addTypingUser = ({ username, avatar_id }) => {
    if (this.typing.has(username)) {
      clearTimeout(this.typing.get(username)); // timeout will be reset
    }

    this.typing.set(
      username,
      setTimeout(() => {
        this.typing.delete(username);
        this.updateTypingIndicator();
      }, INDICATOR_DELAY)
    );
    this.updateTypingIndicator();
  };

  removeTypingUser = ({ username }) => {
    if (this.typing.has(username)) {
      clearTimeout(this.typing.get(username));
      this.typing.delete(username);
      this.updateTypingIndicator();
    }
  };

  // ----- scroll related behaviour -----
  handleScroll(handler) {
    return (...args) => {
      const shouldscroll = this.closeToBottom();
      handler(...args);
      const indicator = this.shadowRoot.querySelector("#message-indicator");
      indicator.style.visibility = shouldscroll ? "hidden" : "visible";
      if (shouldscroll) this.scrollToBottom();
    };
  }

  closeToBottom() {
    const container = this.shadowRoot.querySelector("#container");
    const { scrollTop, scrollHeight, clientHeight } = container;
    // considering 20px is close enough
    return scrollTop + clientHeight + 20 >= scrollHeight;
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
