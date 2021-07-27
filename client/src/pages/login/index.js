import toast from "../../components/utils/toast";
import { navigateTo } from "../../router";
import DefaultPage from "../default";

export default class LoginPage extends DefaultPage {
  async render() {
    const loginelement = document.createElement("user-login");
    loginelement.addEventListener("login", async function (event) {
      const { username, password, remember_me } = event.detail;
      this.setAttribute("disabled", "");
      try {
        const response = await fetch("/user/login", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ username, password, remember_me }),
        });
        if (response.ok) {
          navigateTo("/home");
        } else {
          toast("invalid username or password", "failure");
        }
      } finally {
        this.removeAttribute("disabled");
      }
    });
    return loginelement;
  }
}
