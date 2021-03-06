import htmlcontents from "./start.html";
import { createTemplate } from "../../utils/shadowdom";
import toast from "../../components/utils/toast";
import playerhtml from "./start-player.html";
import copyToClipboard from "../../utils/copytoclipboard";

const template = createTemplate(htmlcontents, { display: "block" });
const playertemplate = createTemplate(playerhtml);

export default class StartPage {
  constructor(user, socket) {
    this.user = user;
    this.socket = socket;
  }

  render(sessiondetails) {
    const { admin, gameid } = sessiondetails;
    const isadmin = this.user.username === admin;

    const startpage = template.content.cloneNode(true);
    const gameidinput = startpage.querySelector("#gameid");
    const form = startpage.querySelector("form");
    const submitbutton = form.querySelector("button[type='submit']");
    const whatsapplink = startpage.querySelector("#whatsapp-deeplink");
    const telegramlink = startpage.querySelector("#telegram-deeplink");
    const sharelinkbutton = startpage.querySelector("#share-link");

    // update template
    gameidinput.value = gameid;
    startpage
      .querySelectorAll(!isadmin ? "[data-admin]" : "[data-nonadmin]")
      .forEach((element) => element.remove());

    const encodedURL = encodeURIComponent(window.location.href);
    const encodedText = encodeURIComponent("Play Chain Reaction Online!");
    whatsapplink.href = `https://wa.me/?text=${encodedURL}`;
    telegramlink.href = `https://t.me/share/url?url=${encodedURL}&text=${encodedText}`;

    // event handlers
    gameidinput.addEventListener("click", () => {
      gameidinput.select();
      document.execCommand("copy");
      toast("Copied Game ID!");
    });
    sharelinkbutton.addEventListener("click", () => {
      copyToClipboard(location.href);
      toast("Copied Game Link!");
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const rows = +form.querySelector("#rows").value;
      const columns = +form.querySelector("#columns").value;
      const rounds = +form.querySelector("#rounds").value;
      submitbutton.disabled = true;
      this.socket.emit("start", { rows, columns, rounds }, (err) => {
        submitbutton.disabled = false;
        if (err) {
          toast(`Cannot Start. Reason: ${err}`, "failure");
        }
      });
    });

    return startpage;
  }

  update(root, sessiondetails) {
    const { players } = sessiondetails;
    const insufficientplayers = players.length < 2;
    const playerscontainer = root.querySelector("#players");
    const startdescription = root.querySelector("#start-description");
    if (startdescription)
      startdescription.style.visibility = insufficientplayers
        ? "visible"
        : "hidden";
    playerscontainer.replaceChildren(
      ...players.map(({ username, avatar_id, isadmin }) =>
        this.renderstartplayer(username, avatar_id, isadmin)
      )
    );
  }

  // ===== utilities =========
  renderstartplayer = (username, avatar_id, isadmin) => {
    const player = playertemplate.content.cloneNode(true);
    player.querySelector("avatar-viewer").setAttribute("avatar-id", avatar_id);
    player.querySelector("#username").textContent = username;
    if (isadmin) player.querySelector("#description").textContent = "(admin)";
    return player;
  };
}
