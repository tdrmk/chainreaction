import toastcontainerhtml from "./toast-container.html";
import toastsuccesshtml from "./toast-success.html";
import toastfailurehtml from "./toast-failure.html";
import { createTemplate } from "../../../utils/shadowdom";

const toastcontainertemplate = createTemplate(toastcontainerhtml);
const toastsuccesstemplate = createTemplate(toastsuccesshtml);
const toastfailuretemplate = createTemplate(toastfailurehtml);

class ToastContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(toastcontainertemplate.content.cloneNode(true));
  }
}

class Toast extends HTMLElement {
  static observedAttributes = ["hide-duration"];
  attributeChangedCallback(attr, oldvalue, newvalue) {
    switch (attr) {
      case "hide-duration":
        setTimeout(() => this.remove(), +newvalue);
        break;
    }
  }
}
class SuccessToast extends Toast {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(toastsuccesstemplate.content.cloneNode(true));
  }
}

class FailureToast extends Toast {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(toastfailuretemplate.content.cloneNode(true));
  }
}

window.customElements.define("toast-container", ToastContainer);
window.customElements.define("toast-success", SuccessToast);
window.customElements.define("toast-failure", FailureToast);

export default function toast(
  htmlcontents,
  type = "success",
  hideduration = 3000
) {
  const toastcontainer = document.querySelector("toast-container");
  if (!toastcontainer) throw new Error("toast container not found");

  const toast = document.createElement(
    type === "success" ? "toast-success" : "toast-failure"
  );
  toast.innerHTML = htmlcontents;
  toast.setAttribute("hide-duration", hideduration);
  toastcontainer.appendChild(toast);
}
