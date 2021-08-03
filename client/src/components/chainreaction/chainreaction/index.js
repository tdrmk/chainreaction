import { createTemplate } from "../../../utils/shadowdom";
import htmlcontents from "./index.html";
import { getplayercolor } from "./utils";

const template = createTemplate(htmlcontents);

/*
  Basic Chain Reaction implementation, which will be used by both
  the local implementation and online multiplayer implementation.

  NOTE: not a complete implementation, as some of the updates depends on context.
  Best to develop a controller component which composes this component.

  When a cell is clicked, and move can be made, it emits a `cell-click` event,
  which controller needs to listen for.

  Call `add` method to do the actual move.

  Required Attributes:
    rows, columns - dimensions of the grid
    turn - the current turn
    player - the current player (useful in online multiplayer)

  Optional
    winner - indicates gameover when set
    disabled - no moves allowed
    loading - loading screen is shown, to be used with `disabled`
    message - message to show when gameover

*/

class ChainReaction extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // state variables
    this.animating = false;

    // event handlers
    this.addEventListener("click", (event) => {
      const cell = event.target.closest("chain-reaction-cell");
      if (!cell || this.disabled || this.gameover || this.animating) return;
      if (this.turn !== this.player) return;
      if (cell.mass !== 0 && cell.player !== this.turn) return;
      this.dispatchEvent(
        new CustomEvent("cell-click", {
          detail: { row: cell.row, column: cell.column },
        })
      );
    });
  }
  connectedCallback() {
    this.replaceChildren(createcelllayout(this.rows, this.columns));
  }

  static observedAttributes = ["turn", "winner", "loading", "message"];
  attributeChangedCallback(attr, oldvalue, newvalue) {
    if (attr === "turn") {
      this.style.color = getplayercolor(this.turn);
    } else if (attr === "winner") {
      const overlay = this.shadowRoot.querySelector("#overlay");
      if (this.gameover) {
        overlay.style.display = "flex";
        overlay.style.color = getplayercolor(this.winner);
      } else {
        overlay.style.display = "none";
      }
    } else if (attr === "loading") {
      const spinner = this.shadowRoot.querySelector("app-spinner");
      spinner.style.display = this.loading ? "block" : "none";
    } else if (attr === "message") {
      const message = this.shadowRoot.querySelector("#message");
      message.innerHTML = newvalue ?? "game over";
    }
  }

  async add(player, { row, column }, animate = true) {
    this.animating = true;
    this.setAttribute("turn", player);
    const cell = this.cell(row, column);
    const critical = cell.increment(player);
    if (critical) await this.triggerchainreaction([cell], animate);
    this.animating = false;
  }

  async triggerchainreaction(criticalcells, animate = true) {
    if (animate)
      await Promise.all(criticalcells.map((cell) => cell.showexposion()));

    const newcriticalcells = [];
    for (let criticalcell of criticalcells) {
      for (let neighbourcell of this.neighbours(criticalcell)) {
        const critical = neighbourcell.increment(this.turn);
        if (critical) newcriticalcells.push(neighbourcell);
      }
    }

    if (newcriticalcells.length > 0 && this.totalmass !== this.mass(this.turn))
      await this.triggerchainreaction(newcriticalcells, animate);
  }

  get totalmass() {
    const cells = Array.from(this.querySelectorAll("chain-reaction-cell"));
    return cells.reduce((mass, cell) => mass + cell.mass, 0);
  }

  mass(player) {
    const cells = Array.from(
      this.querySelectorAll(`chain-reaction-cell[player="${player}"]`)
    );
    return cells.reduce((mass, cell) => mass + cell.mass, 0);
  }

  cell(row, column) {
    return this.querySelector(
      `chain-reaction-cell[row="${row}"][column="${column}"]`
    );
  }

  neighbours(cell) {
    const { row, column } = cell;
    return [
      ...(row > 0 ? [this.cell(row - 1, column)] : []),
      ...(row < this.rows - 1 ? [this.cell(row + 1, column)] : []),
      ...(column > 0 ? [this.cell(row, column - 1)] : []),
      ...(column < this.columns - 1 ? [this.cell(row, column + 1)] : []),
    ];
  }

  // ====== getters ======
  get rows() {
    return +this.getAttribute("rows");
  }
  get columns() {
    return +this.getAttribute("columns");
  }
  get turn() {
    return +this.getAttribute("turn");
  }
  get player() {
    return +this.getAttribute("player");
  }
  get winner() {
    return +this.getAttribute("winner");
  }

  get gameover() {
    return this.getAttribute("winner") !== null;
  }
  get disabled() {
    return this.getAttribute("disabled") !== null;
  }
  get loading() {
    return this.getAttribute("loading") !== null;
  }
}

function createcelllayout(rows, columns) {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.width = "max-content";
  container.style.padding = "0.25rem";
  container.style.backgroundColor = "currentColor";

  for (let row = 0; row < rows; row++) {
    const containerrow = document.createElement("div");
    containerrow.style.display = "flex";
    containerrow.style.width = "max-content";
    for (let column = 0; column < columns; column++) {
      const cell = document.createElement("chain-reaction-cell");
      cell.setAttribute("rows", rows);
      cell.setAttribute("columns", columns);
      cell.setAttribute("row", row);
      cell.setAttribute("column", column);
      cell.setAttribute("mass", 0);
      cell.setAttribute("player", 0);

      containerrow.appendChild(cell);
    }
    container.appendChild(containerrow);
  }

  return container;
}

window.customElements.define("chain-reaction", ChainReaction);
