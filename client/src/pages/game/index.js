import DefaultPage from "../default";
import { io } from "socket.io-client";
import toast from "../../components/utils/toast";
import PlayPage from "./play";
import StartPage from "./start";
import handlegameover from "./gameover";

export default class GamePage extends DefaultPage {
  state;

  constructor(props, user) {
    super(props, user);
    this.root = document.createElement("div");
    this.root.appendChild(document.createElement("app-spinner"));
  }

  unmount() {
    if (this.socket) this.socket.disconnect();
    if (this.page) this.page.unmount?.();
  }

  connect() {
    const gameid = this.props.gameid;
    if (this.socket) this.socket.disconnect();
    return new Promise((resolve, reject) => {
      this.socket = io("/game", { query: { gameid } });
      this.socket.once("connect", () => {
        resolve();
      });
      this.socket.on("connect_error", (err) => {
        toast(`Connection Failed. Reason: ${err.message}`, "failure");
        reject(err.message);
      });
      this.socket.on("user-message", this.handleusermessage);
      this.socket.on("session-details", this.handlesessiondetails);
    });
  }

  handlesessiondetails = (sessiondetails) => {
    console.log(sessiondetails);
    const { state } = sessiondetails;
    if (this.state !== state) {
      this.state = state;
      if (state === "NEW") {
        const startpage = new StartPage(this.user, this.socket);
        this.root.replaceChildren(startpage.render(sessiondetails));
        this.page = startpage;
      } else if (state === "IN_PROGRESS") {
        const playpage = new PlayPage(this.user, this.socket);
        this.root.replaceChildren(playpage.render(sessiondetails));
        this.page = playpage;
      }
    }

    if (state === "NEW") {
      this.page.update(this.root, sessiondetails);
    } else if (state === "IN_PROGRESS") {
      this.page.update(this.root, sessiondetails);
    } else if (state === "DONE") {
      return handlegameover(sessiondetails);
    }
  };

  handleusermessage = ({ username, avatar_id, message }) => {
    const chat = this.root.querySelector("app-chat");
    if (username === this.user.username) {
      chat?.addUserMessage(message);
    } else {
      chat?.addOtherMessage(username, message, avatar_id);
    }
  };

  async render() {
    try {
      await this.connect();
    } catch (err) {
      // go back to home page
      const redirect = document.createElement("nav-redirect");
      redirect.setAttribute("to", "/");
      return redirect;
    }
    return this.root;
  }
}
