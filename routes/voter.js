const express = require("express");
const router = express.Router();
const { connectionDB } = require("../db");

// Dashboard (Voting Page)
router.get("/dashboard", async (req, res) => {
	if (!req.session.user) return res.redirect("/login");

	let conn;
	try {
		conn = await connectionDB();
		const result = await conn.execute("SELECT * FROM candidates");
		return res.render("dashboard", { candidates: result.rows });
	} catch (err) {
		console.error('Error loading dashboard:', err);
		return res.render("dashboard", { candidates: [], error: 'Error loading candidates' });
	} finally {
		if (conn) await conn.close();
	}
});

// Vote
router.post("/vote/:id", async (req, res) => {
	if (!req.session.user) return res.redirect("/login");

	const id = req.params.id;

	let conn;
	try {
		conn = await connectionDB();
		await conn.execute(
			"UPDATE candidates SET votes = votes + 1 WHERE id = :id",
			{ id },
			{ autoCommit: true }
		);
		// set a session message so success page can show feedback
		req.session.voteMessage = 'Your vote has been recorded. Thank you!';
		return res.redirect("/success");
	} catch (err) {
		console.error('Error voting:', err);
		return res.redirect("/dashboard");
	} finally {
		if (conn) await conn.close();
	}
});

// Success Page
router.get("/success", (req, res) => {
	const msg = req.session.voteMessage || null;
	// clear the message after reading
	delete req.session.voteMessage;
	res.render("success", { message: msg });
});

// Results
router.get("/results", async (req, res) => {
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

module.exports = router;