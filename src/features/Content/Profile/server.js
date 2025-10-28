import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// =============================
// ✅ DATABASE CONNECTION (Local)
// =============================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gamers",
  connectionLimit: 10,
});

/**
 * Helper to execute SQL queries safely
 */
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

// =============================
// ✅ GET USER PROFILE DATA
// =============================
router.get("/user-profile", async (req, res) => {
  const userId = req.cookies.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: "User not authenticated" });
  }

  try {
    const sql = `
      SELECT 
        first_name, 
        last_name, 
        gender, 
        birth_year, 
        birth_month, 
        birth_day, 
        bio 
      FROM users 
      WHERE id = ?
    `;
    const users = await queryDB(sql, [userId]);

    if (!users.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = users[0];
    
    // Format birth date
    let birthDate = "";
    if (user.birth_year && user.birth_month && user.birth_day) {
      const year = user.birth_year.toString().padStart(4, '0');
      const month = user.birth_month.toString().padStart(2, '0');
      const day = user.birth_day.toString().padStart(2, '0');
      birthDate = `${year}-${month}-${day}`;
    }

    return res.status(200).json({
      success: true,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      gender: user.gender || "",
      birthDate: birthDate,
      bio: user.bio || "",
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ success: false, message: "Error fetching user profile" });
  }
});

// =============================
// ✅ UPDATE USER PROFILE DATA
// =============================
router.put("/user-profile", async (req, res) => {
  const userId = req.cookies.userId;
  const { firstName, lastName, gender, month, day, year, bio } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: "User not authenticated" });
  }

  // Validate required fields
  if (!firstName || !lastName || !gender) {
    return res.status(400).json({ 
      success: false, 
      message: "First name, last name, and gender are required" 
    });
  }

  try {
    const sql = `
      UPDATE users 
      SET 
        first_name = ?, 
        last_name = ?, 
        gender = ?, 
        birth_year = ?, 
        birth_month = ?, 
        birth_day = ?, 
        bio = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    
    const values = [
      firstName,
      lastName,
      gender,
      year || null,
      month || null,
      day || null,
      bio || null,
      userId
    ];

    const result = await queryDB(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({ success: false, message: "Error updating user profile" });
  }
});

export default router;
