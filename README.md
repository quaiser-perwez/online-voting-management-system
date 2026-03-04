# Online Voting Management System

This repository contains a simple Node.js/Express application for managing voters and candidates. The app uses EJS for views and MongoDB (via Mongoose) for data storage.

## 🧰 Prerequisites

- Node.js (v18+ recommended)
- npm (bundled with Node)
- MongoDB instance (local or Atlas)

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your‑username>/online-voting-management-system.git
   cd online-voting-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and set `MONGO_URI` to a valid connection string. For example:
     ```text
     MONGO_URI=mongodb+srv://user:pass@cluster0.mongodb.net/voting_db?retryWrites=true&w=majority
     PORT=3000
     ```
   - Do **not** commit your `.env` file. It is ignored by `.gitignore`.

4. **Run the server**
   - In production mode:
     ```bash
     npm start
     ```
   - During development (auto‑restarts on changes):
     ```bash
     npm run dev
     ```

5. **Visit the app**
   Open `http://localhost:3000` in your browser.

## ✅ Deploying & Hosting

When pushing to GitHub, you only push source files. Sensitive data like database URIs stays in your local `.env`.

If you deploy to a platform like Heroku, Vercel, or Railway, set the same environment variables through the provider's settings.

### 🖥️ Deploying on Render

1. Create a new **Web Service** on Render and connect your GitHub repo.
2. Set the `env` to **Node** and the build command to `npm install`, start command to `npm start` (these are already in `render.yaml`).
3. Add the following environment variables in Render's dashboard (or `render.yaml`):
   - `MONGO_URI` – your MongoDB Atlas connection string.
   - (optional) `SKIP_DEFAULT_CANDIDATES=true` if you don't want sample candidates created.
   - (optional) `DATA_DIR` – set to the mount path of a persistent disk if you're using one (e.g. `/mnt/data`).
4. If you attach a **Persistent Disk** in Render, make sure the `DATA_DIR` env var points to it so `memory.json` survives restarts.
5. Deploy – Render will run the build command and your service will start.

During redeploys or sleep/wake cycles, votes and candidates stay safe in MongoDB (preferred) or on the persistent disk.

## 📁 Committing to GitHub

1. Initialize a git repo (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. Create a new repository on GitHub and follow the instructions to add the remote and push:
   ```bash
   git remote add origin https://github.com/<your-username>/online-voting-management-system.git
   git branch -M main
   git push -u origin main
   ```

## 📝 Notes

- You must supply a valid `MONGO_URI` to avoid runtime errors; without Mongo the app will fall back to an in-memory database that is persisted to `memory.json` in the project root. Candidates and voters you add will survive restarts even when Mongo isn’t available, but the file must be writable.
- Ensure `dotenv` is installed (already a dependency).
- `node_modules` and `.env` are excluded by `.gitignore`.  `memory.json` is tracked so offline data isn’t lost; feel free to add it to `.gitignore` if you prefer not to commit it.

Once you push, anyone cloning the repo can follow these steps; the app remains **fully working** when environment variables are configured.

---
Made with ❤️ by Quaiser Perwez.
