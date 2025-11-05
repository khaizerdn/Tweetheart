import express from "express";
import mysql from "mysql";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gamers",
});

const dbQuery = (query, values = []) => {
  return new Promise((resolve, reject) => {
    pool.query(query, values, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
};

router.post("/checkusername", async (req, res) => {
  const { username } = req.body;

  try {
    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }

    const userCheckQuery = `
      SELECT username 
      FROM users 
      WHERE username = ? AND is_verified = 1
    `;
    const existingUsers = await dbQuery(userCheckQuery, [username]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    res.status(200).json({ message: "Username is available." });
  } catch (error) {
    console.error("❌ Error checking username:", error);
    res.status(500).json({ message: "Error checking username" });
  }
});

router.post("/checkemail", async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const emailCheckQuery = `
      SELECT email 
      FROM users 
      WHERE email = ? AND is_verified = 1
    `;
    const existingEmails = await dbQuery(emailCheckQuery, [email]);

    if (existingEmails.length > 0) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    res.status(200).json({ message: "Email is available." });
  } catch (error) {
    console.error("❌ Error checking email:", error);
    res.status(500).json({ message: "Error checking email" });
  }
});

export default router;