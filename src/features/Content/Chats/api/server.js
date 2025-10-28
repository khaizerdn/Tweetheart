import express from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Mock data for demonstration - replace with actual database operations
const mockChats = new Map();
const mockMessages = new Map();

// Get all chats for the current user
router.get('/api/chats', async (req, res) => {
  try {
    // Get user ID from session/cookie
    const userId = req.cookies?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock response - replace with actual database query
    const chats = Array.from(mockChats.values()).filter(chat => 
      chat.participants.includes(userId)
    );

    res.json({ chats });
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

    // Mock response - replace with actual database query
    const messages = mockMessages.get(chatId) || [];
    
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

    // Create new message
    const newMessage = {
      id: Date.now(),
      content: message,
      sender_id: userId,
      created_at: new Date().toISOString(),
      is_own: true
    };

    // Store message (mock - replace with actual database save)
    if (!mockMessages.has(chatId)) {
      mockMessages.set(chatId, []);
    }
    mockMessages.get(chatId).push(newMessage);

    res.json({ 
      message: 'Message sent successfully',
      sender_id: userId,
      message_id: newMessage.id
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

    // Create new chat (mock - replace with actual database save)
    const chatId = `chat_${Date.now()}`;
    const newChat = {
      id: chatId,
      participants: [userId, matchId],
      created_at: new Date().toISOString(),
      last_message: null
    };

    mockChats.set(chatId, newChat);
    mockMessages.set(chatId, []);

    res.json({ 
      chat: newChat,
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

    // Mock implementation - replace with actual database update
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

    // Mock implementation - replace with actual database delete
    mockChats.delete(chatId);
    mockMessages.delete(chatId);

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
