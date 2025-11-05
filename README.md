# Tweetheart Dating App

> Entry project for Whitecloack Technologies, Inc.

A modern, secure dating application built with React, Node.js, Express, MariaDB, and AWS S3. This application implements enterprise-grade security features, real-time communication, and a seamless user experience for matching and connecting with others.

<a href="https://ibb.co/BH1t3Y34">
 <img src="https://i.ibb.co/mrxGTPTv/Screenshot-2025-11-05-231127.png" alt="Screenshot-2025-11-05-231127" border="0">
</a>

Static Preview: https://khaizerdn.github.io/Tweetheart/

## 📋 Table of Contents

### 🚀 Quick Start
- [Getting Started](#getting-started)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)

### 🔐 Authentication & Onboarding
- [Login Feature](./src/features/Login/README.md) - Secure user authentication with rate limiting, JWT tokens, and session management
- [SignUp Feature](./src/features/SignUp/README.md) - User registration with email verification, photo upload, and security measures

### 👤 Profile Management
- [Profile Feature](./src/features/Content/Profile/README.md) - User profile editing, photo management, and secure data updates
- [OtherProfile Feature](./src/features/Content/OtherProfile/README.md) - Read-only profile viewing with secure photo access

### 🎯 Core Features
- [Home Feature](./src/features/Content/Home/README.md) - Dating feed with swipe mechanics, match detection, and location-based filtering
- [Matches Feature](./src/features/Content/Matches/README.md) - Mutual matches display, filtering, chat initiation, and unmatch functionality
- [Chats Feature](./src/features/Content/Chats/README.md) - Real-time messaging system with Socket.IO, read receipts, and chat management
- [Notifications Feature](./src/features/Content/Notifications/README.md) - Real-time notification system for matches and messages

### ⚙️ Settings
- [Settings Feature](./src/features/Content/Settings/README.md) - Theme management system (dark/light mode) with localStorage persistence

### 📚 Additional Resources
- [Security Overview](#security-overview)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MariaDB (v10.5 or higher)
- AWS Account (for S3 photo storage)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Dating-App
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies (if separate)
   cd server
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in root directory
   cp .env.example .env
   ```
   
   Configure the following variables:
   ```env
   # Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=tweetheart
   DB_PORT=3306

   # AWS S3
   BUCKET_NAME=your-bucket-name
   BUCKET_REGION=us-east-1
   ACCESS_KEY=your-access-key
   SECRET_ACCESS_KEY=your-secret-access-key

   # JWT
   JWT_SECRET=your-jwt-secret-key
   REFRESH_TOKEN_SECRET=your-refresh-token-secret

   # Email (Nodemailer)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Server
   PORT=5000
   SOCKET_PORT=8081

   # Frontend
   VITE_API_URL=http://localhost:5000
   ```

4. **Set up database**
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE tweetheart;
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

---

## 💻 Technology Stack

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **CSS Modules** - Scoped styling
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MariaDB** - Database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Socket.IO** - Real-time communication
- **Multer** - File upload handling
- **Sharp** - Image processing
- **AWS SDK** - S3 integration
- **Nodemailer** - Email service

### Infrastructure
- **AWS S3** - Photo storage
- **MariaDB** - Relational database
- **Socket.IO Server** - Real-time server

---

## 📁 Project Structure

```
Dating-App/
├── src/
│   ├── features/
│   │   ├── Login/
│   │   │   ├── README.md          # Login documentation
│   │   │   ├── index.jsx
│   │   │   ├── server.js
│   │   │   └── styles.module.css
│   │   ├── SignUp/
│   │   │   ├── README.md          # SignUp documentation
│   │   │   ├── index.jsx
│   │   │   ├── server.js
│   │   │   └── styles.module.css
│   │   ├── Content/
│   │   │   ├── Profile/
│   │   │   │   ├── README.md      # Profile documentation
│   │   │   │   ├── index.jsx
│   │   │   │   ├── server.js
│   │   │   │   └── styles.module.css
│   │   │   ├── OtherProfile/
│   │   │   │   ├── README.md      # OtherProfile documentation
│   │   │   │   ├── index.jsx
│   │   │   │   ├── server.js
│   │   │   │   └── styles.module.css
│   │   │   ├── Home/
│   │   │   │   ├── README.md      # Home documentation
│   │   │   │   ├── index.jsx
│   │   │   │   ├── server.js
│   │   │   │   └── styles.module.css
│   │   │   ├── Matches/
│   │   │   │   ├── README.md      # Matches documentation
│   │   │   │   ├── index.jsx
│   │   │   │   ├── server.js
│   │   │   │   └── styles.module.css
│   │   │   ├── Chats/
│   │   │   │   ├── README.md      # Chats documentation
│   │   │   │   ├── index.jsx
│   │   │   │   ├── server.js
│   │   │   │   └── styles.module.css
│   │   │   ├── Notifications/
│   │   │   │   ├── README.md      # Notifications documentation
│   │   │   │   ├── index.jsx
│   │   │   │   ├── server.js
│   │   │   │   └── styles.module.css
│   │   │   └── Settings/
│   │   │       ├── README.md      # Settings documentation
│   │   │       ├── index.jsx
│   │   │       ├── server.js
│   │   │       └── styles.module.css
│   │   └── ...
│   ├── components/
│   ├── api/
│   └── utils/
├── README.md                      # This file
└── package.json
```

---

## 🔐 Security Overview

This application implements **enterprise-grade security** across all features:

### Authentication & Authorization
- ✅ Cookie-based authentication with HttpOnly, Secure, SameSite flags
- ✅ JWT access tokens with refresh token rotation
- ✅ Session management with device fingerprinting
- ✅ Rate limiting on login attempts (3 attempts, 2-minute lockout)

### Data Protection
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ SQL injection prevention via parameterized queries
- ✅ XSS prevention through input validation
- ✅ Secure file uploads with type validation and size limits

### Photo Security
- ✅ AWS S3 private bucket storage
- ✅ Signed URLs with 1-hour expiration
- ✅ Image processing with Sharp (resize, format conversion, EXIF removal)
- ✅ File type validation (image/* only)

### Real-Time Communication
- ✅ Socket.IO authentication and room-based isolation
- ✅ User-specific rooms for secure event delivery
- ✅ Chat access verification before message delivery

### Privacy & Access Control
- ✅ User-specific data queries (users can only access their own data)
- ✅ Read-only access for other user profiles
- ✅ Match verification before chat creation
- ✅ Notification privacy (users only see their own notifications)

**For detailed security information, refer to each feature's README.**

---

## 📡 API Documentation

### Authentication Endpoints

**Login**
- `POST /login` - User login with email and password
- `POST /refresh` - Refresh access token using refresh token
- `POST /logout` - Logout and expire session

**SignUp**
- `POST /signup` - Create new user account
- `POST /api/signup/photos/upload-multiple` - Upload multiple photos during signup

### Profile Endpoints

**Own Profile**
- `GET /user-profile` - Get current user's profile
- `PUT /user-profile` - Update current user's profile
- `GET /api/photos` - Get current user's photos
- `POST /api/profile/photos/upload-multiple` - Upload multiple photos
- `DELETE /api/photos/delete` - Delete a photo

**Other Profiles**
- `GET /user-profile/:userId` - Get another user's profile (read-only)
- `GET /api/photos/:userId` - Get another user's photos (read-only)

### Matching Endpoints

**Likes & Matches**
- `POST /api/likes` - Like or pass a user
- `GET /api/likes/matches` - Get all mutual matches
- `GET /api/likes/liked` - Get all liked users
- `GET /api/likes/passed` - Get all passed users
- `DELETE /api/likes/unmatch/:matchId` - Unmatch a user

**User Feed**
- `GET /api/users/feed` - Get users for dating feed (with filters)

### Chat Endpoints

**Chat Management**
- `GET /api/chats` - Get all chats for current user
- `POST /api/chats` - Create a preparation chat
- `GET /api/chats/:chatId/messages` - Get messages for a chat
- `POST /api/chats/:chatId/messages` - Send a message
- `PUT /api/chats/:chatId/read` - Mark messages as read
- `DELETE /api/chats/:chatId` - Delete a chat

### Notification Endpoints

**Notifications**
- `GET /api/notifications` - Get all notifications for current user
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/:id/dismiss` - Dismiss a notification
- `POST /api/notifications/create` - Create a notification (internal)

**For detailed API documentation, refer to each feature's README.**

---

## 🗄️ Database Schema

### Core Tables

**users**
- User account information, profile data, photos metadata

**users_likes**
- Like/pass interactions, mutual matches, timestamps

**chats**
- Chat conversations between matched users

**messages**
- Individual messages within chats, read receipts

**notifications**
- User notifications (matches, messages, etc.)

**sessions**
- Active user sessions with device fingerprinting

**For detailed database schemas, refer to each feature's README.**

---

## 🔄 Feature Flow

### User Journey

1. **Registration** → [SignUp](./src/features/SignUp/README.md)
   - User creates account with email, password, profile info
   - Email verification with OTP
   - Photo uploads to S3

2. **Authentication** → [Login](./src/features/Login/README.md)
   - User logs in with credentials
   - JWT tokens generated and stored in cookies
   - Session created with device fingerprinting

3. **Profile Setup** → [Profile](./src/features/Content/Profile/README.md)
   - User completes/edits profile
   - Uploads photos
   - Sets preferences

4. **Discovery** → [Home](./src/features/Content/Home/README.md)
   - User browses dating feed
   - Swipes right (like) or left (pass) on users
   - Mutual likes create matches

5. **Matches** → [Matches](./src/features/Content/Matches/README.md)
   - User views all mutual matches
   - Filters matches
   - Initiates chat with matches

6. **Messaging** → [Chats](./src/features/Content/Chats/README.md)
   - Real-time messaging with matches
   - Read receipts and unread indicators
   - Chat management

7. **Notifications** → [Notifications](./src/features/Content/Notifications/README.md)
   - Real-time notifications for matches and messages
   - Notification filtering and dismissal

8. **Viewing Profiles** → [OtherProfile](./src/features/Content/OtherProfile/README.md)
   - View other users' profiles (read-only)
   - Secure photo viewing with signed URLs

9. **Settings** → [Settings](./src/features/Content/Settings/README.md)
   - Theme preferences (dark/light mode)
   - User preferences

---

## 🛡️ Security Best Practices

### Development
- ✅ Never commit `.env` files or secrets
- ✅ Use parameterized queries for all database operations
- ✅ Validate all user input on both client and server
- ✅ Implement rate limiting on authentication endpoints
- ✅ Use HTTPS in production
- ✅ Regularly update dependencies
- ✅ Implement proper error handling without data leakage

### Production
- ✅ Use environment variables for all secrets
- ✅ Enable CORS properly for production domains
- ✅ Implement proper logging (without sensitive data)
- ✅ Use secure cookie settings (HttpOnly, Secure, SameSite)
- ✅ Regular security audits
- ✅ Monitor for suspicious activity
- ✅ Keep dependencies updated

---

## 🚀 Deployment

### Environment Setup

1. **Database**
   - Set up MariaDB database
   - Run migration scripts if needed
   - Configure connection pooling

2. **AWS S3**
   - Create private S3 bucket
   - Configure IAM user with minimal permissions
   - Set up bucket CORS if needed

3. **Server**
   - Set environment variables
   - Configure SSL/TLS certificates
   - Set up reverse proxy (nginx, etc.)

4. **Frontend**
   - Build production bundle
   - Configure API URLs
   - Set up CDN for static assets

### Docker (Optional)

```dockerfile
# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 📝 Contributing

### Code Style
- Follow ESLint configuration
- Use meaningful variable names
- Add comments for complex logic
- Write self-documenting code

### Commit Messages
- Use clear, descriptive commit messages
- Follow conventional commit format
- Reference issue numbers if applicable

### Testing
- Test all features before committing
- Verify security measures
- Test on multiple browsers/devices

---

## 📖 Feature Documentation Links

### Authentication & Onboarding
- [Login Feature](./src/features/Login/README.md) - Comprehensive guide to login security and implementation
- [SignUp Feature](./src/features/SignUp/README.md) - User registration with verification and security

### Profile Management
- [Profile Feature](./src/features/Content/Profile/README.md) - Profile editing and photo management
- [OtherProfile Feature](./src/features/Content/OtherProfile/README.md) - Read-only profile viewing

### Core Features
- [Home Feature](./src/features/Content/Home/README.md) - Dating feed with swipe mechanics and matching
- [Matches Feature](./src/features/Content/Matches/README.md) - Mutual matches and chat initiation
- [Chats Feature](./src/features/Content/Chats/README.md) - Real-time messaging system
- [Notifications Feature](./src/features/Content/Notifications/README.md) - Real-time notification delivery

### Settings
- [Settings Feature](./src/features/Content/Settings/README.md) - Theme management and preferences

---

## 🔍 Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify database credentials in `.env`
- Check database server is running
- Verify network connectivity

**S3 Upload Errors**
- Verify AWS credentials
- Check bucket permissions
- Verify bucket region

**Socket.IO Connection Issues**
- Check Socket.IO server is running
- Verify port configuration
- Check CORS settings

**For feature-specific troubleshooting, refer to each feature's README.**

---

## 📞 Support

For questions, issues, or contributions:
- Review the feature-specific READMEs for detailed documentation
- Check the troubleshooting sections
- Review the security audit checklists in each README

---

## 📄 License

This project is developed for Whitecloack Technologies, Inc.

---

## 🎯 Quick Links to Feature Documentation

| Feature | Description | Documentation |
|---------|-------------|---------------|
| **Login** | Secure authentication | [Read More](./src/features/Login/README.md) |
| **SignUp** | User registration | [Read More](./src/features/SignUp/README.md) |
| **Profile** | Profile management | [Read More](./src/features/Content/Profile/README.md) |
| **OtherProfile** | View other profiles | [Read More](./src/features/Content/OtherProfile/README.md) |
| **Home** | Dating feed | [Read More](./src/features/Content/Home/README.md) |
| **Matches** | Mutual matches | [Read More](./src/features/Content/Matches/README.md) |
| **Chats** | Messaging system | [Read More](./src/features/Content/Chats/README.md) |
| **Notifications** | Real-time notifications | [Read More](./src/features/Content/Notifications/README.md) |
| **Settings** | Theme settings | [Read More](./src/features/Content/Settings/README.md) |

---

**Last Updated**: 2024  
**Version**: 1.0  
**Project**: Dating App - Whitecloack Technologies, Inc.
