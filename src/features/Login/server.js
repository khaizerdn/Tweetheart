import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
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
// ✅ TOKEN LIFETIME CONSTANTS
// =============================
const ACCESS_TOKEN_LIFETIME = 60 * 15; // 15 minutes
const REFRESH_TOKEN_LIFETIME = 60 * 60 * 24 * 60; // 60 days

// =============================
// ✅ LOGIN ATTEMPT CONSTANTS
// =============================
const MAX_LOGIN_ATTEMPTS = 3; // Max failed attempts allowed
const LOCKOUT_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

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
async function saveSession(userId, refreshToken, deviceInfo, deviceFingerprint, oldRefreshToken = null) {
  const now = new Date();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_LIFETIME * 1000);

  if (oldRefreshToken) {
    const result = await queryDB(
      `UPDATE users_sessions 
       SET refresh_token = ?, expires_at = ?, device_info = ?, device_fingerprint = ?, last_updated = ?
       WHERE refresh_token = ?`,
      [refreshToken, expiresAt, JSON.stringify(deviceInfo), deviceFingerprint, now, oldRefreshToken]
    );

    if (!result?.affectedRows) {
      await queryDB(
        `UPDATE users_sessions 
         SET refresh_token = ?, expires_at = ?, device_info = ?, last_updated = ?
         WHERE user_id = ? AND device_fingerprint = ?`,
        [refreshToken, expiresAt, JSON.stringify(deviceInfo), now, userId, deviceFingerprint]
      );
    }
    return;
  }

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

async function expireSessionByRefreshToken(refreshToken) {
  const now = new Date();
  await queryDB("UPDATE users_sessions SET expires_at = ?, last_updated = ? WHERE refresh_token = ?", [now, now, refreshToken]);
}

async function expireSessionByFingerprint(userId, deviceFingerprint) {
  const now = new Date();
  await queryDB(
    "UPDATE users_sessions SET expires_at = ?, last_updated = ? WHERE user_id = ? AND device_fingerprint = ?",
    [now, now, userId, deviceFingerprint]
  );
}

// =============================
// ✅ LOGIN ATTEMPT HELPERS
// =============================
async function trackLoginAttempt(userId, email, deviceInfo, deviceFingerprint) {
  const now = new Date();
  await queryDB(
    `INSERT INTO users_login_attempts (user_id, email, attempt_time, ip, device_fingerprint)
     VALUES (?, ?, ?, ?, ?)`,
    [userId || null, email, now, deviceInfo.ip, deviceFingerprint]
  );
}

async function checkLoginAttempts(email, deviceFingerprint) {
  const now = new Date();
  const lockoutThreshold = new Date(now - LOCKOUT_DURATION);
  
  const attempts = await queryDB(
    `SELECT COUNT(*) as count 
     FROM users_login_attempts 
     WHERE email = ? 
     AND device_fingerprint = ? 
     AND attempt_time > ?`,
    [email, deviceFingerprint, lockoutThreshold]
  );

  return attempts[0].count >= MAX_LOGIN_ATTEMPTS;
}

// =============================
// ✅ LOGIN ROUTE
// =============================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const { deviceInfo, deviceFingerprint } = getDeviceInfo(req);

  try {
    // Check if account is locked out
    const isLocked = await checkLoginAttempts(email, deviceFingerprint);
    if (isLocked) {
      return res.status(429).json({ message: "Too many login attempts. Try again later." });
    }

    const users = await queryDB("SELECT * FROM users WHERE email = ?", [email]);
    if (!users.length) {
      await trackLoginAttempt(null, email, deviceInfo, deviceFingerprint);
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await trackLoginAttempt(user.id, email, deviceInfo, deviceFingerprint);
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await saveSession(user.id, refreshToken, deviceInfo, deviceFingerprint);

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

    res.cookie("userId", user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: REFRESH_TOKEN_LIFETIME * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    res.status(500).send("Internal server error");
  }
});

// =============================
// ✅ REFRESH ROUTE
// =============================
router.post("/refresh", async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) {
    return res.sendStatus(401);
  }

  const sessions = await queryDB("SELECT * FROM users_sessions WHERE refresh_token = ?", [oldRefreshToken]);

  let session = sessions[0];
  if (!session) {
    const { deviceFingerprint } = getDeviceInfo(req);
    const fallbackSessions = await queryDB(
      "SELECT * FROM users_sessions WHERE device_fingerprint = ? ORDER BY last_updated DESC LIMIT 1",
      [deviceFingerprint]
    );

    if (fallbackSessions.length) {
      session = fallbackSessions[0];
    } else {
      return res.sendStatus(403);
    }
  }

  const now = new Date();
  if (new Date(session.expires_at) <= now) {
    return res.sendStatus(403);
  }

  const { deviceFingerprint } = getDeviceInfo(req);
  if (session.device_fingerprint && session.device_fingerprint !== deviceFingerprint) {
    await expireSessionByRefreshToken(oldRefreshToken);
    return res.sendStatus(403);
  }

  jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, payload) => {
    if (err || !payload || payload.id !== session.user_id) {
      return res.sendStatus(403);
    }

    const user = { id: session.user_id };
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await saveSession(session.user_id, newRefreshToken, JSON.parse(session.device_info), session.device_fingerprint, oldRefreshToken);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: ACCESS_TOKEN_LIFETIME * 1000,
    });
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: REFRESH_TOKEN_LIFETIME * 1000,
    });
    res.cookie("userId", session.user_id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: REFRESH_TOKEN_LIFETIME * 1000,
    });

    res.json({ message: "Access token refreshed" });
  });
});

// =============================
// ✅ LOGOUT ROUTE
// =============================
router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await expireSessionByRefreshToken(refreshToken);
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.clearCookie("userId");
  res.json({ message: "Logged out successfully" });
});

export default router;
export { router as loginRouter };