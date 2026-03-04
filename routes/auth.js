const express = require("express");
const router = express.Router();
const Admin = require("../models/admin");
const Voter = require("../models/voter");
const { connectionDB } = require("../db");


// ---------------- LOGIN PAGE ----------------
router.get("/login", (req, res) => {
  const { name = "", voterId = "", phone = "" } = req.query;
  res.render("login", { error: null, prefill: { name, voterId, phone } });
});


// ---------------- ADMIN LOGIN ----------------
router.post("/admin-login", async (req, res) => {
  try {
    const { username, password } = req.body;
    // use connectionDB for fallback
    const conn = await connectionDB();
    const result = await conn.execute(
      "SELECT * FROM admin WHERE username = :username AND password = :password",
      { username, password }
    );
    if (result.rows && result.rows.length > 0) {
      const admin = result.rows[0];
      const role = admin.role || admin.ROLE || "";
      if (role.toString().toLowerCase() === "admin") {
        req.session.user = admin;
        return res.redirect("/admin");
      } else {
        return res.render("login", { error: "Invalid role", prefill: {} });
      }
    } else {
      return res.render("login", { error: "Invalid username or password", prefill: {} });
    }
  } catch (err) {
    console.error("Admin login error:", err);
    return res.render("login", { error: "Server error", prefill: {} });
  }
});


// ---------------- SEND OTP ----------------
router.post("/send-otp", async (req, res) => {
  const { name, voterId, phone } = req.body;
  try {
    const conn = await connectionDB();
    const result = await conn.execute(
      "SELECT * FROM voters WHERE username=:u AND voter_id=:v AND phone=:p",
      { u: name, v: voterId, p: phone }
    );
    if (!result.rows || result.rows.length === 0) {
      return res.redirect(`/register?error=notregistered&name=${name}&voterId=${voterId}&phone=${phone}`);
    }
  } catch (err) {
    console.error("Voter lookup error:", err);
    return res.render("login", { error: "Database error", prefill: { name, voterId, phone } });
  }

  // generate OTP
  const otp = Math.floor(1000 + Math.random() * 9000);
  req.session.otp = otp;
  req.session.voter = { name, voterId, phone };
  console.log("OTP (demo):", otp);
  res.render("otp", { error: null, otp });
});


// ---------------- REGISTER PAGE ----------------
router.get("/register", (req, res) => {
  let errMsg = null;
  if (req.query.error === "notregistered") errMsg = "You must register before login.";
  const { name = "", voterId = "", phone = "" } = req.query;
  res.render("register", { error: errMsg, success: null, prefill: { name, voterId, phone } });
});


// ---------------- REGISTER VOTER ----------------
router.post("/register", async (req, res) => {
  const { name, voterId, phone } = req.body;
  const prefill = { name, voterId, phone };
  try {
    const conn = await connectionDB();
    const check = await conn.execute(
      "SELECT * FROM voters WHERE voter_id=:v",
      { v: voterId }
    );
    if (check.rows && check.rows.length > 0) {
      return res.render("register", { error: "Voter already registered!", success: null, prefill });
    }
    await conn.execute(
      "INSERT INTO voters (username, voter_id, phone) VALUES (:u, :v, :p)",
      { u: name, v: voterId, p: phone },
      { autoCommit: true }
    );
    return res.render("register", { success: "Registration successful! You may now login.", error: null, prefill: {} });
  } catch (err) {
    console.error("Registration error:", err);
    return res.render("register", { error: "Error registering voter", success: null, prefill });
  }
});


// ---------------- OTP PAGE ----------------
router.get("/otp", (req, res) => {
  res.render("otp", { error: null, otp: null });
});


// ---------------- VERIFY OTP ----------------
router.post("/verify-otp", (req, res) => {
  const { otp } = req.body;
  if (parseInt(otp) === req.session.otp) {
    req.session.user = req.session.voter;
    return res.redirect("/dashboard");
  } else {
    return res.render("otp", { error: "Invalid OTP!", otp: null });
  }
});


// ---------------- RESEND OTP ----------------
router.post("/resend-otp", (req, res) => {
  const newOtp = Math.floor(1000 + Math.random() * 9000);
  req.session.otp = newOtp;
  console.log("New OTP:", newOtp);
  res.render("otp", { error: "New OTP sent successfully!", otp: newOtp });
});


module.exports = router;