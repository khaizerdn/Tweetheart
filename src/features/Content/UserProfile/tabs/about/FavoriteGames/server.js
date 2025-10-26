import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ==============================
// ✅ DATABASE CONNECTION (Local)
// ==============================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gamers",
  connectionLimit: 10,
});

// ==============================
// ✅ SAFE QUERY HELPER
// ==============================
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

// ==============================
// ✅ GET user's favorite games
// ==============================
router.get("/favorite-games", async (req, res) => {
  try {
    // If no authentication, get from query or cookies
    const userId = req.query.userId || req.cookies?.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const rows = await queryDB(
      "SELECT games FROM users_favoritegames WHERE userId = ?",
      [userId]
    );

    const games = rows.length > 0 ? JSON.parse(rows[0].games) : [];
    res.json({ games });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==============================
// ✅ POST to update favorite games
// ==============================
router.post("/favorite-games", async (req, res) => {
  const userId = req.body.userId || req.cookies?.userId;
  const { games } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  if (!Array.isArray(games) || games.length > 10) {
    return res.status(400).json({
      message: "Invalid games data. Must be an array of up to 10 games.",
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const existing = await queryDB(
      "SELECT id FROM users_favoritegames WHERE userId = ?",
      [userId]
    );

    if (existing.length > 0) {
      await connection.execute(
        "UPDATE users_favoritegames SET games = ?, updated_at = CURRENT_TIMESTAMP WHERE userId = ?",
        [JSON.stringify(games), userId]
      );
    } else {
      await connection.execute(
        "INSERT INTO users_favoritegames (userId, games) VALUES (?, ?)",
        [userId, JSON.stringify(games)]
      );
    }

    await connection.commit();
    res.json({ message: "Favorite games updated successfully" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
});

export default router;