const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/user");
const debug = require("debug")("chainreaction:user");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password, avatar_id } = req.body;
  if (!username || !password || !avatar_id)
    return res.sendStatus(StatusCodes.BAD_REQUEST);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    let user = await User.findOne({ username });
    if (user)
      return res.status(StatusCodes.CONFLICT).send("username already taken");

    user = new User({ username, password: hashedPassword, avatar_id });
    const err = user.validateSync();
    if (err) return res.sendStatus(StatusCodes.BAD_REQUEST);
    await user.save();

    debug(`${username} registered!`);
    res.status(StatusCodes.OK).send("user account created!");
  } catch (err) {
    debug(err);
    res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
});

router.post("/login", passport.authenticate("local"), (req, res) => {
  debug(`${req.user.username} logged in!`);
  res.sendStatus(StatusCodes.OK);
});

router.delete("/logout", (req, res) => {
  const username = req.user?.username;
  if (username) debug(`${username} logged out!`);

  req.logout();
  res.sendStatus(StatusCodes.OK);
});

router.get("/details", checkAuthenticated, (req, res) => {
  res.send({
    username: req.user.username,
    avatar_id: req.user.avatar_id,
    createdAt: req.user.createdAt,
  });
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.sendStatus(StatusCodes.UNAUTHORIZED);
}

module.exports = router;
