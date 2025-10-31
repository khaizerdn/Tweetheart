import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gamers',
  port: process.env.DB_PORT || 3306,
};

// Get all notifications for a user
router.get('/notifications', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Get user ID from session/cookie (you may need to adjust this based on your auth system)
    const userId = req.user?.id || req.cookies?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const [notifications] = await connection.execute(
      `SELECT * FROM notifications 
       WHERE user_id = ? AND is_dismissed = 0 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    await connection.end();
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const { id } = req.params;
    const userId = req.user?.id || req.cookies?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await connection.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Dismiss notification (remove from UI)
router.put('/notifications/:id/dismiss', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const { id } = req.params;
    const userId = req.user?.id || req.cookies?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await connection.execute(
      'UPDATE notifications SET is_dismissed = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ error: 'Failed to dismiss notification' });
  }
});

// Create a new notification (internal API for other services)
router.post('/notifications/create', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const { userId, type, title, message, data } = req.body;
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await connection.execute(
      `INSERT INTO notifications (user_id, type, title, message, data) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );

    const notificationId = result.insertId;
    
    // Get the created notification
    const [notifications] = await connection.execute(
      'SELECT * FROM notifications WHERE id = ?',
      [notificationId]
    );

    await connection.end();
    
    // Emit to Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', notifications[0]);
    }

    res.json({ notification: notifications[0] });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

export default router;