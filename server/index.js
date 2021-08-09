const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("passport");
const { createServer } = require("http");
const multer = require("multer");
const path = require("path");
const debug = require("debug")("chainreaction");

require("./config/passport"); // configure passport

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 8090;

// connect to mongodb
mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

mongoose.connection.once("open", function () {
  debug("connected to mongodb");
});

// express app
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

app.use(session(require("./config/session")));
app.use(passport.initialize());
app.use(passport.session());

app.use("/user", require("./routes/user"));
app.use("/session", require("./routes/session"));
app.use("/misc", require("./routes/misc"));

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
require("./socket")(httpserver);

httpserver.listen(port, () => debug(`listening on *:${port}`));

if (dev)
  require("browsermon")({
    server: httpserver,
    filename: path.join(__dirname, "../dist"),
  });
