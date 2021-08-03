const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    username: String,
    feedback: String,
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
