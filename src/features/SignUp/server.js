import express from "express";
import mysql from "mysql";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { generateVerificationCode, sendVerificationEmail } from "../../api/requestOTP.js";
import SnowflakeID from "../../utils/SnowflakeID.js";

// ======================
// ✅ INITIAL SETUP
// ======================
dotenv.config();

const router = express.Router();
const snowflake = new SnowflakeID(1);

// ======================
// ✅ LOCAL DATABASE POOL
// ======================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gamers",
});

/**
 * Execute SQL queries safely with Promise support
 * @param {string} query - SQL statement
 * @param {Array} values - Optional parameterized values
 */
const dbQuery = (query, values = []) => {
  return new Promise((resolve, reject) => {
    pool.query(query, values, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
};

// =====================================================
// ✅ CREATE ACCOUNT ROUTE
// =====================================================
router.post("/signup", async (req, res) => {
  const { firstName, lastName, username, email, password, gender, month, day, year, bio } = req.body;

  try {
    // Validate required fields
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Hash password and verification code
    const hashedPassword = await bcrypt.hash(password, 10);
    const birthdate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const verificationCode = generateVerificationCode();
    const hashedVerificationCode = await bcrypt.hash(verificationCode, 10);
    const expirationTime = new Date(Date.now() + 2 * 60 * 1000); // 2 min expiry
    const userId = snowflake.generate().toString();

    // Check for existing unverified user
    const checkUserQuery = `
      SELECT id, is_verified 
      FROM users 
      WHERE (email = ? OR username = ?) AND is_verified = 0
    `;
    const existingUser = await dbQuery(checkUserQuery, [email, username]);

    if (existingUser.length > 0) {
      const existingId = existingUser[0].id;

      const updateUserQuery = `
        UPDATE users 
        SET 
          first_name = ?, 
          last_name = ?, 
          username = ?, 
          email = ?, 
          password = ?, 
          birthdate = ?, 
          gender = ?, 
          bio = ?,
          verification_code = ?, 
          expiration_time = ?, 
          created_at = NOW()
        WHERE id = ? AND is_verified = 0
      `;

      await dbQuery(updateUserQuery, [
        firstName,
        lastName,
        username,
        email,
        hashedPassword,
        birthdate,
        gender,
        bio || null,
        hashedVerificationCode,
        expirationTime,
        existingId,
      ]);

      await sendVerificationEmail(email, verificationCode);
      return res.status(200).json({
        success: true,
        message: "Account updated. Verification email sent.",
      });
    }

    // Create new user
    const insertUserQuery = `
      INSERT INTO users 
        (id, first_name, last_name, username, email, password, birthdate, gender, bio, is_verified, verification_code, expiration_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NOW())
    `;

    await dbQuery(insertUserQuery, [
      userId,
      firstName,
      lastName,
      username,
      email,
      hashedPassword,
      birthdate,
      gender,
      bio || null,
      hashedVerificationCode,
      expirationTime,
    ]);

    await sendVerificationEmail(email, verificationCode);
    res.status(200).json({
      success: true,
      message: "Account created. Verification email sent.",
    });
  } catch (error) {
    console.error("❌ Error during account creation:", error);
    res.status(500).send("Error creating account. Please try again.");
  }
});

// =====================================================
// ✅ EXPORT ROUTER
// =====================================================
export default router;