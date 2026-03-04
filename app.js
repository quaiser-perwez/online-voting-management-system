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

// mongoose is required in db.js which already handles the
// connection logic (including logging and fallback). we keep
// the require here so other modules can import mongoose if
// necessary, but avoid calling connect twice.
const mongoose = require("mongoose");

// NOTE: connection initiated by db.js; no explicit connect call
// is needed here. keeping this file lean avoids duplicate
// connections that could confuse the logs or consume extra
// resources.


// home routes
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/home", (req, res) => {
  res.render("index");
});

app.get("/logout", (req, res) => {

  req.session.destroy((err) => {

    if (err) {
      console.log(err);
      return res.redirect("/dashboard");
    }

    res.redirect("/");

  });

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