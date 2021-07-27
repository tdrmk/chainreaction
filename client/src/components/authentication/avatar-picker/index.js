import { createTemplate } from "../../../utils/shadowdom";
import { chosenZonesLimit, generateAvatar } from "@tdrmk/avatarmaker";
import htmlcontents from "./index.html";

const template = createTemplate(htmlcontents);

/*
  <avatar-spinner gender="<gender>" avatar-id="<avatar-id>"></avatar-spinner>
  gender: male, female
  avatar-id: string optional

  when avatar is updated, avatar-id is updated to the new value.
  Custom event `change` is dispatched with detail equals new avatarId.
*/

class AvatarPicker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.avatarcontainer = this.shadowRoot.querySelector("#avatar");
    this.genderSpinner = this.shadowRoot.querySelector("[name='gender']");
    this.resetButton = this.shadowRoot.querySelector("#reset");

    this.spinners = {
      face: this.shadowRoot.querySelector("[name='face']"),
      nose: this.shadowRoot.querySelector("[name='nose']"),
      mouth: this.shadowRoot.querySelector("[name='mouth']"),
      ears: this.shadowRoot.querySelector("[name='ears']"),

      eyes: this.shadowRoot.querySelector("[name='eyes']"),
      iris: this.shadowRoot.querySelector("[name='iris']"),
      brows: this.shadowRoot.querySelector("[name='brows']"),
      glasses: this.shadowRoot.querySelector("[name='glasses']"),

      hair: this.shadowRoot.querySelector("[name='hair']"),
      mustache: this.shadowRoot.querySelector("[name='mustache']"),
      beard: this.shadowRoot.querySelector("[name='beard']"),

      clothes: this.shadowRoot.querySelector("[name='clothes']"),
      backs: this.shadowRoot.querySelector("[name='backs']"),
    };

    // set up event handlers for spinners
    Object.values(this.spinners).forEach((spinner) => {
      spinner.addEventListener("change", (event) => {
        event.stopPropagation();

        // something was changed
        this.updateAvatar({
          chosen_zones: spinnerOptionsToChosenZones(this.spinner_options),
          gender: this.genderSpinner.getAttribute("value"),
        });
      });
    });

    this.genderSpinner.addEventListener("change", (event) => {
      event.stopPropagation();
      // on change keep gender, reset everything
      this.updateAvatar({
        gender: this.genderSpinner.getAttribute("value"),
      });
    });

    this.resetButton.addEventListener("click", (event) => {
      event.stopPropagation();
      // on click keep gender, reset everything
      this.updateAvatar({
        gender: this.genderSpinner.getAttribute("value"),
      });
    });
  }

  connectedCallback() {
    this.updateAvatar({ avatarId: this.avatarId });
  }

  updateAvatar(options) {
    const { svg, gender, chosen_zones, avatarId } = generateAvatar(options);

    // quick fix to remove specified width and height
    this.avatarcontainer.innerHTML = svg
      .replace(/width=['"].*?['"]/, "")
      .replace(/height=['"].*?['"]/, "");

    this.avatarId = avatarId;
    this.genderSpinner.setAttribute("value", gender);

    // update gender-dependent spinner
    this.spinners["mustache"].toggleAttribute("disabled", gender !== "male");
    this.spinners["beard"].toggleAttribute("disabled", gender !== "male");

    const limits = chosenZonesToSpinnerOptions(chosenZonesLimit(gender));
    // update spinners's options
    Object.entries(limits).forEach(([zone, limit]) => {
      this.spinners[zone].innerHTML = "";
      for (let i = 0; i < limit; i++) {
        const option = document.createElement("option");
        option.setAttribute("value", i);
        option.textContent = `${zone} ${i + 1}`;
        this.spinners[zone].appendChild(option);
      }
    });

    const spinner_options = chosenZonesToSpinnerOptions(chosen_zones);
    // update spinners's value
    Object.entries(spinner_options).forEach(([zone, value]) => {
      this.spinners[zone].setAttribute("value", String(value));
    });

    this.dispatchEvent(new CustomEvent("change", { detail: avatarId }));
  }

  get spinner_options() {
    return Object.fromEntries(
      Object.entries(this.spinners).map(([zone, spinner]) => [
        zone,
        +spinner.getAttribute("value"),
      ])
    );
  }

  // getters and setters
  get avatarId() {
    return this.getAttribute("avatar-id");
  }

  set avatarId(avatarId) {
    if (avatarId) this.setAttribute("avatar-id", avatarId);
    else this.removeAttribute("avatar-id");
  }
}

function chosenZonesToSpinnerOptions(chosen_zones) {
  return JSON.parse(
    JSON.stringify({
      face: chosen_zones.faceshape,
      nose: chosen_zones.nose,
      mouth: chosen_zones.mouth,
      ears: chosen_zones.ears,

      eyes: chosen_zones.eyesback,
      iris: chosen_zones.eyesiris,
      brows: chosen_zones.eyebrows,
      glasses: chosen_zones.glasses,

      hair: chosen_zones.hairback,
      beard: chosen_zones.beard,
      mustache: chosen_zones.mustache,

      clothes: chosen_zones.clothes,
      backs: chosen_zones.backs,
    })
  );
}

function spinnerOptionsToChosenZones(spinner_options) {
  if (!spinner_options) return null;
  return JSON.parse(
    JSON.stringify({
      ears: spinner_options.ears,
      faceshape: spinner_options.face,
      chinshadow: spinner_options.face,
      nose: spinner_options.nose,
      mouth: spinner_options.mouth,
      facehighlight: 0,

      eyesback: spinner_options.eyes,
      eyesfront: spinner_options.eyes,
      eyesiris: spinner_options.iris,
      eyebrows: spinner_options.brows,
      glasses: spinner_options.glasses,

      hairfront: spinner_options.hair,
      hairback: spinner_options.hair,
      beard: spinner_options.beard,
      mustache: spinner_options.mustache,

      humanbody: 0,
      clothes: spinner_options.clothes,
      backs: spinner_options.backs,
    })
  );
}

window.customElements.define("avatar-picker", AvatarPicker);
