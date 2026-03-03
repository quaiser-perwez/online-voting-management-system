require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
// database helper (Oracle or other)
// const mongoose = require("mongoose"); // not used in this project

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const voteRoutes = require("./routes/voter");

const app = express();

// express setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// session
app.use(
  session({
    secret: "voting_secret",
    resave: false,
    saveUninitialized: true,
  })
);

// optional: connect to Mongo if needed
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.log(err));

// home routes
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/home", (req, res) => {
  res.render("index");
});

// mount application routers
app.use("/", authRoutes);
app.use("/", voteRoutes);
app.use("/admin", adminRoutes);

// catch‑all 404 handler (optional)
app.use((req, res) => {
  res.status(404).send("Not found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});