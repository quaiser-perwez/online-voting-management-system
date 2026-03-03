const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  hasVoted: { type: Boolean, default: false }
});

module.exports = mongoose.model("Voter", voterSchema);