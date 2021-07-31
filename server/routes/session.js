const express = require("express");
const { StatusCodes } = require("http-status-codes");
const { createsession, getsession } = require("../chainreaction");
const debug = require("debug")("chainreaction:game");

const router = express.Router();

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.sendStatus(StatusCodes.UNAUTHORIZED);
}

router.post("/new", checkAuthenticated, (req, res) => {
  const gameid = createsession(req.user);
  debug(`new session ${gameid} by ${req.user.username}`);
  res.send({ gameid });
});

router.post("/:gameid/participate", checkAuthenticated, (req, res) => {
  const gameid = req.params.gameid;
  const session = getsession(gameid);
  if (!session) return res.sendStatus(StatusCodes.NOT_FOUND);
  if (!session.participate(req.user))
    return res.sendStatus(StatusCodes.FORBIDDEN);

  debug(`${req.user.username} can participate in ${gameid}`);
  res.sendStatus(StatusCodes.OK);
});

module.exports = router;
