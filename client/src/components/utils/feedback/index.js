import { createTemplate } from "../../../utils/shadowdom";
import toast from "../toast";
import htmlcontents from "./index.html";
import modalcontents from "./modal.html";
const modaltemplate = createTemplate(modalcontents);
const template = createTemplate(htmlcontents);

class Feedback extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot
      .querySelector("button")
      .addEventListener("click", (event) => {
        event.preventDefault();
        const modalfragment = modaltemplate.content.cloneNode(true);
        const modal = modalfragment.querySelector("app-modal");
        const form = modalfragment.querySelector("form");
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          await fetch("/user/feedback", {
            method: "POST",
            body: new FormData(form),
          });
          modal.remove();
          toast(`Thank you for your feedback!`, "success");
        });
        document.body.appendChild(modalfragment);
      });
  }
}

window.customElements.define("app-feedback", Feedback);
