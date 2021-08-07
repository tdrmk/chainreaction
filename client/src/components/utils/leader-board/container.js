import htmlcontents from "./container.html";
import { createTemplate } from "../../../utils/shadowdom";
import { Deferred } from "../../../utils/time";

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
    this.deferred = new Deferred();
  }

  get observedAttribute() {
    return this.getAttribute("observe") ?? "score";
  }

  connectedCallback() {
    this.observer.observe(this, {
      attributes: true,
      attributeFilter: [this.observedAttribute],
      subtree: true,
    });

    // order children
    this.handlemutations();
  }

  disconnectedCallback() {
    this.observer.disconnect();
  }

  handlemutations = () => {
    this.deferred.chain(() => {
      // children with `observedAttribute` attribute
      const items = this.querySelectorAll(
        `:scope > [${this.observedAttribute}]`
      );
      const sorteditems = Array.from(items).sort(
        (item1, item2) =>
          +item2.getAttribute(this.observedAttribute) -
          +item1.getAttribute(this.observedAttribute)
      );

      // re-position the items (MUST be position: relative)
      let newoffsettop = 0;
      sorteditems.forEach((item, i) => {
        const top = parseInt(item.style.top) || 0;
        item.style.top = `${top + (newoffsettop - item.offsetTop)}px`;
        newoffsettop += item.offsetHeight;
      });
    }, 1000);
  };
}

window.customElements.define("leader-board", LeaderBoard);
