if (typeof Node.prototype.replaceChildren !== "function") {
  Node.prototype.replaceChildren = function (...nodesOrDOMStrings) {
    while (this.lastChild) this.removeChild(this.lastChild);
    if (nodesOrDOMStrings.length > 0) this.append(...nodesOrDOMStrings);
  };
}
