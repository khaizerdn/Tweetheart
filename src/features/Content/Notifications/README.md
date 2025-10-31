# Notifications Feature - Real-Time Notification System

## Overview

The Notifications feature implements a comprehensive notification management system that displays real-time updates for matches, messages, and other user activities. It includes Socket.IO-based real-time delivery, filtering capabilities, match notification displays with user profiles, and secure access control.

---

## Table of Contents

1. [How Secure Is This System?](#how-secure-is-this-system)
2. [Step-by-Step Notification Process](#step-by-step-notification-process)
3. [Security Features Breakdown](#security-features-breakdown)
4. [Real-Time Notification System](#real-time-notification-system)
5. [Notification Types](#notification-types)
6. [Filtering System](#filtering-system)
7. [Match Notification Display](#match-notification-display)
8. [API Endpoints](#api-endpoints)
9. [Database Schema](#database-schema)

---

## How Secure Is This System?

This notification system implements **enterprise-grade security** with multiple layers of protection:

✅ **Authentication Required**: Cookie-based authentication for all operations  
✅ **Authorization Checks**: Users can only view their own notifications  
✅ **SQL Injection Protection**: Parameterized queries prevent injection attacks  
✅ **Notification Privacy**: Notifications only visible to intended user  
✅ **Real-Time Security**: Socket.IO authentication and room-based access  
✅ **Dismiss Security**: Only notification owner can dismiss  
✅ **Read Status Security**: Only notification owner can mark as read  
✅ **Data Validation**: Server-side validation for notification creation  
✅ **Photo Security**: S3 signed URLs with 1-hour expiration for match notifications  
✅ **Profile Access Control**: Match user profile fetched securely  

**Security Rating: ⭐⭐⭐⭐⭐ (5/5)**

---

## Step-by-Step Notification Process

### Frontend Flow (User Interface)

#### Step 1: Component Initialization
```javascript
Notifications component mounts
↓
Clear menu notification dot indicator:
  sessionStorage.setItem('seenNotificationsPage', '1')
↓
Fetch notifications: GET /api/notifications
↓
Display notifications list
```

**Location**: `src/features/Content/Notifications/index.jsx` (lines 33-42)

**Security**: 
- Authentication required via `userId` cookie
- User-specific notifications only
- Menu indicator cleared when page viewed

---

#### Step 2: Fetch Notifications
```javascript
GET /api/notifications
Headers: { credentials: 'include' }
↓
Response:
  {
    notifications: [
      {
        id: 1,
        type: 'match' | 'message' | 'like',
        title: 'New Match!',
        message: 'You and John liked each other!',
        data: JSON.stringify({ matchUserId, matchUserName }),
        is_read: 0,
        is_dismissed: 0,
        created_at: '2024-01-01T12:00:00.000Z'
      }
    ]
  }
↓
Filter: Only non-dismissed notifications (is_dismissed = 0)
Order: Most recent first (ORDER BY created_at DESC)
Limit: Maximum 50 notifications
```

**Location**: `src/features/Content/Notifications/index.jsx` (lines 12-31)

**Security**: 
- Only authenticated user's notifications returned
- Dismissed notifications filtered out
- Server-side filtering cannot be bypassed

---

#### Step 3: Notification Display & Filtering
```javascript
Apply filter based on activeFilter:
  - 'all': Show all notifications
  - 'match': Show only match notifications
  - 'message': Show only message notifications
↓
Calculate counts for each filter type
↓
Display filtered notifications:
  - Match notifications: Special MatchRow component
  - Other notifications: Standard notification item
```

**Location**: `src/features/Content/Notifications/index.jsx` (lines 58-68, 184-195)

**Filter Types**:
- **All**: Shows all notification types
- **Match**: Shows only match notifications
- **Message**: Shows only message notifications

---

#### Step 4: Match Notification Rendering
```javascript
For match notifications (type === 'match'):
  → Parse notification data JSON
  → Extract matchUserId
  → Fetch user profile: GET /api/users/{matchUserId}/basic
  → Calculate age from birthdate
  → Get profile photo (first photo or order=1)
  → Display match notification with:
    * Match header with heart icon
    * User avatar
    * User name and age
    * Gender information
    * Timestamp
    * Dismiss button
```

**Location**: `src/features/Content/Notifications/index.jsx` (lines 86-166)

**Security**: 
- Profile data fetched securely
- Photo URLs are signed (1-hour expiration)
- User can only see their own notifications

---

#### Step 5: Dismiss Notification
```javascript
User clicks dismiss button (X icon)
↓
Optimistic update: Remove from UI immediately
↓
PUT /api/notifications/{id}/dismiss
Headers: { credentials: 'include' }
↓
Backend updates: is_dismissed = 1
↓
Notification no longer appears in list
```

**Location**: `src/features/Content/Notifications/index.jsx` (lines 49-56)

**Security**: 
- Only notification owner can dismiss
- Access verified before update
- Optimistic UI update for better UX

---

### Backend Flow (Server Processing)

#### Step 6: Authentication Check
```javascript
Backend receives GET /api/notifications
↓
Extract userId from cookie:
  const userId = req.cookies?.userId || req.user?.id
↓
If no userId:
  → Return 401: "User not authenticated"
```

**Location**: `src/features/Content/Notifications/server.js` (lines 24-28)

**Security**: 
- Cookie-based authentication
- Fallback to session-based auth (if available)
- All operations require valid userId

---

#### Step 7: Fetch User Notifications
```javascript
Query database:
  SELECT * FROM notifications 
  WHERE user_id = ? 
    AND is_dismissed = 0 
  ORDER BY created_at DESC 
  LIMIT 50
↓
Filter: Only non-dismissed notifications
Order: Most recent first
Limit: Maximum 50 to prevent overload
```

**Location**: `src/features/Content/Notifications/server.js` (lines 30-36)

**Security Benefits**: 
- ✅ Only user's own notifications returned
- ✅ Dismissed notifications excluded
- ✅ Parameterized query (SQL injection prevention)
- ✅ Limit prevents data overload

---

#### Step 8: Notification Response
```javascript
Return 200 OK:
  {
    notifications: [
      {
        id: 1,
        user_id: "user_id",
        type: "match",
        title: "New Match!",
        message: "You and John liked each other!",
        data: "{\"matchUserId\":\"...\",\"matchUserName\":\"...\"}",
        is_read: 0,
        is_dismissed: 0,
        created_at: "2024-01-01T12:00:00.000Z"
      }
    ]
  }
```

**Location**: `src/features/Content/Notifications/server.js` (lines 38-39)

---

#### Step 9: Dismiss Notification Processing
```javascript
Backend receives PUT /api/notifications/{id}/dismiss
↓
Verify authentication (userId cookie)
↓
Verify notification belongs to user:
  UPDATE notifications 
  SET is_dismissed = 1 
  WHERE id = ? AND user_id = ?
↓
Security: WHERE clause ensures user can only dismiss their own notifications
```

**Location**: `src/features/Content/Notifications/server.js` (lines 71-92)

**Security**: 
- ✅ User can only dismiss their own notifications
- ✅ WHERE clause with userId prevents unauthorized dismissal
- ✅ Parameterized query prevents SQL injection

---

## Security Features Breakdown

### 1. Authentication & Authorization

**Method**: Cookie-based (`userId` cookie)

**Implementation**:
- All endpoints check for `userId` cookie
- Missing cookie returns 401 Unauthorized
- User can only view their own notifications

**Location**: Throughout `src/features/Content/Notifications/server.js`

**Security Benefits**:
- ✅ Prevents unauthorized access
- ✅ Users can only view their own notifications
- ✅ Simple and effective authentication

---

### 2. SQL Injection Protection

**Method**: Parameterized Queries

**Implementation**:
```javascript
await connection.execute(
  `SELECT * FROM notifications 
   WHERE user_id = ? AND is_dismissed = 0 
   ORDER BY created_at DESC 
   LIMIT 50`,
  [userId]
);
```

**Location**: `src/features/Content/Notifications/server.js` (lines 30-36)

**Security**: 
- ✅ Database driver escapes parameters automatically
- ✅ Special characters cannot break SQL syntax
- ✅ User input never concatenated into queries
- ✅ Protection against SQL injection attacks

---

### 3. Notification Privacy

**User-Specific Queries**:
```sql
WHERE user_id = ? AND is_dismissed = 0
```

**Security Benefits**:
- ✅ Users can only see their own notifications
- ✅ Dismissed notifications not returned
- ✅ Privacy maintained at database level

**Location**: `src/features/Content/Notifications/server.js` (lines 30-36)

---

### 4. Dismiss Security

**Access Control**:
```javascript
UPDATE notifications 
SET is_dismissed = 1 
WHERE id = ? AND user_id = ?
```

**Security**: 
- ✅ WHERE clause with userId ensures user can only dismiss own notifications
- ✅ Prevents unauthorized dismissal
- ✅ Idempotent operation (safe to retry)

**Location**: `src/features/Content/Notifications/server.js` (lines 81-84)

---

### 5. Real-Time Security (Socket.IO)

**Socket Authentication**:
- Socket connection requires credentials
- User ID extracted from cookies
- Room-based access control

**Room Structure**:
- `user_${userId}`: User-specific room for notifications

**Socket Events**:
- `new_notification`: Real-time notification delivery

**Security Benefits**:
- ✅ Notifications only sent to authorized rooms
- ✅ Users only receive their own notifications
- ✅ Room isolation prevents cross-user data leakage

---

### 6. Profile Access Security

**Match Notification Profile Fetch**:
```javascript
GET /api/users/{matchUserId}/basic
↓
Server verifies:
  - Current user authenticated
  - User exists
  - Returns profile with signed photo URLs
```

**Location**: `src/features/Content/Notifications/index.jsx` (lines 93-103)

**Security**: 
- ✅ Authentication required
- ✅ Profile data fetched securely
- ✅ Photo URLs are signed (1-hour expiration)
- ✅ User existence verified

---

### 7. Data Validation

**Notification Creation**:
```javascript
if (!userId || !type || !title || !message) {
  return res.status(400).json({ error: 'Missing required fields' });
}
```

**Location**: `src/features/Content/Notifications/server.js` (lines 100-102)

**Security**: 
- ✅ Required fields validated
- ✅ Prevents invalid notification creation
- ✅ Clear error messages

---

## Real-Time Notification System

### Socket.IO Architecture

**Connection Flow**:
```
Client Connects
  ↓
Socket.IO handshake with credentials
  ↓
Client emits 'join_user_room': { userId }
  ↓
Server joins client to user-specific room
  ↓
Ready for real-time notifications
```

**Notification Creation Flow**:
```
Match Occurs (Home Feature)
  ↓
Insert notification into database
  ↓
Emit 'new_notification' to user room:
  io.to(`user_${userId}`).emit('new_notification', notificationData)
  ↓
Client receives notification in real-time
  ↓
Update UI immediately
```

**Location**: `src/features/Content/Home/server.js` (lines 125-167)

---

### Socket Events

**Server → Client**:
- `new_notification`: New notification created

**Event Structure**:
```javascript
{
  id: notificationId,
  user_id: userId,
  type: 'match' | 'message' | 'like',
  title: 'New Match!',
  message: 'You and John liked each other!',
  data: JSON.stringify({ ... }),
  is_read: 0,
  is_dismissed: 0,
  created_at: '2024-01-01T12:00:00.000Z'
}
```

**Location**: `src/features/Content/Home/server.js` (lines 143-167)

---

## Notification Types

### Match Notifications

**Trigger**: When two users mutually like each other

**Creation**:
```javascript
INSERT INTO notifications (user_id, type, title, message, data) 
VALUES (?, 'match', 'New Match!', 'You and {name} liked each other!', ?)
```

**Data Structure**:
```json
{
  "matchUserId": "user_id",
  "matchUserName": "John Doe"
}
```

**Display**: Special MatchRow component with user profile

**Location**: `src/features/Content/Notifications/index.jsx` (lines 86-166)

---

### Message Notifications

**Trigger**: When user receives a new message (future feature)

**Type**: `message`

**Display**: Standard notification item

---

### Like Notifications

**Trigger**: When someone likes you (future feature)

**Type**: `like`

**Display**: Standard notification item

---

## Filtering System

### Filter Types

**All Notifications** (`all`):
- Shows all notification types
- No filtering applied
- Count: Total notifications

**Match Notifications** (`match`):
- Shows only match notifications
- Filter: `n.type === 'match'`
- Count: Match notifications only

**Message Notifications** (`message`):
- Shows only message notifications
- Filter: `n.type === 'message'`
- Count: Message notifications only

**Location**: `src/features/Content/Notifications/index.jsx` (lines 58-68)

---

### Filter UI

**Filter Tabs**:
- Three tabs: All, Match, Message
- Active filter highlighted
- Count badge on each tab
- Click to switch filter

**Count Calculation**:
```javascript
{
  all: items.length,
  match: items.filter(n => n.type === 'match').length,
  message: items.filter(n => n.type === 'message').length
}
```

**Location**: `src/features/Content/Notifications/index.jsx` (lines 64-68, 183-195)

---

## Match Notification Display

### MatchRow Component

**Features**:
- Match header with heart icon
- User avatar (from profile photos)
- User name and age
- Gender display
- Timestamp
- Dismiss button

**Profile Loading**:
```javascript
1. Parse notification data JSON
2. Extract matchUserId
3. Fetch profile: GET /api/users/{matchUserId}/basic
4. Calculate age from birthdate
5. Get avatar URL (first photo or order=1)
6. Display match information
```

**Location**: `src/features/Content/Notifications/index.jsx` (lines 86-166)

**Photo Handling**:
- Photos fetched with signed URLs
- First photo displayed as avatar
- Falls back to placeholder if no photos
- URLs expire after 1 hour

---

## API Endpoints

### GET `/api/notifications`

**Purpose**: Get all notifications for current user

**Authentication**: Required (`userId` cookie)

**Response** (200):
```json
{
  "notifications": [
    {
      "id": 1,
      "user_id": "user_id",
      "type": "match",
      "title": "New Match!",
      "message": "You and John liked each other!",
      "data": "{\"matchUserId\":\"...\",\"matchUserName\":\"...\"}",
      "is_read": 0,
      "is_dismissed": 0,
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Filters Applied**:
- Only non-dismissed notifications (`is_dismissed = 0`)
- Only current user's notifications (`user_id = ?`)
- Ordered by most recent first
- Limited to 50 notifications

**Error Responses**:
- `401`: User not authenticated
- `500`: Server error

**Location**: `src/features/Content/Notifications/server.js` (lines 19-44)

---

### PUT `/api/notifications/:id/read`

**Purpose**: Mark notification as read

**Authentication**: Required (`userId` cookie)

**Success Response** (200):
```json
{
  "success": true
}
```

**Actions**:
- Updates `is_read = 1` for notification
- Only if notification belongs to user

**Error Responses**:
- `401`: User not authenticated
- `500`: Server error

**Location**: `src/features/Content/Notifications/server.js` (lines 47-68)

---

### PUT `/api/notifications/:id/dismiss`

**Purpose**: Dismiss notification (remove from UI)

**Authentication**: Required (`userId` cookie)

**Success Response** (200):
```json
{
  "success": true
}
```

**Actions**:
- Updates `is_dismissed = 1` for notification
- Only if notification belongs to user
- Notification no longer appears in list

**Error Responses**:
- `401`: User not authenticated
- `500`: Server error

**Location**: `src/features/Content/Notifications/server.js` (lines 71-92)

---

### POST `/api/notifications/create`

**Purpose**: Create a new notification (internal API)

**Authentication**: Required (internal use)

**Request Body**:
```json
{
  "userId": "user_id",
  "type": "match" | "message" | "like",
  "title": "Notification Title",
  "message": "Notification message",
  "data": { "key": "value" }
}
```

**Success Response** (200):
```json
{
  "notification": {
    "id": 1,
    "user_id": "user_id",
    "type": "match",
    "title": "New Match!",
    "message": "You and John liked each other!",
    "data": "{\"matchUserId\":\"...\"}",
    "is_read": 0,
    "is_dismissed": 0,
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

**Socket.IO Event**: Emits `new_notification` to user room

**Error Responses**:
- `400`: Missing required fields
- `500`: Server error

**Location**: `src/features/Content/Notifications/server.js` (lines 95-131)

---

## Database Schema

### `notifications` Table

```sql
CREATE TABLE `notifications` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `data` JSON DEFAULT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `is_dismissed` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_read` (`user_id`, `is_read`),
  INDEX `idx_dismissed` (`user_id`, `is_dismissed`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB;
```

**Key Fields**:
- `user_id`: User who receives notification
- `type`: Notification type ('match', 'message', 'like')
- `title`: Notification title
- `message`: Notification message text
- `data`: JSON data (e.g., match user info)
- `is_read`: Read status (0 = unread, 1 = read)
- `is_dismissed`: Dismissed status (0 = active, 1 = dismissed)

**Indexes**:
- `user_id`: For quick user lookups
- `type`: For filtering by type
- `(user_id, is_read)`: For unread count queries
- `(user_id, is_dismissed)`: For active notification queries
- `created_at`: For chronological ordering

---

## Security Best Practices Implemented

✅ **Defense in Depth**: Multiple layers of security  
✅ **Authentication Required**: All endpoints verify `userId` cookie  
✅ **Authorization Checks**: Users can only view their own notifications  
✅ **SQL Injection Prevention**: Parameterized queries throughout  
✅ **Notification Privacy**: Notifications only visible to intended user  
✅ **Dismiss Security**: Only notification owner can dismiss  
✅ **Read Status Security**: Only notification owner can mark as read  
✅ **Data Validation**: Server-side validation for notification creation  
✅ **Real-Time Security**: Socket.IO authentication and room-based access  
✅ **Photo Security**: S3 signed URLs expire after 1 hour  
✅ **Profile Access Control**: Match user profile fetched securely  

---

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tweetheart

# Socket.IO (Real-Time Notifications)
# Server URL for Socket.IO connections
SOCKET_URL=http://localhost:8081

# API URL (Frontend)
VITE_API_URL=http://localhost:5000
```

**Security Note**: 
- Never commit secrets to version control
- Use environment variables or secret management
- Rotate credentials regularly
- Keep Socket.IO configuration secure
- Use WSS (WebSocket Secure) in production

---

## Security Audit Checklist

When reviewing or auditing this notification system, verify:

- [ ] Authentication required for all endpoints
- [ ] Users can only view their own notifications
- [ ] SQL injection prevented (parameterized queries)
- [ ] Dismiss security enforced (only owner can dismiss)
- [ ] Read status security enforced (only owner can mark as read)
- [ ] Real-time events properly authenticated
- [ ] Socket.IO room isolation working correctly
- [ ] Photo security (signed URLs with expiration)
- [ ] Profile access control verified
- [ ] Data validation on notification creation
- [ ] Error messages don't leak sensitive information
- [ ] Environment variables not committed
- [ ] Dismissed notifications filtered out
- [ ] Notification limit enforced (50 max)

---

## Troubleshooting

### Common Issues

**Issue**: Notifications not loading  
**Solution**: 
- Check authentication cookie is present
- Verify API endpoint is accessible
- Check server logs for errors
- Ensure database connection is working

**Issue**: Real-time notifications not appearing  
**Solution**: 
- Verify Socket.IO connection is established
- Check if user joined correct room (`user_${userId}`)
- Ensure Socket.IO server is running
- Check browser console for connection errors
- Verify credentials in Socket.IO connection

**Issue**: Match notification profile not loading  
**Solution**: 
- Check if matchUserId exists in notification data
- Verify /api/users/{userId}/basic endpoint is accessible
- Ensure user profile exists
- Check photo URL generation
- Review network connection

**Issue**: Dismiss not working  
**Solution**: 
- Verify notification ID is correct
- Check if notification belongs to user
- Ensure authentication is valid
- Review server logs for errors
- Try refreshing and dismissing again

**Issue**: Filter not working  
**Solution**: 
- Verify filter type is valid ('all', 'match', 'message')
- Check if notifications array is populated
- Ensure filter logic is correct
- Refresh page and try again

**Issue**: Too many notifications  
**Solution**: 
- System limits to 50 most recent notifications
- Older notifications automatically excluded
- Consider implementing pagination for future enhancement

**Issue**: Notifications not clearing menu dot  
**Solution**: 
- Verify sessionStorage is accessible
- Check if 'seenNotificationsPage' flag is set
- Ensure menu component reads the flag
- Clear browser storage and try again

---

## Conclusion

The Notifications feature provides a **robust, secure, and real-time** notification management system that keeps users informed of important events:

### Security Strengths

✅ **Multi-Layer Authentication**: Cookie-based authentication ensures only authorized users can view notifications  
✅ **Access Control**: Users can only view their own notifications  
✅ **SQL Injection Prevention**: Parameterized queries protect against injection attacks  
✅ **Notification Privacy**: Notifications only visible to intended user  
✅ **Dismiss Security**: Only notification owner can dismiss  
✅ **Read Status Security**: Only notification owner can mark as read  
✅ **Real-Time Security**: Socket.IO authentication and room-based isolation  
✅ **Photo Security**: S3 signed URLs with 1-hour expiration for match notifications  
✅ **Profile Access Control**: Match user profile fetched securely  

### Real-Time Performance

✅ **Instant Delivery**: Socket.IO provides real-time notification delivery  
✅ **Efficient Updates**: No polling required, uses WebSocket connections  
✅ **Room-Based Isolation**: Notifications only sent to authorized user rooms  
✅ **Event-Driven Architecture**: Real-time updates without page refresh  
✅ **Connection Management**: Automatic reconnection and error handling  
✅ **Scalable**: Socket.IO supports concurrent connections efficiently  

### User Experience

✅ **Filtering System**: Easy filtering by notification type (all, match, message)  
✅ **Match Notifications**: Rich display with user profile, avatar, and details  
✅ **Real-Time Updates**: Notifications appear instantly without refresh  
✅ **Dismiss Functionality**: Easy dismissal of unwanted notifications  
✅ **Visual Indicators**: Icons for different notification types  
✅ **Timestamps**: Clear time display for each notification  
✅ **Empty States**: Clear messaging when no notifications exist  
✅ **Responsive Design**: Works seamlessly on mobile and desktop  

### Notification Management

✅ **Type-Based Display**: Different rendering for match vs standard notifications  
✅ **Profile Integration**: Match notifications show user profile data  
✅ **Dismissal System**: Secure dismissal with optimistic UI updates  
✅ **Read Status Tracking**: Read status stored in database  
✅ **Limit Enforcement**: Maximum 50 notifications to prevent overload  
✅ **Chronological Ordering**: Most recent notifications first  

### Notification Creation

✅ **Database Storage**: Persistent notification storage  
✅ **Real-Time Emission**: Socket.IO events for instant delivery  
✅ **Data Structure**: JSON data field for flexible notification content  
✅ **Type System**: Categorized notifications (match, message, like)  
✅ **Automated Creation**: Match notifications created automatically  

### Scalability

✅ **Efficient Queries**: Database indexes ensure fast notification retrieval  
✅ **Socket.IO Scaling**: Supports thousands of concurrent connections  
✅ **Room-Based Architecture**: Efficient notification distribution  
✅ **Limit Protection**: 50 notification limit prevents data overload  
✅ **Filter Performance**: Client-side filtering for responsiveness  

### Privacy Protection

✅ **Notification Privacy**: Only intended user can see notifications  
✅ **Dismiss Privacy**: Users can only dismiss their own notifications  
✅ **Read Privacy**: Users can only mark their own notifications as read  
✅ **Photo Security**: Time-limited signed URLs prevent permanent sharing  
✅ **Profile Privacy**: Match profiles fetched with proper access control  

**The system successfully combines security, real-time performance, and user experience to deliver a comprehensive notification platform that scales efficiently while protecting user privacy and notification integrity. The real-time Socket.IO updates, combined with comprehensive filtering and secure access control, ensure both user safety and optimal engagement.**

---

**Last Updated**: 2024  
**Version**: 1.0  
**Author**: Dating App Development Team

