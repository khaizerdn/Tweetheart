import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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
    // First, get current user data to compare
    const currentUserSql = `
      SELECT first_name, last_name, gender, birthdate, bio 
      FROM users 
      WHERE id = ?
    `;
    const currentUser = await queryDB(currentUserSql, [userId]);
    
    if (!currentUser.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const current = currentUser[0];
    
    // Convert gender to match database enum values
    let dbGender = gender;
    if (gender === 'male') dbGender = 'Male';
    else if (gender === 'female') dbGender = 'Female';
    else if (gender === 'prefer_not_to_say') dbGender = 'Other';

    // Format birthdate from separate fields
    let birthdate = null;
    if (year && month && day) {
      const yearStr = year.toString().padStart(4, '0');
      const monthStr = month.toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      birthdate = `${yearStr}-${monthStr}-${dayStr}`;
    }

    // Check if data has actually changed
    const hasChanged = 
      current.first_name !== firstName ||
      current.last_name !== lastName ||
      current.gender !== dbGender ||
      current.birthdate !== birthdate ||
      (current.bio || '') !== (bio || '');

    if (!hasChanged) {
      return res.status(200).json({
        success: true,
        message: "No changes detected. Profile is already up to date.",
        noChanges: true
      });
    }

    const sql = `
      UPDATE users 
      SET 
        first_name = ?, 
        last_name = ?, 
        gender = ?, 
        birthdate = ?, 
        bio = ?
      WHERE id = ?
    `;
    
    const values = [
      firstName,
      lastName,
      dbGender,
      birthdate,
      bio || null,
      userId
    ];

    const result = await queryDB(sql, values);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({ success: false, message: "Error updating user profile" });
  }
});

// ========================================================
// ✅ UPLOAD SINGLE PHOTO (for dating app profiles)
// ========================================================
router.post("/api/photos/upload", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const fileExtension = req.file.originalname.split(".").pop();
    const uniqueFileName = `photos/${userId}/${uuidv4()}.${fileExtension}`;

    // Resize image for dating app (800x800 square format)
    const resizedImageBuffer = await sharp(req.file.buffer)
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

    // Get existing photos from database
    const rows = await queryDB("SELECT photos FROM users WHERE id = ?", [userId]);
    let photos = [];
    
    if (rows.length > 0 && rows[0].photos) {
      try {
        photos = typeof rows[0].photos === 'string' 
          ? JSON.parse(rows[0].photos) 
          : rows[0].photos;
      } catch (e) {
        console.error("Error parsing photos JSON:", e);
        photos = [];
      }
    }

    // Limit to 6 photos max
    if (photos.length >= 6) {
      return res.status(400).json({ 
        message: "Maximum 6 photos allowed. Please delete a photo first." 
      });
    }

    // Add new photo to array
    const newPhoto = {
      key: uniqueFileName,
      order: photos.length + 1,
      uploadedAt: new Date().toISOString()
    };
    
    photos.push(newPhoto);

    // Update database with new photos JSON
    await queryDB("UPDATE users SET photos = ? WHERE id = ?", [
      JSON.stringify(photos),
      userId
    ]);

    // Generate signed URL
    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucketName, Key: uniqueFileName }),
      { expiresIn: 3600 }
    );

    res.json({ 
      success: true,
      message: "Photo uploaded successfully",
      photo: {
        url: signedUrl, 
        key: uniqueFileName,
        order: newPhoto.order
      },
      totalPhotos: photos.length
    });
  } catch (error) {
    console.error("❌ Error uploading photo:", error);
    res.status(500).json({ message: "Server error while uploading photo" });
  }
});

// ========================================================
// ✅ UPLOAD MULTIPLE PHOTOS (for profile updates)
// ========================================================
router.post("/api/profile/photos/upload-multiple", upload.array("photos", 6), async (req, res) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get photos data from form
    const photosDataStr = req.body.photosData;
    if (!photosDataStr) {
      return res.status(400).json({ message: "Photos data is required" });
    }

    let photosData;
    try {
      photosData = JSON.parse(photosDataStr);
    } catch (e) {
      return res.status(400).json({ message: "Invalid photos data format" });
    }

    // Get existing photos from database
    const existingRows = await queryDB("SELECT photos FROM users WHERE id = ?", [userId]);
    let existingPhotos = [];
    
    if (existingRows.length > 0 && existingRows[0].photos) {
      try {
        existingPhotos = typeof existingRows[0].photos === 'string' 
          ? JSON.parse(existingRows[0].photos) 
          : existingRows[0].photos;
      } catch (e) {
        console.error("Error parsing existing photos JSON:", e);
        existingPhotos = [];
      }
    }

    // Create a map of existing photos by their key for quick lookup
    const existingPhotosMap = new Map();
    existingPhotos.forEach(photo => {
      existingPhotosMap.set(photo.key, photo);
    });

    // Process the photos array
    const finalPhotos = [null, null, null, null, null, null]; // 6 slots
    let newPhotoIndex = 0;

    for (let i = 0; i < photosData.length && i < 6; i++) {
      const photoInfo = photosData[i];
      
      if (photoInfo.isDeleted) {
        // Photo was deleted, keep as null
        finalPhotos[i] = null;
      } else if (photoInfo.isNew) {
        // New photo upload
        if (req.files && req.files[newPhotoIndex]) {
          const file = req.files[newPhotoIndex];
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

          finalPhotos[i] = {
            key: uniqueFileName,
            order: i + 1,
            uploadedAt: new Date().toISOString()
          };
          
          newPhotoIndex++;
        }
      } else if (photoInfo.key) {
        // Existing photo, keep it
        if (existingPhotosMap.has(photoInfo.key)) {
          const existingPhoto = existingPhotosMap.get(photoInfo.key);
          finalPhotos[i] = {
            ...existingPhoto,
            order: i + 1 // Update order based on new position
          };
        } else {
          // Photo key not found in existing photos, treat as deleted
          finalPhotos[i] = null;
        }
      } else {
        // No key and not new, treat as deleted
        finalPhotos[i] = null;
      }
    }

    // Filter out null values and reorder
    const finalPhotosArray = finalPhotos.filter(photo => photo !== null);
    finalPhotosArray.forEach((photo, index) => {
      photo.order = index + 1;
    });

    // Update database with merged photos JSON
    await queryDB("UPDATE users SET photos = ? WHERE id = ?", [
      JSON.stringify(finalPhotosArray),
      userId
    ]);

    res.json({ 
      success: true,
      message: `Photos updated successfully`,
      photoCount: finalPhotosArray.length
    });
  } catch (error) {
    console.error("❌ Error uploading multiple photos:", error);
    res.status(500).json({ message: "Server error while uploading photos" });
  }
});

// ========================================================
// ✅ GET ALL PHOTOS FOR CURRENT USER
// ========================================================
router.get("/api/photos", async (req, res) => {
  try {
    const userId = req.cookies?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
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

// ========================================================
// ✅ DELETE PHOTO
// ========================================================
router.delete("/api/photos/delete", async (req, res) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const photoKey = req.query.key || req.body.key;
    if (!photoKey) {
      return res.status(400).json({ message: "Photo key is required" });
    }

    // Get existing photos
    const rows = await queryDB("SELECT photos FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    let photos = [];
    try {
      const photosData = rows[0].photos;
      photos = photosData ? (typeof photosData === 'string' ? JSON.parse(photosData) : photosData) : [];
    } catch (e) {
      console.error("Error parsing photos JSON:", e);
      photos = [];
    }
    
    // Remove the photo from array
    const updatedPhotos = photos.filter(photo => photo.key !== photoKey);
    
    if (photos.length === updatedPhotos.length) {
      return res.status(404).json({ message: "Photo not found" });
    }

    // Reorder remaining photos
    updatedPhotos.forEach((photo, index) => {
      photo.order = index + 1;
    });

    // Delete from S3 (optional - you might want to keep for backup)
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: photoKey
        })
      );
    } catch (s3Error) {
      console.error("Error deleting from S3:", s3Error);
      // Continue anyway - we'll remove from DB
    }

    // Update database
    await queryDB("UPDATE users SET photos = ? WHERE id = ?", [
      JSON.stringify(updatedPhotos),
      userId
    ]);

    res.json({ 
      success: true,
      message: "Photo deleted successfully", 
      remainingPhotos: updatedPhotos.length 
    });
  } catch (error) {
    console.error("❌ Error deleting photo:", error);
    res.status(500).json({ message: "Server error while deleting photo" });
  }
});

export default router;
