import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
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

// =============================
// ✅ TOKEN LIFETIME CONSTANTS
// =============================
const ACCESS_TOKEN_LIFETIME = 60 * 15; // 15 minutes
const REFRESH_TOKEN_LIFETIME = 60 * 60 * 24 * 60; // 60 days

// =============================
// ✅ TOKEN GENERATION HELPERS
// =============================
const generateAccessToken = (user) => {
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: `${ACCESS_TOKEN_LIFETIME}s` }
  );
  return token;
};

const generateRefreshToken = (user) => {
  const token = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: `${REFRESH_TOKEN_LIFETIME}s` }
  );
  return token;
};

// =============================
// ✅ DEVICE INFO & FINGERPRINT
// =============================
function getDeviceInfo(req) {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip || "unknown").toString();
  const userAgent = req.headers["user-agent"] || "unknown";
  const clientDeviceId = req.headers["x-device-id"] || null;

  const deviceInfo = { ip, userAgent, clientDeviceId };
  const fingerprintSource = clientDeviceId ? `client:${clientDeviceId}` : `${userAgent}||${ip}`;
  const fingerprint = crypto.createHash("sha256").update(fingerprintSource).digest("hex");

  return { deviceInfo, deviceFingerprint: fingerprint };
}

// =============================
// ✅ SESSION MANAGEMENT HELPERS
// =============================
async function saveSession(userId, refreshToken, deviceInfo, deviceFingerprint) {
  const now = new Date();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_LIFETIME * 1000);

  const existing = await queryDB(
    "SELECT id FROM users_sessions WHERE user_id = ? AND device_fingerprint = ?",
    [userId, deviceFingerprint]
  );

  if (existing.length > 0) {
    await queryDB(
      `UPDATE users_sessions 
       SET refresh_token = ?, expires_at = ?, device_info = ?, last_updated = ?
       WHERE id = ?`,
      [refreshToken, expiresAt, JSON.stringify(deviceInfo), now, existing[0].id]
    );
  } else {
    await queryDB(
      `INSERT INTO users_sessions (user_id, refresh_token, expires_at, device_info, device_fingerprint, created_at, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, refreshToken, expiresAt, JSON.stringify(deviceInfo), deviceFingerprint, now, now]
    );
  }
}

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
      SELECT id, verification_code, expiration_time, email 
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

    // Automatically log in the user after successful verification
    const userId = user[0].id;
    const userEmail = user[0].email;
    const { deviceInfo, deviceFingerprint } = getDeviceInfo(req);

    // Generate tokens
    const accessToken = generateAccessToken({ id: userId, email: userEmail });
    const refreshToken = generateRefreshToken({ id: userId });

    // Save session
    await saveSession(userId, refreshToken, deviceInfo, deviceFingerprint);

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: ACCESS_TOKEN_LIFETIME * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: REFRESH_TOKEN_LIFETIME * 1000,
    });

    res.cookie("userId", userId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: REFRESH_TOKEN_LIFETIME * 1000,
    });

    res.status(200).json({
      success: true,
      message: "User successfully verified and logged in!",
      user: { id: userId, email: userEmail },
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
