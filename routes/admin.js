const express = require("express");
const router = express.Router();
const Candidate = require("../models/candidate");
const Voter = require("../models/voter");
const Admin = require("../models/admin");
const { connectionDB } = require("../db");


// ---------- ADMIN PANEL ----------
router.get("/", async (req, res) => {

  if (!req.session.user) {
    return res.redirect("/login");
  }

  const role = req.session.user.role || req.session.user.ROLE || "";

  if (role.toLowerCase() !== "admin") {
    return res.redirect("/login");
  }

  let conn;
  try {
    conn = await connectionDB();
    const result = await conn.execute("SELECT * FROM candidates");
    const candidates = result.rows || [];
    return res.render("admin", { candidates });
  } catch (err) {
    console.error("Error loading admin panel:", err);
    return res.render("admin", { candidates: [], error: "Error loading candidates" });
  } finally {
    if (conn) await conn.close();
  }

});


// ---------- ADD CANDIDATE ----------
router.post("/add-candidate", async (req, res) => {
  const { name, party } = req.body;
  let conn;
  try {
    conn = await connectionDB();
    await conn.execute(
      "INSERT INTO candidates (name, party, votes) VALUES (:name, :party, 0)",
      { name, party },
      { autoCommit: true }
    );
    res.redirect("/admin");
  } catch (err) {
    console.error("Error adding candidate:", err);
    res.redirect("/admin");
  } finally {
    if (conn) await conn.close();
  }
});


// ---------- DELETE CANDIDATE ----------
router.get("/delete/:id", async (req, res) => {
  const id = req.params.id;
  let conn;
  try {
    conn = await connectionDB();
    await conn.execute(
      "DELETE FROM candidates WHERE id = :id",
      { id },
      { autoCommit: true }
    );
    res.redirect("/admin");
  } catch (err) {
    console.error("Error deleting candidate:", err);
    res.redirect("/admin");
  } finally {
    if (conn) await conn.close();
  }
});


// ---------- ADD VOTER PAGE ----------
router.get("/add-voter", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const role = req.session.user.role || req.session.user.ROLE || "";
  if (role.toLowerCase() !== "admin") return res.redirect("/login");
  res.render("add-voters");
});


// ---------- ADD VOTER ----------
router.post("/add-voter", async (req, res) => {
  let { username, voterId, phone } = req.body;
  // make phone optional for compatibility, but ensure string
  phone = phone || "";
  try {
    const v = new Voter({ username, voter_id: voterId, phone });
    await v.save();
    res.render("add-voters", { success: "Voter added successfully!" });
  } catch (err) {
    console.error("Add voter error:", err);
    res.render("add-voters", { error: "Error adding voter: " + err.message });
  }
});


// ---------- VIEW RESULTS ----------
router.get("/results", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const role = req.session.user.role || req.session.user.ROLE || "";
  if (role.toLowerCase() !== "admin") return res.redirect("/login");
  let conn;
  try {
    conn = await connectionDB();
    const result = await conn.execute("SELECT * FROM candidates ORDER BY votes DESC");
    const candidates = result.rows || [];
    res.render("result", { candidates });
  } catch (err) {
    console.error("Error loading results:", err);
    res.render("result", { candidates: [], error: "Error loading results" });
  } finally {
    if (conn) await conn.close();
  }
});


// ---------- LIST ALL VOTERS ----------
router.get("/voters", async (req, res) => {

  if (!req.session.user) return res.redirect("/login");
  const role = req.session.user.role || req.session.user.ROLE || "";
  if (role.toLowerCase() !== "admin") return res.redirect("/login");

  let conn;
  try {
    conn = await connectionDB();
    const result = await conn.execute("SELECT * FROM voters");
    const voters = result.rows || [];

    res.render("voters", {
      voters,
      error: null,
      message: null,
      query: {}   // ⭐ यह add करना जरूरी है
    });
  } catch (err) {
    console.log(err);
    res.render("voters", {
      voters: [],
      error: "Error loading voters",
      message: null,
      query: {}
    });
  } finally {
    if (conn) await conn.close();
  }
});

// ---------- CHECK VOTER ----------
router.post("/voters/check", async (req, res) => {
  const { name = "", voterId = "", phone = "" } = req.body;
  let conn;
  try {
    conn = await connectionDB();
    const result = await conn.execute(
      `SELECT * FROM voters
       WHERE username=:u OR voter_id=:v OR phone=:p`,
      { u: name, v: voterId, p: phone }
    );
    const voters = result.rows || [];
    const found = voters.length > 0;

    const loginUrl = "/login?name=" + encodeURIComponent(name) + "&voterId=" + encodeURIComponent(voterId) + "&phone=" + encodeURIComponent(phone);
    const registerUrl = "/register?name=" + encodeURIComponent(name) + "&voterId=" + encodeURIComponent(voterId) + "&phone=" + encodeURIComponent(phone);
    const message = found ? `Voter is registered. <a href="${loginUrl}">Click here to login</a>.` : `No voter found. <a href="${registerUrl}">Register voter</a>.`;

    res.render("voters", { voters, message, error: null, query: { name, voterId, phone } });
  } catch (err) {
    console.error("Lookup error:", err);
    res.render("voters", { voters: [], error: "Lookup failed", message: null });
  } finally {
    if (conn) await conn.close();
  }
});


// ---------- LOGOUT ----------
router.get("/logout", (req, res) => {

  req.session.destroy();

  res.redirect("/login");

});


module.exports = router;