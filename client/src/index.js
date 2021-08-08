import "./polyfill";
import "./components/register-components";
import router from "./router";

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("popstate", router);

window.addEventListener("error", (event) => {
  const { lineno, colno, filename, message } = event;
  fetch("/misc/error", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ lineno, colno, filename, message }),
  });
});
