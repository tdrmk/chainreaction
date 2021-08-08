import toast from "../../components/utils/toast";
import { navigateTo } from "../../router";
import { createTemplate } from "../../utils/shadowdom";
import DefaultPage from "../default";
import htmlcontents from "./home.html";
import joinroommodalhtml from "./join-room-modal.html";

const template = createTemplate(htmlcontents);
const joinroomtemplate = createTemplate(joinroommodalhtml);

function formatdate(datestr) {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(datestr));
}

export default class HomePage extends DefaultPage {
  joinroom = async () => {
    const modalfragment = joinroomtemplate.content.cloneNode(true);
    const modal = modalfragment.querySelector("app-modal");
    const roominput = modal.querySelector("input");
    const submitbutton = modal.querySelector("button[type='submit']");
    modal.querySelector("form").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        submitbutton.disabled = true;
        const gameid = roominput.value;
        const response = await fetch(`/session/${gameid}/participate`, {
          method: "POST",
        });

        if (!response.ok) {
          const reason = await response.text();
          toast(`Cannot Join Room. Reason: ${reason}`, "failure");
        } else {
          modal.remove();
          navigateTo(`/game/${gameid}`);
        }
      } finally {
        submitbutton.disabled = false;
      }
    });
    document.body.appendChild(modalfragment);
  };

  createroom = async () => {
    try {
      this.createbutton.disabled = true;
      const response = await fetch("/session/new", { method: "POST" });
      if (!response.ok) {
        const reason = await response.text();
        toast(`Create Room failed. Reason: ${reason}`, "failure");
      } else {
        const { gameid } = await response.json();
        navigateTo(`/game/${gameid}`);
      }
    } finally {
      this.createbutton.disabled = false;
    }
  };

  async render() {
    const isAuthenticated = Boolean(this.user);
    const homepage = template.content.cloneNode(true);

    if (isAuthenticated) {
      // remove public components
      homepage
        .querySelectorAll("[data-public]")
        .forEach((element) => element.remove());

      // update profile details
      homepage
        .querySelector("avatar-viewer")
        .setAttribute("avatar-id", this.user.avatar_id);
      homepage.querySelector("#username").textContent = this.user.username;
      const createdAt = formatdate(this.user.createdAt);
      homepage.querySelector("#created-at").textContent = createdAt;

      this.joinbutton = homepage.querySelector("button#join-room");
      this.createbutton = homepage.querySelector("button#create-room");
      // event handlers
      this.joinbutton.addEventListener("click", this.joinroom);
      this.createbutton.addEventListener("click", this.createroom);
    } else {
      // remove private components
      homepage
        .querySelectorAll("[data-private]")
        .forEach((element) => element.remove());
    }

    return homepage;
  }
}
