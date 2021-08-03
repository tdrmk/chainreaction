const mongoose = require("mongoose");

const gameconfigSchema = new mongoose.Schema(
  {
    rows: Number,
    columns: Number,
  },
  { _id: false }
);

const playerSchema = new mongoose.Schema(
  { username: String, score: Number },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    username: String,
    message: String,
  },
  { _id: false }
);

const gameSchema = new mongoose.Schema(
  {
    moves: [
      {
        row: Number,
        column: Number,
        turn: Number,
        _id: false,
      },
    ],
    winner: Number,
  },
  { _id: false }
);

const gameSessionSchema = new mongoose.Schema(
  {
    gameid: String,
    admin: String,
    state: String,
    gameconfig: gameconfigSchema,
    rounds: Number,
    players: [playerSchema],
    games: [gameSchema],
    messages: [messageSchema],
  },
  { timestamps: true }
);

const GameSession = mongoose.model("GameSession", gameSessionSchema);

module.exports = GameSession;
