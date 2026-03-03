const express = require("express");
const router = express.Router();
const { connectionDB } = require("../db");

// Login page
router.get("/login", (req, res) => {
  // allow pre-filling voter lookup from query string (used by admin tool)
  const { name = "", voterId = "", phone = "" } = req.query;
  res.render("login", { error: null, prefill: { name, voterId, phone } });
});


//admin login
router.post("/admin-login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Admin login attempt:", { username, password });
    
    const conn = await connectionDB();
    console.log("Database connected");
    
    const result = await conn.execute(
      "SELECT * FROM admin WHERE username = :username AND password = :password",
      { username, password }
    );
    console.log("Database query result:", result);
    
    await conn.close();

    if (result.rows && result.rows.length > 0) {
      const admin = result.rows[0];
      console.log("Admin data received:", admin);
      
      // Check role (MongoDB returns lowercase, Oracle returns uppercase)
      const role = admin.role || admin.ROLE || "";
      if (role.toString().toLowerCase() === "admin") {
        req.session.user = admin;
        console.log("Session set, redirecting to /admin");
        return res.redirect("/admin");
      } else {
        console.log("Role not admin:", role);
        return res.render("login", { error: "Invalid role" });
      }
    } else {
      console.log("No admin found with credentials");
      return res.render("login", { error: "Invalid username or password" });
    }
  } catch (err) {
    console.error('Admin login error:', err);
    return res.render("login", { error: "Error: " + err.message });
  }

});


// Send OTP
router.post("/send-otp", async (req, res) => {
  const { name, voterId, phone } = req.body;

  // verify voter exists in database (match name OR id OR phone)
  try {
    const conn = await connectionDB();
    const result = await conn.execute(
      "SELECT * FROM voters WHERE username = :u OR voter_id = :v OR phone = :p",
      { u: name, v: voterId, p: phone }
    );
    await conn.close();
    if (!result.rows || result.rows.length === 0) {
      // no matching voter
      return res.redirect("/register?error=notregistered");
    }
  } catch (err) {
    console.error("Voter lookup error:", err);
    // continue anyway; not critical for demo
  }

  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000);

  // Save in session
  req.session.otp = otp;
  req.session.voter = { name, voterId, phone };

  console.log("OTP (demo):", otp);

  // Pass OTP to view for demo/testing
  // NOTE: In production, send OTP via SMS/email instead
  res.render("otp", { error: null, otp: otp });
});

// Voter registration
router.get("/register", (req, res) => {
  let errMsg = null;
  if (req.query.error === 'notregistered') {
    errMsg = 'You must register before login.';
  }
  const { name = "", voterId = "", phone = "" } = req.query;
  res.render("register", { error: errMsg, success: null, prefill: { name, voterId, phone } });
});

router.post("/register", async (req, res) => {
  const { name, voterId, phone } = req.body;
  // keep prefill data in case we need to re-render
  const prefill = { name, voterId, phone };
  try {
    const conn = await connectionDB();
    const result = await conn.execute(
      "INSERT INTO voters (username, voter_id, phone) VALUES (:u, :v, :p)",
      { u: name, v: voterId, p: phone },
      { autoCommit: true }
    );
    console.log("[auth] registration result", result);
    await conn.close();
    return res.render("register", { success: "Registration successful! You may now login.", error: null, prefill });
  } catch (err) {
    console.error("Registration error:", err);
    return res.render("register", { error: "Error registering: " + err.message, success: null, prefill });
  }
});

// OTP page
router.get("/otp", (req, res) => {
  res.render("otp", { error: null, otp: null });
});

// Verify OTP
router.post("/verify-otp", (req, res) => {
  const { otp } = req.body;

  if (parseInt(otp) === req.session.otp) {
    // Mark user as logged in and redirect to dashboard so candidates are loaded
    req.session.user = req.session.voter;
    return res.redirect("/dashboard");
  } else {
    return res.render("otp", { error: "Invalid OTP!" });
  }
});

// Resend OTP
router.post("/resend-otp", (req, res) => {
  const newOtp = Math.floor(1000 + Math.random() * 9000);

  req.session.otp = newOtp;

  console.log("New OTP:", newOtp);

  // Pass new OTP to view for demo/testing
  res.render("otp", { error: "New OTP sent successfully!", otp: newOtp });
});



module.exports = router;