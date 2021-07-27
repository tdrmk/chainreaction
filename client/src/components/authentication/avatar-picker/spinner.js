import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./spinner.html";

const template = createTemplate(htmlcontents);

/*
  Usage:
  <avatar-spinner value="option-1">
    <option value="option-1">option 1 text</option>
    <option value="option-2">option 2 text</option>
    <option value="option-3">option 3 text</option>
  <avatar-spinner>
*/
class AvatarSpinner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    const prevBtn = this.shadowRoot.querySelector("#prev");
    const nextBtn = this.shadowRoot.querySelector("#next");

    prevBtn.addEventListener("click", this.prev);
    nextBtn.addEventListener("click", this.next);
  }

  prev = (event) => {
    event.stopPropagation();

    const currIndex = Array.from(this.children).indexOf(this.option);
    const total = this.children.length;
    const nextIndex = (currIndex - 1 + total) % total;
    const nextOption = this.children[nextIndex];
    this.setAttribute("value", nextOption.value);

    this.dispatchEvent(new CustomEvent("change", { detail: nextOption.value }));
  };

  next = (event) => {
    event.stopPropagation();

    const currIndex = Array.from(this.children).indexOf(this.option);
    const total = this.children.length;
    const nextIndex = (currIndex + 1) % total;
    const nextOption = this.children[nextIndex];
    this.setAttribute("value", nextOption.value);

    this.dispatchEvent(new CustomEvent("change", { detail: nextOption.value }));
  };

  get option() {
    const value = this.getAttribute("value");
    return this.querySelector(`option[value='${value}']`);
  }

  static observedAttributes = ["value", "disabled"];
  attributeChangedCallback(attr, oldvalue, newvalue) {
    switch (attr) {
      case "value":
        const option = this.querySelector(`option[value='${newvalue}']`);
        this.shadowRoot.querySelector("#value").innerHTML =
          option?.innerHTML ?? "";
        break;
      case "disabled":
        this.style.visibility = newvalue !== null ? "hidden" : "visible";
        break;
    }
  }
}

window.customElements.define("avatar-spinner", AvatarSpinner);
