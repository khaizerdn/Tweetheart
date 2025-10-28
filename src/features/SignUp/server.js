import express from "express";
import mysql from "mysql";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { generateVerificationCode, sendVerificationEmail } from "../../api/requestOTP.js";
import SnowflakeID from "../../utils/SnowflakeID.js";

// ======================
// ✅ INITIAL SETUP
// ======================
dotenv.config();

const router = express.Router();
const snowflake = new SnowflakeID(1);

// ======================
// ✅ MULTER STORAGE
// ======================
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ======================
// ✅ AWS S3 CONFIG
// ======================
const bucketName = process.env.BUCKET_NAME;
const region = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region,
});

// ======================
// ✅ LOCAL DATABASE POOL
// ======================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tweetheart",
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
  const { firstName, lastName, email, password, gender, month, day, year, bio } = req.body;

  try {
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
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
      WHERE email = ? AND is_verified = 0
    `;
    const existingUser = await dbQuery(checkUserQuery, [email]);

    if (existingUser.length > 0) {
      const existingId = existingUser[0].id;

      const updateUserQuery = `
        UPDATE users 
        SET 
          first_name = ?, 
          last_name = ?, 
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
        userId: existingId,
      });
    }

    // Create new user
    const insertUserQuery = `
      INSERT INTO users 
        (id, first_name, last_name, email, password, birthdate, gender, bio, is_verified, verification_code, expiration_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NOW())
    `;

    await dbQuery(insertUserQuery, [
      userId,
      firstName,
      lastName,
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
      userId: userId,
    });
  } catch (error) {
    console.error("❌ Error during account creation:", error);
    res.status(500).send("Error creating account. Please try again.");
  }
});

// ========================================================
// ✅ UPLOAD MULTIPLE PHOTOS (for signup)
// ========================================================
router.post("/api/signup/photos/upload-multiple", upload.array("photos", 6), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files provided" });
    }

    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const photos = [];

    // Upload all photos to S3
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileExtension = file.originalname.split(".").pop();
      const uniqueFileName = `photos/${userId}/${uuidv4()}.${fileExtension}`;

      // Resize image
      const resizedImageBuffer = await sharp(file.buffer)
        .resize(800, 800, { fit: "cover" })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Upload to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: uniqueFileName,
          Body: resizedImageBuffer,
          ContentType: "image/jpeg",
        })
      );

      photos.push({
        key: uniqueFileName,
        order: i + 1,
        uploadedAt: new Date().toISOString()
      });
    }

    // Update database with photos JSON
    await dbQuery("UPDATE users SET photos = ? WHERE id = ?", [
      JSON.stringify(photos),
      userId
    ]);

    res.json({ 
      success: true,
      message: `${photos.length} photos uploaded successfully`,
      photoCount: photos.length
    });
  } catch (error) {
    console.error("❌ Error uploading multiple photos:", error);
    res.status(500).json({ message: "Server error while uploading photos" });
  }
});

// =====================================================
// ✅ EXPORT ROUTER
// =====================================================
export default router;