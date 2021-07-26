const express = require("express");
const multer = require("multer");
const path = require("path");
const debug = require("debug")("chainreaction:server");

const { createServer } = require("http");

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 8090;

const upload = multer();
const app = express();

// body parsers
app.use(express.json()); // content-type: application/json
app.use(express.urlencoded({ extended: false })); // content-type: application/x-www-form-urlencoded
app.use(upload.none()); // content-type: multipart/form-data

// Cache-Control with max-age 60 min in production (caching purposes)
const servestaticoptions = dev ? {} : { maxAge: 3600000 };
app.use(
  "/static",
  express.static(path.join(__dirname, "../dist"), servestaticoptions)
);

app.get("*", (req, res) => {
  // SPA, always return index.html for any route
  // JS will render the content according to path
  return res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.use((err, req, res, next) => {
  // deligate to default express error handler
  if (res.headersSent) return next(err);

  debug(err);
  res.sendStatus(500); // internal server error
});
const httpserver = createServer(app);

httpserver.listen(port, () => debug(`listening on *:${port}`));
