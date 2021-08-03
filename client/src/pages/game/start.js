import htmlcontents from "./start.html";
import { createTemplate } from "../../utils/shadowdom";
import toast from "../../components/utils/toast";
import playerhtml from "./start-player.html";

const template = createTemplate(htmlcontents, { display: "block" });
const playertemplate = createTemplate(playerhtml);

export default class StartPage {
  constructor(user, socket) {
    this.user = user;
    this.socket = socket;
  }

  render(sessiondetails) {
    const { admin, gameid } = sessiondetails;
    const startpage = template.content.cloneNode(true);
    const gameidinput = startpage.querySelector("#gameid");
    const form = startpage.querySelector("form");
    const submitbutton = form.querySelector("button");
    const notadminmessage = form.querySelector("#notadmin");

    // update template
    gameidinput.value = gameid;
    (this.user.username === admin ? notadminmessage : submitbutton).remove();

    // event handlers
    gameidinput.addEventListener("click", () => {
      gameidinput.select();
      document.execCommand("copy");
      toast("Copied Game ID!");
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
    const playerscontainer = root.querySelector("#players");
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
