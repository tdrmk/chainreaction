import twcolors from "tailwindcss/colors";

const playercolors = [
  twcolors.red[500],
  twcolors.blue[500],
  twcolors.green[500],
  twcolors.orange[500],
  twcolors.violet[500],

  twcolors.yellow[500],
  twcolors.indigo[500],
  twcolors.cyan[500],
  twcolors.lime[500],
  twcolors.black,

  twcolors.amber[500],
  twcolors.fuchsia[500],
  twcolors.teal[500],
  twcolors.purple[500],
  twcolors.pink[500],

  twcolors.blueGray[500],
  twcolors.rose[500],
  twcolors.emerald[500],
  twcolors.warmGray[500],
  twcolors.sky[500],
];

export function getplayercolor(index) {
  return playercolors[index % playercolors.length];
}
