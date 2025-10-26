import express from "express";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise"; // Promise-based MySQL
import dotenv from "dotenv";
import { generateVerificationCode, sendVerificationEmail } from "../../api/requestOTP.js";

dotenv.config();

const router = express.Router();

// =====================================================
// ✅ MYSQL CONNECTION POOL (local, self-contained)
// =====================================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gamers",
  connectionLimit: 10,
});

/**
 * Executes SQL queries safely with Promise support.
 * Automatically handles connection release.
 * @param {string} query - SQL statement
 * @param {Array} values - Optional parameterized values
 */
const queryDB = async (query, values = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(query, values);
    return rows;
  } catch (err) {
    console.error("❌ Database error:", err);
    throw err;
  } finally {
    connection.release();
  }
};

// =====================================================
// ✅ VERIFY ACCOUNT ROUTE
// =====================================================
router.post("/verify-account", async (req, res) => {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    return res.status(400).json({
      success: false,
      message: "Email and verification code are required.",
    });
  }

  try {
    const selectQuery = `
      SELECT verification_code, expiration_time 
      FROM users 
      WHERE email = ? AND is_verified = 0
    `;
    const user = await queryDB(selectQuery, [email]);

    if (!user.length) {
      return res.status(400).json({
        success: false,
        message: "User not found or already verified.",
      });
    }

    const storedCode = user[0].verification_code;
    const expirationTime = new Date(user[0].expiration_time);

    const isCodeValid = await bcrypt.compare(verificationCode, storedCode);
    if (!isCodeValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    if (new Date() > expirationTime) {
      return res.status(400).json({
        success: false,
        message: "Verification code expired.",
      });
    }

    const updateQuery = `
      UPDATE users 
      SET is_verified = 1, verification_code = NULL, expiration_time = NULL 
      WHERE email = ? AND is_verified = 0
    `;
    await queryDB(updateQuery, [email]);

    res.status(200).json({
      success: true,
      message: "User successfully verified!",
    });
  } catch (error) {
    console.error("❌ Error verifying account:", error);
    res.status(500).send("Error verifying account. Please try again.");
  }
});

// =====================================================
// ✅ RESEND VERIFICATION CODE ROUTE
// =====================================================
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email not provided.",
    });
  }

  try {
    // Generate a new verification code
    const verificationCode = generateVerificationCode();
    const hashedVerificationCode = await bcrypt.hash(verificationCode, 10);
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const updateQuery = `
      UPDATE users 
      SET verification_code = ?, expiration_time = ? 
      WHERE email = ? AND is_verified = 0
    `;
    const result = await queryDB(updateQuery, [
      hashedVerificationCode,
      expirationTime,
      email,
    ]);

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "No pending verification found for this email.",
      });
    }

    await sendVerificationEmail(email, verificationCode);

    res.status(200).json({
      success: true,
      message: "Verification email resent.",
    });
  } catch (error) {
    console.error("❌ Error resending verification code:", error);
    res.status(500).send("Error resending code. Please try again.");
  }
});

// =====================================================
// ✅ EXPORT ROUTER (auto-loader compatible)
// =====================================================
export default router;
