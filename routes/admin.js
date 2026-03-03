const express = require("express");
const router = express.Router();
const { connectionDB } = require("../db");

// Admin Panel
router.get("/", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  
  // Check role (works for both MongoDB lowercase and Oracle uppercase)
  const role = req.session.user.role || req.session.user.ROLE || "";
  if (role.toString().toLowerCase() !== "admin") {
    return res.redirect("/login");
  }

  let conn;
  try {
    conn = await connectionDB();
    const result = await conn.execute("SELECT * FROM candidates");
    return res.render("admin", { candidates: result.rows });
  } catch (err) {
    console.error('Error fetching candidates:', err);
    return res.render("admin", { candidates: [], error: 'Error loading candidates' });
  } finally {
    if (conn) await conn.close();
  }
});

// Add Candidate
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
    return res.redirect("/admin");
  } catch (err) {
    console.error('Error adding candidate:', err);
    return res.redirect("/admin");
  } finally {
    if (conn) await conn.close();
  }
});

// Delete Candidate
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
    return res.redirect("/admin");
  } catch (err) {
    console.error('Error deleting candidate:', err);
    return res.redirect("/admin");
  } finally {
    if (conn) await conn.close();
  }
});

router.get("/add-voter", (req, res) => {
  console.log("GET add-voter session", req.session.user);
  if (!req.session.user) {
    return res.redirect("/login");
  }
  
  const role = req.session.user.role || req.session.user.ROLE || "";
  if (role.toString().toLowerCase() !== "admin") {
    return res.redirect("/login");
  }

  res.render("add-voters");
});

router.post("/add-voter", async (req, res) => {
  const { username, voterId } = req.body;
  console.log("Add voter request", { username, voterId, session: req.session.user });

  let conn;
  try {
    conn = await connectionDB();
    await conn.execute(
      "INSERT INTO voters (username, voter_id) VALUES (:u, :v)",
      { u: username, v: voterId },
      { autoCommit: true }
    );
    return res.render("add-voters", { success: "Voter added successfully!" });
  } catch (err) {
    return res.render("add-voters", { error: "Error adding voter: " + err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// View Results
router.get("/results", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  
  const role = req.session.user.role || req.session.user.ROLE || "";
  if (role.toString().toLowerCase() !== "admin") {
    return res.redirect("/login");
  }

  let conn;
  try {
    conn = await connectionDB();
    const result = await conn.execute("SELECT * FROM candidates");
    return res.render("result", { candidates: result.rows });
  } catch (err) {
    console.error('Error loading results:', err);
    return res.render("result", { candidates: [], error: 'Error loading results' });
  } finally {
    if (conn) await conn.close();
  }
});

//logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// list all voters and allow quick lookup
router.get("/voters", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const role = req.session.user.role || req.session.user.ROLE || "";
  if (role.toString().toLowerCase() !== "admin") {
    return res.redirect("/login");
  }

  let conn;
  try {
    conn = await connectionDB();
    const result = await conn.execute("SELECT * FROM voters");
    return res.render("voters", { voters: result.rows });
  } catch (err) {
    console.error('Error fetching voters:', err);
    return res.render("voters", { voters: [], error: 'Error loading voters' });
  } finally {
    if (conn) await conn.close();
  }
});

// check existence of voter by name/id/phone and inform admin
router.post("/voters/check", async (req, res) => {
  const { name = "", voterId = "", phone = "" } = req.body;
  let conn;
  try {
    conn = await connectionDB();
    const result = await conn.execute(
      `SELECT * FROM voters WHERE LOWER(username)=LOWER(:name) OR voter_id=:voterId OR phone=:phone`,
      { name, voterId, phone }
    );
    const found = result.rows && result.rows.length > 0;
    const message = found
      ? 'Voter is registered and can now login via the normal \u201Clogin\u201D page.'
      : 'No matching voter found. You may register a new voter below.';
    return res.render("voters", {
      voters: result.rows || [],
      message,
      query: { name, voterId, phone },
    });
  } catch (err) {
    console.error('Lookup error:', err);
    return res.render("voters", { voters: [], error: 'Lookup failed' });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;