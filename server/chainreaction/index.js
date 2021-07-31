const Session = require("./session");
const wordpair = require("random-word-pairs");
const debug = require("debug")("chainreaction:gc");

/** @type {Object.<string, Session>} */
const sessions = {};

function generateid() {
  const id = wordpair({ digits: 5 });
  return sessions[id] ? generateid() : id;
}

function createsession(user) {
  const gameid = generateid();
  sessions[gameid] = new Session(gameid, user.username);
  return gameid;
}

function getsession(gameid) {
  return sessions[gameid];
}

function getsessiondetails(session) {
  const players = session.players.map((player) => ({
    username: player.username,
    avatar_id: player.avatar_id,
    state: player.state,
    isadmin: player.username === session.admin,
    score: 0,
  }));

  // update scores
  for (const game of session.games) {
    // score for each successful move
    for (const move of game.moves) players[move.turn].score += 1;

    // score for winning the game
    if (game.gameover) players[game.winner].score += 10;
  }

  let gamedetails = undefined;
  // last game details
  if (session.state === Session.STATES.IN_PROGRESS) {
    const game = session.games[session.games.length - 1];
    gamedetails = {};
    gamedetails.moves = game.moves;
    gamedetails.winner = game.winner;
    gamedetails.gameover = game.gameover;
    gamedetails.turn = game.turn;
    gamedetails.mass = session.players.map((player, turn) => game.mass(turn));

    // compute next turns, disconnected and eliminated players
    gamedetails.nextturns = [];
    gamedetails.disconnected = [];
    gamedetails.eliminated = [];
    for (let i = 1; i < session.players.length; i++) {
      const turn = (game.turn + i) % session.players.length;
      if (game.eliminated(turn)) gamedetails.eliminated.push(turn);
      else if (!session.players[turn].active)
        gamedetails.disconnected.push(turn);
      else gamedetails.nextturns.push(turn);
    }
  }

  return {
    // generic information
    gameid: session.gameid,
    admin: session.admin,
    state: session.state,
    gameconfig: session.gameconfig,
    rounds: session.rounds,
    round: session.games.length,
    players,
    gamedetails,
  };
}

// garbage collection
const GARBAGE_COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes
const mark = (gameid, reason) => {
  sessions[gameid].gc = true;
  debug(`marking ${gameid} reason:${reason}`);
};
const unmark = (gameid, reason) => {
  sessions[gameid].gc = false;
  debug(`unmarking ${gameid} reason:${reason}`);
};
const collect = (gameid, reason) => {
  delete sessions[gameid];
  debug(`deleting ${gameid} reason:${reason}`);
};
setInterval(() => {
  debug(`running garbage collector`);
  Object.entries(sessions).forEach(([gameid, session]) => {
    if (session.gc) {
      if (session.state === Session.STATES.DONE) return collect(gameid, "done");
      if (session.players.every((player) => !player.active))
        return collect(gameid, "abandoned");

      unmark(gameid, "joined?");
    }

    if (session.state === Session.STATES.DONE) mark(gameid, "done");
    if (session.players.every((player) => !player.active))
      mark(gameid, "abandoned");
  });
}, GARBAGE_COLLECTION_INTERVAL);

module.exports = { createsession, getsession, getsessiondetails };
