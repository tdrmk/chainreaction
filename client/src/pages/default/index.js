import htmlcontents from "./404.html";

const template = document.createElement("template");
template.innerHTML = htmlcontents;

export default class {
  constructor(props, user) {
    this.props = props;
    this.user = user;
  }

  unmount() {
    // perform cleanup here
  }

  async render() {
    return template.content.cloneNode(true);
  }
}
