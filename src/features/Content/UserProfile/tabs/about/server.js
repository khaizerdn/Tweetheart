import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// --- Create a local MySQL connection pool ---
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gamers",
  connectionLimit: 10,
});

// --- Helper to safely execute database queries ---
const queryDB = async (query, values = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(query, values);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    connection.release();
  }
};

// --- Get full user details ---
router.get("/user-details", async (req, res) => {
  const userId = req.cookies.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: "User not authenticated" });
  }

  try {
    const sql = `
      SELECT id, first_name, last_name, username, email, birthdate, gender, created_at, about
      FROM users
      WHERE id = ?
    `;
    const results = await queryDB(sql, [userId]);

    if (!results.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user: results[0] });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// --- Update "About" Section ---
router.post("/updateAbout", async (req, res) => {
  const userId = req.cookies.userId;
  const { about } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: "User not authenticated" });
  }

  if (!about || about.trim() === "") {
    return res.status(400).json({ success: false, message: "About content is required" });
  }

  try {
    const sql = "UPDATE users SET about = ? WHERE id = ?";
    const result = await queryDB(sql, [about.trim(), userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, message: "About updated successfully" });
  } catch (error) {
    console.error("Error updating about:", error);
    res.status(500).json({ success: false, message: "Error updating about" });
  }
});

export default router;
