import htmlcontents from "./container.html";
import { createTemplate } from "../../../utils/shadowdom";

const template = createTemplate(htmlcontents, {
  display: "block",
  position: "relative",
});

class LeaderBoard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.observer = new MutationObserver(this.handlemutations);
  }

  connectedCallback() {
    this.observer.observe(this, {
      attributes: true,
      attributeFilter: ["score"],
      subtree: true,
    });

    // order children
    this.handlemutations();
  }

  disconnectedCallback() {
    this.observer.disconnect();
  }

  handlemutations = () => {
    // children with `score` attribute
    const items = this.querySelectorAll(":scope > [score]");
    const sorteditems = Array.from(items).sort(
      (item1, item2) =>
        +item2.getAttribute("score") - +item1.getAttribute("score")
    );

    // re-position the items (MUST be position: relative)
    let newoffsettop = 0;
    sorteditems.forEach((item, i) => {
      const top = parseInt(item.style.top) || 0;
      item.style.top = `${top + (newoffsettop - item.offsetTop)}px`;
      newoffsettop += item.offsetHeight;
    });
  };
}

window.customElements.define("leader-board", LeaderBoard);
