import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { generateVerificationCode, sendVerificationEmail } from "../../api/requestOTP.js";

dotenv.config();

const router = express.Router();

// =====================================================
// ✅ LOCAL MYSQL CONNECTION POOL
// =====================================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gamers",
  connectionLimit: 10,
});

// =====================================================
// ✅ SAFE QUERY EXECUTION WRAPPER
// =====================================================
const queryDB = async (query, values = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(query, values);
    return rows;
  } catch (err) {
    console.error("❌ Database query error:", err);
    throw err;
  } finally {
    connection.release();
  }
};

// =====================================================
// ✅ CHECK EMAIL ENDPOINT
// =====================================================
router.post("/check-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  try {
    // Step 1: Check if email exists
    const emailCheckQuery = `
      SELECT id, is_verified 
      FROM users 
      WHERE email = ?
    `;
    const result = await queryDB(emailCheckQuery, [email]);

    if (!result.length) {
      return res
        .status(400)
        .json({ success: false, message: "This email is not registered." });
    }

    // Respond early to prevent UI delays
    res
      .status(200)
      .json({ success: true, message: "Verification process started." });

    // Step 2: Generate new verification code
    const verificationCode = generateVerificationCode();
    const hashedVerificationCode = await bcrypt.hash(verificationCode, 10);
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry

    // Step 3: Update user record with verification code
    const updateQuery = `
      UPDATE users 
      SET verification_code = ?, expiration_time = ? 
      WHERE email = ?
    `;
    await queryDB(updateQuery, [
      hashedVerificationCode,
      expirationTime,
      email,
    ]);

    // Step 4: Send verification email asynchronously
    await sendVerificationEmail(email, verificationCode);
  } catch (error) {
    console.error("❌ Error checking email:", error);
    res
      .status(500)
      .json({ success: false, message: "Error checking email." });
  }
});

// =====================================================
// ✅ VERIFY CODE ENDPOINT
// =====================================================
router.post("/fp-verifycode", async (req, res) => {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    return res.status(400).json({
      success: false,
      message: "Email and verification code are required.",
    });
  }

  try {
    const query = `
      SELECT verification_code, expiration_time 
      FROM users 
      WHERE email = ?
    `;
    const result = await queryDB(query, [email]);

    if (!result.length) {
      return res.status(400).json({
        success: false,
        message: "No verification code found for this email.",
      });
    }

    const { verification_code: storedCode, expiration_time: expirationTime } =
      result[0];
    const isCodeValid = await bcrypt.compare(verificationCode, storedCode);

    if (!isCodeValid) {
      return res.status(400).json({
        success: false,
        message: "Verification code is invalid.",
      });
    }

    if (new Date() > new Date(expirationTime)) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired.",
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Code verified successfully." });
  } catch (error) {
    console.error("❌ Error verifying code:", error);
    res
      .status(500)
      .json({ success: false, message: "Error verifying the code." });
  }
});

// =====================================================
// ✅ RESET PASSWORD ENDPOINT
// =====================================================
router.post("/reset-password", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      UPDATE users 
      SET password = ? 
      WHERE email = ?
    `;
    const result = await queryDB(query, [hashedPassword, email]);

    if (result.affectedRows > 0) {
      return res
        .status(200)
        .json({ success: true, message: "Password reset successfully." });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Email not found." });
    }
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    res
      .status(500)
      .json({ success: false, message: "Error resetting password." });
  }
});

// =====================================================
// ✅ EXPORT ROUTER
// =====================================================
export default router;
