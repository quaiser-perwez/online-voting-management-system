const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  party: {
    type: String,
    required: true,
    trim: true
  },

  votes: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

module.exports = mongoose.models.Candidate || mongoose.model("Candidate", candidateSchema);