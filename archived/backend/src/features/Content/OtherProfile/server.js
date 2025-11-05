import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

const router = express.Router();

// =============================
// ✅ DATABASE CONNECTION (Local)
// =============================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tweetheart",
  connectionLimit: 10,
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
// ✅ GET USER PROFILE DATA BY USER ID (for viewing other profiles)
// =============================
router.get("/user-profile/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  try {
    const sql = `
      SELECT 
        first_name, 
        last_name, 
        gender, 
        birthdate, 
        bio 
      FROM users 
      WHERE id = ?
    `;
    const users = await queryDB(sql, [userId]);

    if (!users.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = users[0];
    
    // Format birth date from the single birthdate field
    let birthDate = "";
    if (user.birthdate) {
      // Ensure the date is in YYYY-MM-DD format for HTML date input
      const date = new Date(user.birthdate);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        birthDate = `${year}-${month}-${day}`;
      } else {
        // If it's already a string in YYYY-MM-DD format, use it directly
        birthDate = user.birthdate;
      }
    }

    // Convert database gender values to frontend values
    let frontendGender = user.gender || "";
    if (user.gender === "Male") frontendGender = "male";
    else if (user.gender === "Female") frontendGender = "female";
    else if (user.gender === "Other") frontendGender = "prefer_not_to_say";

    return res.status(200).json({
      success: true,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      gender: frontendGender,
      birthDate: birthDate,
      bio: user.bio || "",
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ success: false, message: "Error fetching user profile" });
  }
});

// ========================================================
// ✅ GET ALL PHOTOS FOR SPECIFIC USER BY USER ID (for viewing other profiles)
// ========================================================
router.get("/photos/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const rows = await queryDB("SELECT photos FROM users WHERE id = ?", [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const photosData = rows[0].photos;
    
    if (!photosData) {
      return res.json({ photos: [] });
    }

    let photos = [];
    try {
      photos = typeof photosData === 'string' ? JSON.parse(photosData) : photosData;
    } catch (e) {
      console.error("Error parsing photos JSON:", e);
      return res.json({ photos: [] });
    }

    // Generate signed URLs for all photos
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        try {
          const signedUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: bucketName, Key: photo.key }),
            { expiresIn: 3600 }
          );
          return {
            ...photo,
            url: signedUrl
          };
        } catch (error) {
          console.error(`Error generating URL for ${photo.key}:`, error);
          return photo; // Return without URL if error
        }
      })
    );

    res.json({ photos: photosWithUrls });
  } catch (error) {
    console.error("❌ Error retrieving photos:", error);
    res.status(500).json({ message: "Server error while retrieving photos" });
  }
});

export default router;
