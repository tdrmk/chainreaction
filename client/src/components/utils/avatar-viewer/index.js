const { generateAvatar } = require("@tdrmk/avatarmaker");

/*
  <avatar-viewer avatar-id=""></avatar-viewer>
  Just renders the specified avatar.
*/

class AvatarViewer extends HTMLElement {
  static observedAttributes = ["avatar-id"];
  attributeChangedCallback(attr, oldvalue, newvalue) {
    switch (attr) {
      case "avatar-id":
        if (!newvalue) {
          this.innerHTML = "";
        } else {
          let { svg } = generateAvatar({ avatarId: newvalue });
          svg = svg
            .replace(/width=['"].*?['"]/, "")
            .replace(/height=['"].*?['"]/, "");
          this.innerHTML = svg;
        }
        break;
    }
  }
}

window.customElements.define("avatar-viewer", AvatarViewer);
