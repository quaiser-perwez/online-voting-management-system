const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});

module.exports = mongoose.models.Admin || mongoose.model("Admin", adminSchema);