require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("MongoDB Connected"))
.catch(err => console.log(err));

app.use("/", require("./routes/adminRoutes"));
app.use("/", require("./routes/voterRoutes"));
PORT=3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});