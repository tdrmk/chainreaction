import { navigateTo } from "../../router";
import { createTemplate } from "../../utils/shadowdom";
import htmlcontents from "./gameovermodal.html";

const template = createTemplate(htmlcontents);

export default function handlegameover(sessiondetails) {
  const { players } = sessiondetails;
  const modalfragment = template.content.cloneNode(true);
  const modal = modalfragment.querySelector("app-modal");
  const scoreboard = modal.querySelector("#scoreboard");

  scoreboard.append(
    ...players.map(({ username, avatar_id, score }, turn) =>
      renderplayerscore(username, turn, avatar_id, score)
    )
  );

  document.body.appendChild(modalfragment);
  navigateTo("/");
}

function renderplayerscore(username, turn, avatar_id, score) {
  const playerscore = document.createElement("player-score");
  playerscore.setAttribute("username", username);
  playerscore.setAttribute("turn", turn);
  playerscore.setAttribute("avatar-id", avatar_id);
  playerscore.setAttribute("score", score);
  return playerscore;
}
