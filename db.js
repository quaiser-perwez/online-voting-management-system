const mongoose = require("mongoose");

// In-memory fallback database (when MongoDB is not available)
const memoryDB = {
  admin: [
    {
      username: "admin",
      password: "admin123",
      role: "admin",
    },
  ],
  candidates: [
    { id: 1, name: "Candidate A", party: "Party A", votes: 0 },
    { id: 2, name: "Candidate B", party: "Party B", votes: 0 },
    { id: 3, name: "Candidate C", party: "Party C", votes: 0 },
  ],
  voters: [],
};

let mongoConnected = false;

// Connect to MongoDB (non-blocking - don't crash if connection fails)
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 5000,
  })
  .then(() => {
    console.log("? MongoDB Connected");
    mongoConnected = true;
    initializeDatabase();
  })
  .catch((err) => {
    console.warn("? MongoDB unavailable - using in-memory database");
    console.warn("  Error:", err.message);
    console.warn("  Update .env with valid MONGO_URI to use MongoDB\n");
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
 * Uses MongoDB if connected, falls back to in-memory database
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
          if (mongoConnected) {
            const rows = await Candidate.find();
            return { rows };
          } else {
            return { rows: memoryDB.candidates };
          }
        }

        // SELECT * FROM voters
        if (sqlUpper.includes("SELECT") && sqlUpper.includes("FROM VOTERS")) {
          if (mongoConnected) {
            const rows = await Voter.find();
            return { rows };
          } else {
            return { rows: memoryDB.voters };
          }
        }

        // SELECT * FROM admin WHERE username=... AND password=...
        if (sqlUpper.includes("SELECT") && sqlUpper.includes("FROM ADMIN")) {
          if (mongoConnected) {
            const query = {};
            if (params.username) query.username = params.username;
            if (params.password) query.password = params.password;
            const rows = await Admin.find(query);
            return { rows };
          } else {
            const rows = memoryDB.admin.filter((a) => {
              if (params.username && a.username !== params.username) return false;
              if (params.password && a.password !== params.password) return false;
              return true;
            });
            return { rows };
          }
        }

        // UPDATE candidates SET votes = votes + 1 WHERE id = :id
        if (sqlUpper.includes("UPDATE CANDIDATES")) {
          const candidateId = parseInt(params.id);
          if (mongoConnected) {
            const candidate = await Candidate.findOne({ id: candidateId });
            if (candidate) {
              candidate.votes = (candidate.votes || 0) + 1;
              await candidate.save();
            }
            return { rowsAffected: candidate ? 1 : 0 };
          } else {
            const candidate = memoryDB.candidates.find(
              (c) => c.id === candidateId
            );
            if (candidate) {
              candidate.votes = (candidate.votes || 0) + 1;
            }
            return { rowsAffected: candidate ? 1 : 0 };
          }
        }

        // INSERT INTO candidates (name, party, votes) VALUES (...)
        if (sqlUpper.includes("INSERT INTO CANDIDATES")) {
          if (mongoConnected) {
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
          } else {
            const newId =
              (memoryDB.candidates[memoryDB.candidates.length - 1]?.id || 0) +
              1;
            memoryDB.candidates.push({
              id: newId,
              name: params.name,
              party: params.party,
              votes: 0,
            });
            return { rowsAffected: 1 };
          }
        }

        // INSERT INTO voters (username, voter_id) VALUES (...)
        if (sqlUpper.includes("INSERT INTO VOTERS")) {
          if (mongoConnected) {
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
          } else {
            const newId =
              (memoryDB.voters[memoryDB.voters.length - 1]?.id || 0) + 1;
            memoryDB.voters.push({
              id: newId,
              username: params.u,
              voter_id: params.v,
            });
            return { rowsAffected: 1 };
          }
        }

        // DELETE FROM candidates WHERE id = :id
        if (
          sqlUpper.includes("DELETE") &&
          sqlUpper.includes("CANDIDATES")
        ) {
          if (mongoConnected) {
            const result = await Candidate.deleteOne({
              id: parseInt(params.id),
            });
            return { rowsAffected: result.deletedCount };
          } else {
            const index = memoryDB.candidates.findIndex(
              (c) => c.id === parseInt(params.id)
            );
            if (index !== -1) {
              memoryDB.candidates.splice(index, 1);
              return { rowsAffected: 1 };
            }
            return { rowsAffected: 0 };
          }
        }

        console.warn("Unmapped SQL query:", sql);
        return { rows: [] };
      } catch (err) {
        console.error("Database Error:", err.message);
        throw err;
      }
    },

    close: async function () {
      return Promise.resolve();
    },
  };
}

module.exports = { connectionDB };

/**
 * Initialize database with default admin and sample candidates
 */
async function initializeDatabase() {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const defaultAdmin = new Admin({
        username: "admin",
        password: "admin123",
        role: "admin",
      });
      await defaultAdmin.save();
      console.log(
        "? Default admin created (username: admin, password: admin123)"
      );
    }

    const candidateCount = await Candidate.countDocuments();
    if (candidateCount === 0) {
      const defaultCandidates = [
        { id: 1, name: "Candidate A", party: "Party A", votes: 0 },
        { id: 2, name: "Candidate B", party: "Party B", votes: 0 },
        { id: 3, name: "Candidate C", party: "Party C", votes: 0 },
      ];
      await Candidate.insertMany(defaultCandidates);
      console.log("? Default candidates created");
    }
  } catch (err) {
    console.warn("Database initialization warning:", err.message);
  }
}
