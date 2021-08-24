const { Server } = require("socket.io");
const session = require("express-session");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { instrument } = require("@socket.io/admin-ui");
const { getsession, getsessiondetails } = require("./chainreaction");
const debug = require("debug")("chainreaction:socket");

const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);

module.exports = function (httpserver) {
  const io = new Server(httpserver, {
    serveClient: false,
    cors: {
      origin: ["https://admin.socket.io"],
      credentials: true,
    },
  });

  const nsp = io.of("/game");

  nsp.use(wrap(session(require("./config/session"))));
  nsp.use(wrap(passport.initialize()));
  nsp.use(wrap(passport.session()));

  nsp.use((socket, next) => {
    const user = socket.request.user;
    const gameid = socket.handshake.query.gameid;
    if (!user) return next(new Error("unauthorized"));
    if (!gameid) return next(new Error("bad request"));

    const session = getsession(gameid);
    if (!session) return next(new Error("not found"));
    const canparticipate = session.participate(user);
    if (!canparticipate) return next(new Error("forbidden"));

    // join the game
    session.join(user);
    debug(`${user.username} joined ${gameid}`);
    next();
  });

  nsp.on("connection", (socket) => {
    const user = socket.request.user;
    const gameid = socket.handshake.query.gameid;
    const session = getsession(gameid);

    // rooms
    const gameroom = `game:${gameid}`;
    const userroom = `user:${user.username}:${gameid}`;
    socket.join(gameroom);
    socket.join(userroom);

    // broadcast the latest game details
    nsp.to(gameroom).emit("session-details", getsessiondetails(session));

    // setup event handler to listen for async events, if not already
    if (!session.listenerCount("update"))
      session.on("update", () => {
        debug(`${gameid} got async update!`);
        nsp.to(gameroom).emit("session-details", getsessiondetails(session));
      });

    socket.on("user-typing", () => {
      nsp.to(gameroom).except(userroom).emit("user-typing", {
        username: user.username,
        avatar_id: user.avatar_id,
      });
    });

    socket.on("user-message", (message) => {
      const { username, avatar_id } = user;
      const nummessages = session.appendmessage(username, avatar_id, message);
      debug(`${username} sent message "${message}" to ${gameid}`);
      nsp.to(gameroom).emit("user-message", {
        username,
        avatar_id,
        message,
        index: nummessages - 1,
      });
    });

    socket.on("fetch-messages", (start, end, cb) => {
      debug(`${user.username} fetching messages from ${start} to ${end}`);
      const messages = session.messages
        .slice(start, end)
        .map((message, i) => ({ ...message, index: start + i }));
      // send the messages requested
      cb?.(messages);
    });

    socket.on("start", (config, ack) => {
      try {
        const { rows, columns, rounds } = config;
        session.start(user, { rows, columns, rounds });
        nsp.to(gameroom).emit("session-details", getsessiondetails(session));
        debug(`${user.username} start ${gameid}`);
        ack?.();
      } catch (err) {
        debug(`error: ${err.message} from ${user.username} in ${gameid}`);
        ack?.(err.message);
      }
    });

    socket.on("move", (move, ack) => {
      try {
        const { row, column } = move;
        session.move(user, { row, column });
        nsp.to(gameroom).emit("session-details", getsessiondetails(session));
        debug(`${user.username} move ${row}, ${column} in ${gameid}`);
        ack?.();
      } catch (err) {
        debug(`error: ${err.message} from ${user.username} in ${gameid}`);
        ack?.(err.message);
      }
    });

    socket.on("endround", (ack) => {
      try {
        session.endround(user);
        nsp.to(gameroom).emit("session-details", getsessiondetails(session));
        debug(`${user.username} endround ${gameid}`);
        ack?.();
      } catch (err) {
        debug(`error: ${err.message} from ${user.username} in ${gameid}`);
        ack?.(err.message);
      }
    });

    socket.on("skip", (skip, ack) => {
      try {
        let { username, skipped } = skip;
        session.skip(user, { username, skipped: Boolean(skipped) });
        nsp.to(gameroom).emit("session-details", getsessiondetails(session));
        const action = skipped ? "skipped" : "unskipped";
        debug(`${user.username} ${action} ${username} in ${gameid}`);
        ack?.();
      } catch (err) {
        debug(`error: ${err.message} from ${user.username} in ${gameid}`);
        ack?.(err.message);
      }
    });

    socket.on("disconnect", (reason) => {
      if (!nsp.adapter.rooms.get(userroom)) {
        session.disconnect(user);
        debug(`${user.username} disconnect ${gameid}`);
        nsp.to(gameroom).emit("session-details", getsessiondetails(session));
      }
    });
  });

  // admin ui (basic authentication)
  // https://socket.io/docs/v4/admin-ui/
  instrument(io, {
    auth: {
      type: "basic",
      username: process.env.ADMIN_USERNAME,
      password: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
    },
  });
};
