import express from 'express';
import { body, validationResult } from 'express-validator';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

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

// Get all chats for the current user
router.get('/api/chats', async (req, res) => {
  try {
    // Get user ID from session/cookie
    const userId = req.cookies?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch chats where user is either user1 or user2
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
        m.created_at as last_message_time
      FROM chats c
      LEFT JOIN users u ON (
        CASE 
          WHEN c.user1_id = ? THEN c.user2_id 
          ELSE c.user1_id 
        END = u.id
      )
      LEFT JOIN messages m ON c.id = m.chat_id
      LEFT JOIN messages m2 ON c.id = m2.chat_id AND m.created_at < m2.created_at
      WHERE (c.user1_id = ? OR c.user2_id = ?) 
        AND m2.id IS NULL
      ORDER BY COALESCE(m.created_at, c.updated_at) DESC
    `;

    const chats = await queryDB(chatsQuery, [userId, userId, userId, userId]);

    // Transform the data to match expected format
    const transformedChats = chats.map(chat => ({
      id: chat.id,
      other_user: {
        id: chat.other_user_id,
        name: `${chat.first_name} ${chat.last_name}`.trim(),
        age: chat.age,
        gender: chat.gender,
        bio: chat.bio,
        photos: chat.photos ? JSON.parse(chat.photos) : []
      },
      last_message: chat.last_message,
      last_message_time: chat.last_message_time,
      created_at: chat.created_at,
      updated_at: chat.updated_at
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

    // Verify user has access to this chat
    const chatQuery = `
      SELECT id FROM chats 
      WHERE id = ? AND (user1_id = ? OR user2_id = ?)
    `;
    const chatExists = await queryDB(chatQuery, [chatId, userId, userId]);
    
    if (chatExists.length === 0) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }

    // Insert new message
    const insertMessageQuery = `
      INSERT INTO messages (chat_id, sender_id, content, created_at) 
      VALUES (?, ?, ?, NOW())
    `;
    
    const result = await queryDB(insertMessageQuery, [chatId, userId, message]);
    const messageId = result.insertId;

    // Update chat's updated_at timestamp
    const updateChatQuery = `
      UPDATE chats SET updated_at = NOW() WHERE id = ?
    `;
    await queryDB(updateChatQuery, [chatId]);

    res.json({ 
      message: 'Message sent successfully',
      sender_id: userId,
      message_id: messageId
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
    
    if (isMatch.length === 0) {
      return res.status(403).json({ error: 'Users must be mutual matches to start a chat' });
    }

    // Check if chat already exists
    const existingChatQuery = `
      SELECT id FROM chats 
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `;
    const existingChat = await queryDB(existingChatQuery, [userId, matchId, matchId, userId]);
    
    if (existingChat.length > 0) {
      return res.json({ 
        chat: { id: existingChat[0].id },
        message: 'Chat already exists'
      });
    }

    // Create new chat
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const insertChatQuery = `
      INSERT INTO chats (id, user1_id, user2_id, created_at) 
      VALUES (?, ?, ?, NOW())
    `;
    
    await queryDB(insertChatQuery, [chatId, userId, matchId]);

    res.json({ 
      chat: { id: chatId },
      message: 'Chat created successfully'
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

    // Mark messages as read
    const updateQuery = `
      UPDATE messages 
      SET is_read = 1 
      WHERE chat_id = ? AND sender_id != ?
    `;
    await queryDB(updateQuery, [chatId, userId]);

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
