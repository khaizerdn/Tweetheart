import express from "express";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mysql from "mysql";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

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
// ✅ MYSQL CONNECTION POOL
// ======================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tweetheart",
});

/**
 * Execute SQL queries safely with Promise support
 */
const dbQuery = (query, values = []) => {
  return new Promise((resolve, reject) => {
    pool.query(query, values, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
};

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
    const rows = await dbQuery("SELECT photos FROM users WHERE id = ?", [userId]);
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
    await dbQuery("UPDATE users SET photos = ? WHERE id = ?", [
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
// ✅ UPLOAD MULTIPLE PHOTOS (for signup)
// ========================================================
router.post("/api/photos/upload-multiple", upload.array("photos", 6), async (req, res) => {
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

// ========================================================
// ✅ GET ALL PHOTOS FOR CURRENT USER
// ========================================================
router.get("/api/photos", async (req, res) => {
  try {
    const userId = req.cookies?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const rows = await dbQuery("SELECT photos FROM users WHERE id = ?", [userId]);
    
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
    const rows = await dbQuery("SELECT photos FROM users WHERE id = ?", [userId]);
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
    await dbQuery("UPDATE users SET photos = ? WHERE id = ?", [
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

