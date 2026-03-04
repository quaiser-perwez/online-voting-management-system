const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true,
    trim: true
  },

  voter_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  phone: {
    type: String,
    required: true,
    trim: true,
    match: /^[0-9]{10}$/   // only 10 digit phone
  },

  voted: {
    type: Boolean,
    default: false
  },

  votedCandidate: {
    type: String,
    default: null
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Voter", voterSchema);