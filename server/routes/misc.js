const express = require("express");
const BrowserError = require("../models/error");
const Feedback = require("../models/feedback");
const debug = require("debug")("chainreaction:misc");
const { StatusCodes } = require("http-status-codes");

const router = express.Router();

router.post("/feedback", (req, res) => {
  // allow user to post feedback
  let { feedback } = req.body;
  const username = req.user?.username; // optional
  new Feedback({ username, feedback }).save((err) => {
    if (err) debug(err);
  });
  res.sendStatus(StatusCodes.OK);
});

router.post("/error", (req, res) => {
  // capture errors from browser
  let { lineno, colno, filename, message } = req.body;
  const useragent = req.headers["user-agent"]; // optional
  const username = req.user?.username; // optional
  new BrowserError({
    lineno,
    colno,
    filename,
    message,
    useragent,
    username,
  }).save((err) => {
    if (err) debug(err);
  });
  res.sendStatus(StatusCodes.OK);
});

module.exports = router;
