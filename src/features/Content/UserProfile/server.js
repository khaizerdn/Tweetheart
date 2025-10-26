import express from "express";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mysql from "mysql2/promise";

const router = express.Router();

// ======================
// ✅ MULTER STORAGE
// ======================
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
// ✅ MYSQL CONNECTION POOL
// ======================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// ========================================================
// ✅ GET USER DETAILS  (🚀 FIXED missing route)
// ========================================================
router.get("/user-details", async (req, res) => {
  try {
    // ✅ Get userId from cookie
    const userId = req.cookies?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const result = await queryDB(
      `SELECT id, first_name, last_name, username, email, birthdate, gender, created_at, about
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (!result.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];

    res.status(200).json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      birthdate: user.birthdate,
      gender: user.gender,
      created_at: user.created_at,
      about: user.about || "# About Me\n\nWrite your bio here...",
    });
  } catch (err) {
    console.error("[USER DETAILS ERROR]", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ========================================================
// ✅ POST UPLOAD (from server.js)
// ========================================================
router.post("/api/posts", upload.single("userProfileCoverPhoto"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const params = {
      Bucket: bucketName,
      Key: req.file.originalname,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    await s3.send(new PutObjectCommand(params));

    res.json({ message: "Upload successful" });
  } catch (error) {
    console.error("❌ Error uploading to S3:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ========================================================
// ✅ PROFILE PHOTO UPLOAD
// ========================================================
router.post("/api/uploadProfilePhoto", upload.single("profilePhoto"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const userId = req.cookies?.userId;
    if (!userId) return res.status(401).json({ message: "User not authenticated" });

    const fileExtension = req.file.originalname.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    const resizedImageBuffer = await sharp(req.file.buffer)
      .resize(300, 300, { fit: "cover" })
      .toBuffer();

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueFileName,
        Body: resizedImageBuffer,
        ContentType: req.file.mimetype,
      })
    );

    await pool.query("UPDATE users SET profilePhoto = ? WHERE id = ?", [uniqueFileName, userId]);

    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucketName, Key: uniqueFileName }),
      { expiresIn: 3600 }
    );

    res.json({ imageUrl: signedUrl, key: uniqueFileName });
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ========================================================
// ✅ GET PROFILE PHOTO
// ========================================================
router.get("/api/getProfilePhoto", async (req, res) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) return res.status(401).json({ message: "User not authenticated" });

    const [rows] = await pool.query("SELECT profilePhoto FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    const profilePhotoKey = rows[0].profilePhoto;
    if (!profilePhotoKey) return res.json({ imageUrl: "/default-profile.png" });

    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucketName, Key: profilePhotoKey }),
      { expiresIn: 3600 }
    );

    res.json({ imageUrl: signedUrl });
  } catch (error) {
    console.error("Error retrieving profile photo:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ========================================================
// ✅ COVER PHOTO UPLOAD
// ========================================================
router.post("/api/uploadCoverPhoto", upload.single("coverPhoto"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const userId = req.cookies?.userId;
    if (!userId) return res.status(401).json({ message: "User not authenticated" });

    const fileExtension = req.file.originalname.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    const resizedImageBuffer = await sharp(req.file.buffer)
      .resize(1200, 300, { fit: "cover" })
      .toBuffer();

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueFileName,
        Body: resizedImageBuffer,
        ContentType: req.file.mimetype,
      })
    );

    await pool.query("UPDATE users SET coverPhoto = ? WHERE id = ?", [uniqueFileName, userId]);

    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucketName, Key: uniqueFileName }),
      { expiresIn: 3600 }
    );

    res.json({ imageUrl: signedUrl, key: uniqueFileName });
  } catch (error) {
    console.error("Error uploading cover photo:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ========================================================
// ✅ GET COVER PHOTO
// ========================================================
router.get("/api/getCoverPhoto", async (req, res) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) return res.status(401).json({ message: "User not authenticated" });

    const [rows] = await pool.query("SELECT coverPhoto FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    const coverPhotoKey = rows[0].coverPhoto;
    if (!coverPhotoKey) return res.json({ imageUrl: "/default-cover.png" });

    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucketName, Key: coverPhotoKey }),
      { expiresIn: 3600 }
    );

    res.json({ imageUrl: signedUrl });
  } catch (error) {
    console.error("Error retrieving cover photo:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
