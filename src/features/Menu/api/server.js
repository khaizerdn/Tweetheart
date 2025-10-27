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

// --- Helper to execute queries safely ---
const queryDB = async (query, values = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(query, values);
    return rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Route: Get user basic info (first name, last name only)
 */
router.get("/user-basic", async (req, res) => {
  const userId = req.cookies.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: "User not authenticated" });
  }

  try {
    const sql = `
      SELECT first_name, last_name 
      FROM users 
      WHERE id = ?
    `;
    const users = await queryDB(sql, [userId]);

    if (!users.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = users[0];
    return res.status(200).json({
      success: true,
      firstName: user.first_name,
      lastName: user.last_name,
    });
  } catch (error) {
    console.error("Error fetching user basic info:", error);
    return res.status(500).json({ success: false, message: "Error fetching user basic info" });
  }
});

export default router;
