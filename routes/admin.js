const express = require("express");
const router = express.Router();
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

    return res.render("admin", { candidates: result.rows });

  } catch (err) {

    console.error("Error loading admin panel:", err);

    return res.render("admin", {
      candidates: [],
      error: "Error loading candidates"
    });

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

  if (!req.session.user) {
    return res.redirect("/login");
  }

  const role = req.session.user.role || req.session.user.ROLE || "";

  if (role.toLowerCase() !== "admin") {
    return res.redirect("/login");
  }

  res.render("add-voters");

});


// ---------- ADD VOTER ----------
router.post("/add-voter", async (req, res) => {

  const { username, voterId, phone } = req.body;

  let conn;

  try {

    conn = await connectionDB();

    await conn.execute(
      "INSERT INTO voters (username, voter_id, phone) VALUES (:u, :v, :p)",
      { u: username, v: voterId, p: phone },
      { autoCommit: true }
    );

    res.render("add-voters", {
      success: "Voter added successfully!"
    });

  } catch (err) {

    console.error("Add voter error:", err);

    res.render("add-voters", {
      error: "Error adding voter: " + err.message
    });

  } finally {

    if (conn) await conn.close();

  }

});


// ---------- VIEW RESULTS ----------
router.get("/results", async (req, res) => {

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

    const result = await conn.execute(
      "SELECT * FROM candidates ORDER BY votes DESC"
    );

    res.render("result", {
      candidates: result.rows
    });

  } catch (err) {

    console.error("Error loading results:", err);

    res.render("result", {
      candidates: [],
      error: "Error loading results"
    });

  } finally {

    if (conn) await conn.close();

  }

});


// ---------- LIST ALL VOTERS ----------
router.get("/voters", async (req, res) => {

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

    const result = await conn.execute(
      "SELECT * FROM voters"
    );

    res.render("voters", {
      voters: result.rows
    });

  } catch (err) {

    console.error("Error loading voters:", err);

    res.render("voters", {
      voters: [],
      error: "Error loading voters"
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
       WHERE LOWER(username)=LOWER(:name)
       OR voter_id=:voterId
       OR phone=:phone`,
      { name, voterId, phone }
    );

    const found = result.rows && result.rows.length > 0;

    const loginUrl =
      "/login?name=" + encodeURIComponent(name) +
      "&voterId=" + encodeURIComponent(voterId) +
      "&phone=" + encodeURIComponent(phone);

    const registerUrl =
      "/register?name=" + encodeURIComponent(name) +
      "&voterId=" + encodeURIComponent(voterId) +
      "&phone=" + encodeURIComponent(phone);

    const message = found
      ? `Voter is registered. <a href="${loginUrl}">Click here to login</a>.`
      : `No voter found. <a href="${registerUrl}">Register voter</a>.`;

    res.render("voters", {
      voters: result.rows || [],
      message,
      query: { name, voterId, phone }
    });

  } catch (err) {

    console.error("Lookup error:", err);

    res.render("voters", {
      voters: [],
      error: "Lookup failed"
    });

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