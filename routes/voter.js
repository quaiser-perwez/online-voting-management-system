const express = require("express");
const router = express.Router();
const { connectionDB } = require("../db");


// dashboard
router.get("/dashboard", async (req, res) => {

  if (!req.session.user) {
    return res.redirect("/login");
  }

  try {

    const conn = await connectionDB();

    const result = await conn.execute(
      "SELECT * FROM candidates"
    );

    await conn.close();

    res.render("dashboard", {
      candidates: result.rows
    });

  } catch (err) {

    console.error("Dashboard error:", err);

    res.render("dashboard", {
      candidates: []
    });

  }

});


// vote route
router.post("/vote", async (req, res) => {

  if (!req.session.user) {
    return res.redirect("/login");
  }

  const { candidateId } = req.body;
  const voter = req.session.user;

  try {

    const conn = await connectionDB();

    // check if voter already voted
    const check = await conn.execute(
      "SELECT voted FROM voters WHERE voter_id = :v",
      { v: voter.voterId }
    );

    if (check.rows[0][0] === 1) {

      await conn.close();

      return res.render("success", {
        message: "You already voted!"
      });

    }

    // increase vote count
    await conn.execute(
      "UPDATE candidates SET votes = votes + 1 WHERE id = :id",
      { id: candidateId },
      { autoCommit: true }
    );

    // mark voter voted
    await conn.execute(
      "UPDATE voters SET voted = 1 WHERE voter_id = :v",
      { v: voter.voterId },
      { autoCommit: true }
    );

    await conn.close();

    res.render("success", {
      message: "Vote submitted successfully!"
    });

  } catch (err) {

    console.error("Voting error:", err);

    res.render("success", {
      message: "Error submitting vote"
    });

  }

});

module.exports = router;