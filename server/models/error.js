const mongoose = require("mongoose");

const browserErrorSchema = new mongoose.Schema(
  {
    lineno: Number,
    colno: Number,
    filename: String,
    message: String,
    useragent: String,
    username: String,
  },
  { timestamps: true }
);

const BrowserError = mongoose.model("BrowserError", browserErrorSchema);

module.exports = BrowserError;
