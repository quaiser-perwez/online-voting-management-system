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
const express = require("express");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const voteRoutes = require("./routes/voter");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: "voting_secret",
  resave: false,
  saveUninitialized: true
}));

app.set("view engine", "ejs");

// Home
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/home", (req, res) => {
  res.render("index");
});

// Use Routes
app.use("/", authRoutes);     
app.use("/", voteRoutes);    
app.use("/admin", adminRoutes); 




const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});