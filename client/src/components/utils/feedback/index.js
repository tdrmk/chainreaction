import { createTemplate } from "../../../utils/shadowdom";
import toast from "../toast";

import htmlcontents from "./index.html";
import feedbackmodalcontents from "./feedback-modal.html";
import infomodalcontents from "./info-modal.html";

const template = createTemplate(htmlcontents);
const feedbackmodaltemplate = createTemplate(feedbackmodalcontents);
const infomodaltemplate = createTemplate(infomodalcontents);

class Feedback extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    const infobtn = this.shadowRoot.querySelector("#info");
    const feedbackbtn = this.shadowRoot.querySelector("#feedback");

    infobtn.addEventListener("click", (event) => {
      event.preventDefault();
      document.body.appendChild(infomodaltemplate.content.cloneNode(true));
    });

    feedbackbtn.addEventListener("click", (event) => {
      event.preventDefault();
      const fragment = feedbackmodaltemplate.content.cloneNode(true);
      const modal = fragment.querySelector("app-modal");
      const form = fragment.querySelector("form");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await fetch("/misc/feedback", {
          method: "POST",
          body: new FormData(form),
        });
        modal.remove();
        toast(`Thank you for your feedback!`, "success");
      });

      document.body.appendChild(fragment);
    });
  }
}

window.customElements.define("app-feedback", Feedback);
