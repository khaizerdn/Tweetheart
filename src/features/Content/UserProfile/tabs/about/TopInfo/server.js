import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gamers",
  connectionLimit: 10,
});

const queryDB = async (query, values = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(query, values);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
};

router.get("/bio", async (req, res) => {
  try {
    const userId = req.query.userId || req.cookies?.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const rows = await queryDB(
      "SELECT bio FROM users_bio WHERE userId = ?",
      [userId]
    );

    const bio = rows.length > 0 ? rows[0].bio : "";
    res.json({ bio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/bio", async (req, res) => {
  const userId = req.body.userId || req.cookies?.userId;
  const { bio } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  if (typeof bio !== "string") {
    return res.status(400).json({
      message: "Invalid bio data. Must be a string.",
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const existing = await queryDB(
      "SELECT id FROM users_bio WHERE userId = ?",
      [userId]
    );

    if (existing.length > 0) {
      await connection.execute(
        "UPDATE users_bio SET bio = ?, updated_at = CURRENT_TIMESTAMP WHERE userId = ?",
        [bio, userId]
      );
    } else {
      await connection.execute(
        "INSERT INTO users_bio (userId, bio) VALUES (?, ?)",
        [userId, bio]
      );
    }

    await connection.commit();
    res.json({ message: "Bio updated successfully" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
});

export default router;