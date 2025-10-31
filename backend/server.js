import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

// ======================
// ✅ INITIAL SETUP
// ======================
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Global middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

// ======================
// ✅ HEALTH CHECK ENDPOINT
// ======================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ======================
// ✅ AUTO-REGISTER ROUTES (Supports nested folders)
// ======================
import { pathToFileURL } from "url";

const featuresDir = path.join(__dirname, "../src");

async function loadRoutesRecursively(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectories
      await loadRoutesRecursively(fullPath);
    } else if (entry.isFile() && entry.name === "server.js") {
      try {
        // Use file:// URL - Node.js will look for package.json in parent directories
        // Make sure path uses forward slashes and has .js extension
        const normalizedPath = fullPath.replace(/\\/g, '/');
        const fileUrl = pathToFileURL(normalizedPath).href;
        const routeModule = (await import(fileUrl)).default;
        if (routeModule) {
          app.use("/", routeModule);
          console.log(`✅ Loaded route: ${fullPath.replace(featuresDir, "")}`);
        }
      } catch (err) {
        console.error(`❌ Failed to load route at ${fullPath}:`, err.message);
        // Log more details for debugging
        if (err.code === 'ERR_UNSUPPORTED_DIR_IMPORT') {
          console.error(`   This might be a module resolution issue. Check package.json in parent directories.`);
        }
      }
    }
  }
}

// ======================
// ✅ SOCKET.IO SETUP
// ======================
const connectedUsers = new Map(); // Store user ID to socket ID mapping
const userRooms = new Map(); // Store user ID to their current room mapping

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Handle user joining a chat room
  socket.on('join_chat', (data) => {
    let chatId, userId;
    
    // Handle both old format (string) and new format (object)
    if (typeof data === 'string') {
      chatId = data;
      userId = 'unknown';
    } else {
      chatId = data.chatId;
      userId = data.userId;
    }
    
    // Store user's current room
    if (userId && userId !== 'unknown') {
      userRooms.set(userId, `chat_${chatId}`);
      connectedUsers.set(userId, socket.id);
    }
    
    socket.join(`chat_${chatId}`);
    console.log(`👥 User ${userId || socket.id} joined chat: ${chatId}`);
    console.log(`📊 Users in room chat_${chatId}:`, Array.from(io.sockets.adapter.rooms.get(`chat_${chatId}`) || []).length);
  });

  // Handle user joining their personal room for chat list updates and notifications
  socket.on('join_user_room', (data) => {
    const { userId } = data;
    
    if (userId) {
      socket.join(`user_${userId}`);
      connectedUsers.set(userId, socket.id);
      console.log(`👤 User ${userId} joined personal room for chat updates and notifications`);
    }
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    const { chatId, message, senderId } = data;
    
    try {
      const messageData = {
        id: Date.now(),
        content: message,
        sender_id: senderId,
        created_at: new Date().toISOString()
      };
      
      // Broadcast message to ALL users in the chat room (including sender)
      // This ensures everyone in the room gets the message
      io.to(`chat_${chatId}`).emit('new_message', {
        ...messageData,
        is_own: false // Let the frontend determine if it's their own message
      });
      
      console.log(`💬 Message sent in chat ${chatId} by user ${senderId}: ${message}`);
      console.log(`📡 Broadcasting to room: chat_${chatId}`);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    // Remove user from connected users map if needed
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// Make io available globally for API routes
app.set('io', io);

// Load routes and start server
async function startServer() {
  try {
    await loadRoutesRecursively(featuresDir);
    
    const PORT = process.env.SERVER_PORT || 8081;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 Socket.io server ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

startServer();
