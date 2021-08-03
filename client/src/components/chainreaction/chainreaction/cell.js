import cellhtml from "./cell.html";
import orb1html from "./cell-orb1.html";
import orb2html from "./cell-orb2.html";
import orb3html from "./cell-orb3.html";
import orbcriticalhtml from "./cell-orb-critical.html";
import { createTemplate } from "../../../utils/shadowdom";
import { getplayercolor } from "./utils";

const celltemplate = createTemplate(cellhtml);

/*
  <chain-reaction-cell rows="" columns="" row="" column="" player="" mass="" ></chain-reaction-cell>

  methods:
  increment(player)
  showexposion()
  */
class Cell extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(celltemplate.content.cloneNode(true));
  }

  static observedAttributes = ["player", "mass"];
  attributeChangedCallback(attr, oldvalue, newvalue) {
    switch (attr) {
      case "player":
        const player = +newvalue;
        const color = getplayercolor(player);
        this.shadowRoot.querySelector("div").style.color = color;
        break;
      case "mass":
        const mass = +newvalue;
        this.innerHTML =
          mass === 1
            ? orb1html
            : mass === 2
            ? orb2html
            : mass === 3
            ? orb3html
            : "";
        break;
    }
  }

  /**
   *
   * @param {number} player
   * @returns whether cell became critical or not
   */
  increment(player) {
    this.setAttribute("player", player);
    const critical = this.mass + 1 >= this.criticalmass;
    this.setAttribute("mass", critical ? 0 : this.mass + 1);
    return critical;
  }

  /*
    Shows an animation of orbs exploding from the center
    to the neighbouring cells.
    Await on it to wait for animation to complete.
    Causes no side effects.
  */
  async showexposion() {
    const overlay = this.shadowRoot.querySelector("#overlay");
    for (let i = 0; i < this.criticalmass; i++)
      overlay.innerHTML += orbcriticalhtml;

    const applyclass = (orb, cls) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          orb.classList.add(cls);
        })
      );
    // apply transitions to orbs
    let i = 0;
    if (this.row > 0) applyclass(overlay.children[i++], "-mt-12");
    if (this.row < this.rows - 1) applyclass(overlay.children[i++], "mt-12");
    if (this.column > 0) applyclass(overlay.children[i++], "-ml-12");
    if (this.column < this.columns - 1)
      applyclass(overlay.children[i++], "ml-12");

    // wait for animation completion
    await new Promise((resolve) => setTimeout(resolve, 500));
    overlay.innerHTML = "";
  }

  // getters
  get mass() {
    return +this.getAttribute("mass");
  }

  get row() {
    return +this.getAttribute("row");
  }
  get column() {
    return +this.getAttribute("column");
  }
  get rows() {
    return +this.getAttribute("rows");
  }
  get columns() {
    return +this.getAttribute("columns");
  }

  get player() {
    return +this.getAttribute("player");
  }

  get criticalmass() {
    return (
      4 -
      [0, this.rows - 1].includes(this.row) -
      [0, this.columns - 1].includes(this.column)
    );
  }
}

window.customElements.define("chain-reaction-cell", Cell);
