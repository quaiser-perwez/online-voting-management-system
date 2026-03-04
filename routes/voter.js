const express = require("express");
const router = express.Router();
const Candidate = require("../models/candidate");
const Voter = require("../models/voter");
const { connectionDB } = require("../db");


// dashboard
router.get("/dashboard", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  let conn;
  try {
    conn = await connectionDB();
    const result = await conn.execute("SELECT * FROM candidates");
    const candidates = result.rows || [];
    res.render("dashboard", { candidates });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.render("dashboard", { candidates: [] });
  } finally {
    if (conn) await conn.close();
  }
});


// vote route
router.post("/vote/:id", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const candidateId = req.params.id;
  const voter = req.session.user;
  try {
    const conn = await connectionDB();
    // check if voter already voted
    const check = await conn.execute(
      "SELECT voted FROM voters WHERE voter_id = :v",
      { v: voter.voterId }
    );
    if (check.rows[0] && check.rows[0][0] === 1) {
      return res.render("success", { message: "You already voted!" });
    }

    await conn.execute(
      "UPDATE candidates SET votes = votes + 1 WHERE id = :id",
      { id: candidateId },
      { autoCommit: true }
    );

    await conn.execute(
      "UPDATE voters SET voted = 1 WHERE voter_id = :v",
      { v: voter.voterId },
      { autoCommit: true }
    );

    res.render("success", { message: "Vote submitted successfully!" });
  } catch (err) {
    console.error("Voting error:", err);
    res.render("success", { message: "Error submitting vote" });
  }
});

module.exports = router;