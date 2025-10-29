import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

const router = express.Router();

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

// =============================
// ✅ DATABASE CONNECTION
// =============================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tweetheart",
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
// ✅ LIKE A USER
// =============================
router.post("/api/likes", async (req, res) => {
  try {
    const currentUserId = req.cookies?.userId;
    const { liked_id, like_type } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!liked_id || !like_type) {
      return res.status(400).json({ message: "liked_id and like_type are required" });
    }

    if (currentUserId === liked_id) {
      return res.status(400).json({ message: "Cannot like yourself" });
    }

    // Check if interaction already exists
    const existingInteraction = await queryDB(
      "SELECT id, like_type FROM users_likes WHERE liker_id = ? AND liked_id = ?",
      [currentUserId, liked_id]
    );

    if (existingInteraction.length > 0) {
      // Update existing interaction
      await queryDB(
        "UPDATE users_likes SET like_type = ?, updated_at = NOW() WHERE id = ?",
        [like_type, existingInteraction[0].id]
      );
    } else {
      // Create new interaction
      await queryDB(
        "INSERT INTO users_likes (liker_id, liked_id, like_type, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
        [currentUserId, liked_id, like_type]
      );
    }

    // Check if this creates a match (both users liked each other)
    if (like_type === 'like') {
      const mutualLike = await queryDB(
        "SELECT id FROM users_likes WHERE liker_id = ? AND liked_id = ? AND like_type = 'like'",
        [liked_id, currentUserId]
      );

      if (mutualLike.length > 0) {
        // Update both records to mark as mutual
        await queryDB(
          "UPDATE users_likes SET is_mutual = 1 WHERE liker_id = ? AND liked_id = ?",
          [currentUserId, liked_id]
        );
        await queryDB(
          "UPDATE users_likes SET is_mutual = 1 WHERE liker_id = ? AND liked_id = ?",
          [liked_id, currentUserId]
        );

        return res.json({
          success: true,
          message: "Like recorded",
          isMatch: true
        });
      }
    }

    res.json({
      success: true,
      message: "Interaction recorded",
      isMatch: false
    });

  } catch (error) {
    console.error("Error recording like:", error);
    res.status(500).json({ message: "Server error while recording like" });
  }
});

// =============================
// ✅ GET MATCHES
// =============================
router.get("/api/likes/matches", async (req, res) => {
  try {
    const currentUserId = req.cookies?.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const matches = await queryDB(`
      SELECT DISTINCT
        u.id,
        u.first_name,
        u.last_name,
        u.bio,
        u.photos,
        u.birthdate,
        ul.created_at as matched_at,
        ul.chat_id
      FROM users u
      INNER JOIN users_likes ul ON u.id = ul.liked_id
      WHERE ul.liker_id = ? 
      AND ul.is_mutual = 1
      ORDER BY ul.created_at DESC
    `, [currentUserId]);

    // Process each match and their photos
    const matchesWithPhotos = await Promise.all(
      matches.map(async (match) => {
        // Calculate age from birthdate
        let age = null;
        if (match.birthdate) {
          const birth = new Date(match.birthdate);
          const today = new Date();
          age = today.getFullYear() - birth.getFullYear();
          const monthDiff = today.getMonth() - birth.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
        }

        // Process photos
        let photos = [];
        if (match.photos) {
          try {
            const photosData = typeof match.photos === 'string' ? JSON.parse(match.photos) : match.photos;
            
            // Generate signed URLs for photos
            photos = await Promise.all(
              photosData.map(async (photo) => {
                try {
                  const signedUrl = await getSignedUrl(
                    s3,
                    new GetObjectCommand({ Bucket: bucketName, Key: photo.key }),
                    { expiresIn: 3600 }
                  );
                  return signedUrl;
                } catch (error) {
                  console.error(`Error generating URL for ${photo.key}:`, error);
                  return null;
                }
              })
            );
            
            // Filter out null URLs and maintain order
            photos = photos.filter(url => url !== null);
          } catch (e) {
            console.error("Error parsing photos JSON:", e);
            photos = [];
          }
        }

        return {
          id: match.id,
          first_name: match.first_name,
          last_name: match.last_name,
          bio: match.bio,
          age: age,
          photos: photos,
          matched_at: match.matched_at,
          chat_id: match.chat_id,
          has_chat: !!match.chat_id
        };
      })
    );

    res.json({ matches: matchesWithPhotos });

  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ message: "Server error while fetching matches" });
  }
});

// =============================
// ✅ CHECK IF MATCH
// =============================
router.get("/api/likes/match/:userId", async (req, res) => {
  try {
    const currentUserId = req.cookies?.userId;
    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const match = await queryDB(`
      SELECT is_mutual FROM users_likes 
      WHERE liker_id = ? AND liked_id = ? AND like_type = 'like'
    `, [currentUserId, userId]);

    res.json({
      isMatch: match.length > 0 && match[0].is_mutual === 1
    });

  } catch (error) {
    console.error("Error checking match:", error);
    res.status(500).json({ message: "Server error while checking match" });
  }
});

// =============================
// ✅ GET LIKED USERS
// =============================
router.get("/api/likes/liked", async (req, res) => {
  try {
    const currentUserId = req.cookies?.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const likedUsers = await queryDB(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.bio,
        u.photos,
        ul.like_type,
        ul.created_at
      FROM users u
      INNER JOIN users_likes ul ON u.id = ul.liked_id
      WHERE ul.liker_id = ?
      ORDER BY ul.created_at DESC
    `, [currentUserId]);

    res.json({ likedUsers });

  } catch (error) {
    console.error("Error fetching liked users:", error);
    res.status(500).json({ message: "Server error while fetching liked users" });
  }
});

// =============================
// ✅ GET USERS WHO LIKED ME
// =============================
router.get("/api/likes/liked-by", async (req, res) => {
  try {
    const currentUserId = req.cookies?.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const likedByUsers = await queryDB(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.bio,
        u.photos,
        ul.like_type,
        ul.created_at
      FROM users u
      INNER JOIN users_likes ul ON u.id = ul.liker_id
      WHERE ul.liked_id = ?
      ORDER BY ul.created_at DESC
    `, [currentUserId]);

    res.json({ likedByUsers });

  } catch (error) {
    console.error("Error fetching users who liked me:", error);
    res.status(500).json({ message: "Server error while fetching users who liked me" });
  }
});

// =============================
// ✅ UNMATCH USER
// =============================
router.delete("/api/likes/unmatch/:matchId", async (req, res) => {
  try {
    const currentUserId = req.cookies?.userId;
    const { matchId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!matchId) {
      return res.status(400).json({ message: "Match ID is required" });
    }

    // Get the chat_id before deleting the match
    const matchData = await queryDB(`
      SELECT chat_id FROM users_likes 
      WHERE liker_id = ? AND liked_id = ? AND is_mutual = 1
    `, [currentUserId, matchId]);

    const chatId = matchData.length > 0 ? matchData[0].chat_id : null;

    // Delete the mutual likes (both directions)
    await queryDB(`
      DELETE FROM users_likes 
      WHERE (liker_id = ? AND liked_id = ?) OR (liker_id = ? AND liked_id = ?)
    `, [currentUserId, matchId, matchId, currentUserId]);

    // If there was a chat, delete it and all its messages
    if (chatId) {
      // Delete all messages in the chat
      await queryDB(`
        DELETE FROM messages WHERE chat_id = ?
      `, [chatId]);

      // Delete the chat itself
      await queryDB(`
        DELETE FROM chats WHERE id = ?
      `, [chatId]);
    }

    res.json({
      success: true,
      message: "Successfully unmatched user",
      chatDeleted: !!chatId
    });

  } catch (error) {
    console.error("Error unmatching user:", error);
    res.status(500).json({ message: "Server error while unmatching user" });
  }
});

// =============================
// ✅ TEST ENDPOINT
// =============================
router.get("/api/likes/test", async (req, res) => {
  try {
    // Test database connection
    const testQuery = await queryDB("SELECT 1 as test");
    
    // Test if users_likes table exists
    try {
      const tableCheck = await queryDB("DESCRIBE users_likes");
    } catch (tableError) {
      // Table doesn't exist
    }
    
    res.json({ 
      success: true, 
      message: "Test endpoint working",
      database: testQuery,
      cookies: req.cookies
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ message: "Test endpoint error", error: error.message });
  }
});

export default router;
