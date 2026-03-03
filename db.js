const mongoose = require("mongoose");

// Connect to MongoDB (non-blocking - don't crash if connection fails)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✓ MongoDB Connected");
  })
  .catch((err) => {
    console.warn("⚠ MongoDB Connection Warning:", err.message);
    console.warn("  (App will continue with disconnected models)\n");
  });

// Define Mongoose Schemas
const candidateSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    name: String,
    party: String,
    votes: { type: Number, default: 0 },
  },
  { collection: "candidates" }
);

const voterSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    username: String,
    voter_id: { type: String, unique: true },
    phone: String,
  },
  { collection: "voters" }
);

const adminSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
    role: String,
  },
  { collection: "admin" }
);

const Candidate = mongoose.model("Candidate", candidateSchema);
const Voter = mongoose.model("Voter", voterSchema);
const Admin = mongoose.model("Admin", adminSchema);

/**
 * Simulates a database connection with execute() method
 * Converts SQL-like queries to Mongoose operations
 */
async function connectionDB() {
  return {
    execute: async function (sql, params = {}, options = {}) {
      const sqlUpper = sql.toUpperCase().trim();

      try {
        // SELECT * FROM candidates
        if (
          sqlUpper.includes("SELECT") &&
          sqlUpper.includes("FROM CANDIDATES")
        ) {
          const rows = await Candidate.find();
          return { rows };
        }

        // SELECT * FROM voters
        if (sqlUpper.includes("SELECT") && sqlUpper.includes("FROM VOTERS")) {
          const rows = await Voter.find();
          return { rows };
        }

        // SELECT * FROM admin WHERE username=... AND password=...
        if (sqlUpper.includes("SELECT") && sqlUpper.includes("FROM ADMIN")) {
          const query = {};
          if (params.username) query.username = params.username;
          if (params.password) query.password = params.password;
          const rows = await Admin.find(query);
          return { rows };
        }

        // UPDATE candidates SET votes = votes + 1 WHERE id = :id
        if (sqlUpper.includes("UPDATE CANDIDATES")) {
          const candidateId = parseInt(params.id);
          const candidate = await Candidate.findOne({ id: candidateId });
          if (candidate) {
            candidate.votes = (candidate.votes || 0) + 1;
            await candidate.save();
          }
          return { rowsAffected: candidate ? 1 : 0 };
        }

        // INSERT INTO candidates (name, party, votes) VALUES (...)
        if (sqlUpper.includes("INSERT INTO CANDIDATES")) {
          const lastCandidate = await Candidate.findOne()
            .sort({ id: -1 })
            .limit(1);
          const newId = (lastCandidate?.id || 0) + 1;
          
          const newCandidate = new Candidate({
            id: newId,
            name: params.name,
            party: params.party,
            votes: 0,
          });
          await newCandidate.save();
          return { rowsAffected: 1 };
        }

        // INSERT INTO voters (username, voter_id) VALUES (...)
        if (sqlUpper.includes("INSERT INTO VOTERS")) {
          const lastVoter = await Voter.findOne()
            .sort({ id: -1 })
            .limit(1);
          const newId = (lastVoter?.id || 0) + 1;
          
          const newVoter = new Voter({
            id: newId,
            username: params.u,
            voter_id: params.v,
          });
          await newVoter.save();
          return { rowsAffected: 1 };
        }

        // DELETE FROM candidates WHERE id = :id
        if (sqlUpper.includes("DELETE") && sqlUpper.includes("CANDIDATES")) {
          const result = await Candidate.deleteOne({ id: parseInt(params.id) });
          return { rowsAffected: result.deletedCount };
        }

        console.warn("⚠ Unmapped SQL query:", sql);
        return { rows: [] };
      } catch (err) {
        console.error("Database Error:", err.message);
        throw err;
      }
    },

    close: async function () {
      // Connection pooling handled by Mongoose
      return Promise.resolve();
    },
  };
}

module.exports = { connectionDB };
