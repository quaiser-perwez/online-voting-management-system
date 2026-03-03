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

- You must supply a valid `MONGO_URI` to avoid runtime errors.
- Ensure `dotenv` is installed (already a dependency).
- `node_modules` and `.env` are excluded by `.gitignore`.

Once you push, anyone cloning the repo can follow these steps; the app remains **fully working** when environment variables are configured.

---
Made with ❤️ by Quaiser Perwez.
