import express from 'express';
import { body, validationResult } from 'express-validator';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

const router = express.Router();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tweetheart",
  connectionLimit: 10,
});

// AWS S3 configuration
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

// Helper function to execute queries
const queryDB = async (query, values = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(query, values);
    return rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  } finally {
    connection.release();
  }
};

// Helper function to generate signed URLs for photos
const generatePhotoUrls = async (photosData) => {
  if (!photosData) return [];
  
  let photos = [];
  try {
    photos = typeof photosData === 'string' ? JSON.parse(photosData) : photosData;
  } catch (e) {
    console.error("Error parsing photos JSON:", e);
    return [];
  }

  if (!Array.isArray(photos) || photos.length === 0) return [];

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

  return photosWithUrls;
};

// Get all chats for the current user
router.get('/api/chats', async (req, res) => {
  try {
    // Get user ID from session/cookie
    const userId = req.cookies?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch chats where user is either user1 or user2 and chat is active
    const chatsQuery = `
      SELECT 
        c.id,
        c.user1_id,
        c.user2_id,
        c.created_at,
        c.updated_at,
        CASE 
          WHEN c.user1_id = ? THEN c.user2_id 
          ELSE c.user1_id 
        END as other_user_id,
        u.first_name,
        u.last_name,
        u.photos,
        u.gender,
        u.bio,
        TIMESTAMPDIFF(YEAR, u.birthdate, CURDATE()) as age,
        m.content as last_message,
        m.created_at as last_message_time,
        COALESCE(COUNT(CASE WHEN msg.sender_id != ? AND msg.is_read = 0 THEN 1 END), 0) as unread_count
      FROM chats c
      LEFT JOIN users u ON (
        CASE 
          WHEN c.user1_id = ? THEN c.user2_id 
          ELSE c.user1_id 
        END = u.id
      )
      LEFT JOIN messages m ON c.id = m.chat_id
      LEFT JOIN messages m2 ON c.id = m2.chat_id AND m.created_at < m2.created_at
      LEFT JOIN messages msg ON c.id = msg.chat_id
      WHERE (c.user1_id = ? OR c.user2_id = ?) 
        AND c.is_active = 1
        AND m2.id IS NULL
      GROUP BY c.id, c.user1_id, c.user2_id, c.created_at, c.updated_at, other_user_id, u.first_name, u.last_name, u.photos, u.gender, u.bio, u.birthdate, m.content, m.created_at
      ORDER BY COALESCE(m.created_at, c.updated_at) DESC
    `;

    const chats = await queryDB(chatsQuery, [userId, userId, userId, userId, userId]);

    // Transform the data to match expected format
    const transformedChats = await Promise.all(chats.map(async (chat) => {
      const photos = await generatePhotoUrls(chat.photos);
      
      return {
        id: chat.id,
        other_user: {
          id: chat.other_user_id,
          name: `${chat.first_name} ${chat.last_name}`.trim(),
          age: chat.age,
          gender: chat.gender,
          bio: chat.bio,
          photos: photos
        },
        last_message: chat.last_message,
        last_message_time: chat.last_message_time,
        unread_count: chat.unread_count,
        created_at: chat.created_at,
        updated_at: chat.updated_at
      };
    }));

    res.json({ chats: transformedChats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Get messages for a specific chat
router.get('/api/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.cookies?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user has access to this chat
    const chatQuery = `
      SELECT id FROM chats 
      WHERE id = ? AND (user1_id = ? OR user2_id = ?)
    `;
    const chatExists = await queryDB(chatQuery, [chatId, userId, userId]);
    
    if (chatExists.length === 0) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    // Fetch messages for the chat
    const messagesQuery = `
      SELECT 
        id,
        content,
        sender_id,
        created_at,
        is_read
      FROM messages 
      WHERE chat_id = ? 
      ORDER BY created_at ASC
    `;
    
    const messages = await queryDB(messagesQuery, [chatId]);
    
    // Mark messages as read for the current user
    const updatedMessages = messages.map(msg => ({
      ...msg,
      is_own: msg.sender_id === userId
    }));

    res.json({ messages: updatedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message to a chat
router.post('/api/chats/:chatId/messages', [
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { chatId } = req.params;
    const { message } = req.body;
    const userId = req.cookies?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if this is a temporary chat ID (preparation chat)
    let actualChatId = chatId;
    let isNewChat = false;
    
    if (chatId.includes('_') && !chatId.startsWith('chat_')) {
      // This is a preparation chat with user IDs, we need to create it in the database
      // Extract user IDs from the chatId (format: userId1_userId2)
      const userIds = chatId.split('_');
      const otherUserId = userIds.find(id => id !== userId);
      
      if (!otherUserId) {
        return res.status(400).json({ error: 'Invalid chat ID format' });
      }
      
      // Check if chat already exists to prevent duplicates
      const existingChatQuery = `
        SELECT id FROM chats 
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `;
      const existingChat = await queryDB(existingChatQuery, [userId, otherUserId, otherUserId, userId]);
      
      if (existingChat.length > 0) {
        // Chat already exists, use the existing one
        actualChatId = existingChat[0].id;
        isNewChat = false;
        console.log('Chat already exists, using existing ID:', actualChatId);
      } else {
        // Create the actual chat in the database
        actualChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const insertChatQuery = `
          INSERT INTO chats (id, user1_id, user2_id, is_active, created_at) 
          VALUES (?, ?, ?, 1, NOW())
        `;
        
        console.log('Creating new chat with ID:', actualChatId, 'for users:', userId, 'and', otherUserId);
        await queryDB(insertChatQuery, [actualChatId, userId, otherUserId]);
        
        // Update users_likes table to set chat_id for both mutual likes
        const updateLikesQuery = `
          UPDATE users_likes 
          SET chat_id = ? 
          WHERE ((liker_id = ? AND liked_id = ?) OR (liker_id = ? AND liked_id = ?)) 
          AND like_type = 'like' AND is_mutual = 1
        `;
        await queryDB(updateLikesQuery, [actualChatId, userId, otherUserId, otherUserId, userId]);
        console.log('Updated users_likes table with chat_id:', actualChatId, 'for users:', userId, 'and', otherUserId);
        
        isNewChat = true;
      }
    } else {
      // This is an existing chat, verify access
      const chatQuery = `
        SELECT id FROM chats 
        WHERE id = ? AND (user1_id = ? OR user2_id = ?)
      `;
      const chatExists = await queryDB(chatQuery, [actualChatId, userId, userId]);
      
      if (chatExists.length === 0) {
        return res.status(403).json({ error: 'Access denied to this chat' });
      }
    }

    // Insert new message
    const insertMessageQuery = `
      INSERT INTO messages (chat_id, sender_id, content, created_at) 
      VALUES (?, ?, ?, NOW())
    `;
    
    const result = await queryDB(insertMessageQuery, [actualChatId, userId, message]);
    const messageId = result.insertId;

    // Update chat timestamp
    const updateChatQuery = `
      UPDATE chats SET updated_at = NOW() WHERE id = ?
    `;
    await queryDB(updateChatQuery, [actualChatId]);

    // Emit events to both users
    const io = req.app.get('io');
    if (io) {
      if (isNewChat) {
        // This is a new chat, emit new_chat_created event
        // Extract otherUserId from the original chatId
        const userIds = chatId.split('_');
        const otherUserId = userIds.find(id => id !== userId);
        
        console.log('Emitting new_chat_created for chat:', actualChatId, 'to users:', userId, 'and', otherUserId);
        
        // Get the other user's info for the socket event
        const otherUserQuery = `
          SELECT first_name, last_name, photos, gender, bio, 
                 TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) as age
          FROM users WHERE id = ?
        `;
        const otherUser = await queryDB(otherUserQuery, [otherUserId]);
        
        if (otherUser.length > 0) {
          const user = otherUser[0];
          const photos = await generatePhotoUrls(user.photos);
          
          // Get the current user's info for the receiver
          const currentUserQuery = `
            SELECT first_name, last_name, photos, gender, bio, 
                   TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) as age
            FROM users WHERE id = ?
          `;
          const currentUser = await queryDB(currentUserQuery, [userId]);
          
          if (currentUser.length > 0) {
            const currentUserData = currentUser[0];
            const currentUserPhotos = await generatePhotoUrls(currentUserData.photos);
            
            const chatData = {
              id: actualChatId,
              other_user: {
                id: otherUserId,
                name: `${user.first_name} ${user.last_name}`.trim(),
                age: user.age,
                gender: user.gender,
                bio: user.bio,
                photos: photos
              },
              last_message: message,
              last_message_time: new Date().toISOString(),
              unread_count: 0, // Sender sees 0 unread messages
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_preparation: false
            };

            const receiverChatData = {
              id: actualChatId,
              other_user: {
                id: userId,
                name: `${currentUserData.first_name} ${currentUserData.last_name}`.trim(),
                age: currentUserData.age,
                gender: currentUserData.gender,
                bio: currentUserData.bio,
                photos: currentUserPhotos
              },
              last_message: message,
              last_message_time: new Date().toISOString(),
              unread_count: 1, // Receiver sees 1 unread message
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_preparation: false
            };

            // Emit to both users with proper data
            console.log('Emitting to user:', userId, 'room:', `user_${userId}`);
            console.log('Sender chat data:', JSON.stringify(chatData, null, 2));
            io.to(`user_${userId}`).emit('new_chat_created', chatData);
            
            console.log('Emitting to user:', otherUserId, 'room:', `user_${otherUserId}`);
            console.log('Receiver chat data:', JSON.stringify(receiverChatData, null, 2));
            io.to(`user_${otherUserId}`).emit('new_chat_created', receiverChatData);
          }

          // Emit match_removed event to both users to update their matches list
          console.log('Emitting match_removed for users:', userId, 'and', otherUserId);
          io.to(`user_${userId}`).emit('match_removed', { matchId: otherUserId, chatId: actualChatId });
          io.to(`user_${otherUserId}`).emit('match_removed', { matchId: userId, chatId: actualChatId });
        }
      } else {
        // This is an existing chat, emit chat_activated event
        // Get both users in the chat
        const chatUsersQuery = `
          SELECT user1_id, user2_id FROM chats WHERE id = ?
        `;
        const chatUsers = await queryDB(chatUsersQuery, [actualChatId]);
        
        if (chatUsers.length > 0) {
          const { user1_id, user2_id } = chatUsers[0];
          
          const chatActivationDataForSender = {
            id: actualChatId,
            last_message: message,
            unread_count: 0, // Sender sees 0 unread messages
            is_preparation: false
          };
          
          const chatActivationDataForReceiver = {
            id: actualChatId,
            last_message: message,
            unread_count: 1, // Receiver sees 1 unread message
            is_preparation: false
          };
          
          // Sender gets 0 unread, receiver gets 1 unread
          if (userId === user1_id) {
            io.to(`user_${user1_id}`).emit('chat_activated', chatActivationDataForSender);
            io.to(`user_${user2_id}`).emit('chat_activated', chatActivationDataForReceiver);
          } else {
            io.to(`user_${user2_id}`).emit('chat_activated', chatActivationDataForSender);
            io.to(`user_${user1_id}`).emit('chat_activated', chatActivationDataForReceiver);
          }
        }
      }
    }

    res.json({ 
      message: 'Message sent successfully',
      sender_id: userId,
      message_id: messageId,
      chat_id: actualChatId,
      is_new_chat: isNewChat
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new chat
router.post('/api/chats', [
  body('matchId').notEmpty().withMessage('Match ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matchId } = req.body;
    const userId = req.cookies?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if users are mutual matches
    const matchQuery = `
      SELECT 1 FROM users_likes 
      WHERE liker_id = ? AND liked_id = ? AND like_type = 'like' AND is_mutual = 1
      UNION
      SELECT 1 FROM users_likes 
      WHERE liker_id = ? AND liked_id = ? AND like_type = 'like' AND is_mutual = 1
    `;
    const isMatch = await queryDB(matchQuery, [userId, matchId, matchId, userId]);
    
    console.log('Match check for users:', userId, 'and', matchId, 'Result:', isMatch);
    
    if (isMatch.length === 0) {
      return res.status(403).json({ error: 'Users must be mutual matches to start a chat' });
    }

    // Check if chat already exists
    const existingChatQuery = `
      SELECT id, is_active FROM chats 
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `;
    const existingChat = await queryDB(existingChatQuery, [userId, matchId, matchId, userId]);
    
    if (existingChat.length > 0) {
      return res.json({ 
        chat: { id: existingChat[0].id, is_active: existingChat[0].is_active },
        message: 'Chat already exists'
      });
    }

    // Generate a temporary chat ID using user IDs (not saved to DB yet)
    const tempChatId = `${userId}_${matchId}`;

    res.json({ 
      chat: { id: tempChatId, is_preparation: true },
      message: 'Preparation chat created'
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark messages as read
router.put('/api/chats/:chatId/read', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.cookies?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user has access to this chat
    const chatQuery = `
      SELECT id FROM chats 
      WHERE id = ? AND (user1_id = ? OR user2_id = ?)
    `;
    const chatExists = await queryDB(chatQuery, [chatId, userId, userId]);
    
    if (chatExists.length === 0) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    // Get messages that will be marked as read (before update)
    const getMessagesQuery = `
      SELECT id, sender_id 
      FROM messages 
      WHERE chat_id = ? AND sender_id != ? AND is_read = 0
    `;
    const messagesToRead = await queryDB(getMessagesQuery, [chatId, userId]);

    // Mark messages as read
    const updateQuery = `
      UPDATE messages 
      SET is_read = 1 
      WHERE chat_id = ? AND sender_id != ?
    `;
    await queryDB(updateQuery, [chatId, userId]);

    // Emit read receipt to the sender of the messages via socket
    const io = req.app.get('io');
    if (io && messagesToRead.length > 0) {
      // Get the other user ID (the sender of these messages)
      const chatQuery = `
        SELECT user1_id, user2_id FROM chats WHERE id = ?
      `;
      const chatUsers = await queryDB(chatQuery, [chatId]);
      
      if (chatUsers.length > 0) {
        const { user1_id, user2_id } = chatUsers[0];
        const senderId = userId === user1_id ? user2_id : user1_id;
        
        // Emit to the sender that their messages have been read - REAL-TIME via WebSocket
        const messageIds = messagesToRead.map(msg => msg.id);
        console.log(`📤 Emitting read receipt via WebSocket to user_${senderId} for chat ${chatId}, messages:`, messageIds);
        io.to(`user_${senderId}`).emit('messages_read', {
          chatId: chatId,
          messageIds: messageIds
        });
      }
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a chat
router.delete('/api/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.cookies?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user has access to this chat
    const chatQuery = `
      SELECT id FROM chats 
      WHERE id = ? AND (user1_id = ? OR user2_id = ?)
    `;
    const chatExists = await queryDB(chatQuery, [chatId, userId, userId]);
    
    if (chatExists.length === 0) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    // Delete chat (messages will be deleted due to CASCADE)
    const deleteQuery = `DELETE FROM chats WHERE id = ?`;
    await queryDB(deleteQuery, [chatId]);

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
