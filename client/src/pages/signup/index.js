import toast from "../../components/utils/toast";
import { navigateTo } from "../../router";
import DefaultPage from "../default";

export default class SignupPage extends DefaultPage {
  async render() {
    const signupelement = document.createElement("user-signup");
    signupelement.addEventListener("signup", async function (event) {
      const { username, password, avatar_id } = event.detail;
      this.setAttribute("disabled", "");
      try {
        const response = await fetch("/user/register", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ username, password, avatar_id }),
        });

        const message = await response.text();
        if (response.ok) {
          toast(message, "success");
          navigateTo("/login");
        } else {
          toast(message, "failure");
        }
      } finally {
        this.removeAttribute("disabled");
      }
    });
    return signupelement;
  }
}
