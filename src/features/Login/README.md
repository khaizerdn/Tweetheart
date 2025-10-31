# Login Feature - Security Documentation

## Overview

The Login feature implements a comprehensive, multi-layered security system designed to protect user accounts from unauthorized access while providing a seamless authentication experience. This document explains the security mechanisms and walks through the login process step-by-step.

---

## Table of Contents

1. [How Secure Is This System?](#how-secure-is-this-system)
2. [Step-by-Step Login Process](#step-by-step-login-process)
3. [Security Features Breakdown](#security-features-breakdown)
4. [Token Management](#token-management)
5. [Rate Limiting & Brute Force Protection](#rate-limiting--brute-force-protection)
6. [Device Fingerprinting](#device-fingerprinting)
7. [Session Management](#session-management)
8. [Cookie Security](#cookie-security)
9. [Password Security](#password-security)
10. [API Endpoints](#api-endpoints)

---

## How Secure Is This System?

This login system implements **enterprise-grade security** with multiple layers of protection:

✅ **Password Security**: Passwords are hashed using bcrypt before storage  
✅ **Token-Based Authentication**: JWT tokens with short expiration times  
✅ **HttpOnly Cookies**: Tokens stored in HttpOnly cookies (not accessible via JavaScript)  
✅ **Rate Limiting**: Maximum 3 failed attempts with 2-minute lockout  
✅ **Device Fingerprinting**: Tracks login attempts per device  
✅ **SQL Injection Protection**: Parameterized queries prevent injection attacks  
✅ **Secure Cookie Flags**: SameSite: Strict and Secure flags in production  
✅ **Automatic Token Refresh**: Seamless token renewal without user intervention  
✅ **Session Tracking**: Database-backed session management with device validation  
✅ **HTTPS Enforcement**: Secure cookies only in production environment  

---

## Step-by-Step Login Process

### Frontend Flow (User Interface)

#### Step 1: User Input
```javascript
User enters email and password in login form
↓
Frontend validates fields are not empty
↓
Email is trimmed to remove whitespace
```

**Location**: `src/features/Login/index.jsx` (lines 29-39)

**Security**: Basic client-side validation prevents unnecessary API calls and provides immediate feedback.

---

#### Step 2: API Request Preparation
```javascript
POST request to ${API_URL}/login
Headers: { withCredentials: true }
Body: { email: trimmedEmail, password: plainPassword }
```

**Location**: `src/features/Login/index.jsx` (lines 43-47)

**Security**: 
- Credentials sent over HTTPS in production
- Cookies automatically included via `withCredentials: true`
- No sensitive data logged or exposed

---

### Backend Flow (Server Processing)

#### Step 3: Device Fingerprinting
```javascript
Backend receives request
↓
Extracts device information:
  - IP Address (from x-forwarded-for header or socket)
  - User Agent
  - Device ID (from x-device-id header, if provided)
↓
Creates SHA-256 hash fingerprint: 
  fingerprint = SHA256(clientDeviceId || userAgent||ip)
```

**Location**: `src/features/Login/server.js` (lines 74-84)

**Purpose**: 
- Tracks login attempts per unique device
- Prevents distributed brute force attacks
- Enables device-specific rate limiting

---

#### Step 4: Rate Limiting Check
```javascript
Backend checks recent login attempts:
  - Query: Count failed attempts for (email + deviceFingerprint)
  - Time window: Last 2 minutes
  - Maximum allowed: 3 attempts
↓
If attempts >= 3:
  → Return 429 (Too Many Requests)
  → Include remainingSeconds in response
```

**Location**: `src/features/Login/server.js` (lines 158-172, 182-186)

**Configuration**:
- `MAX_LOGIN_ATTEMPTS = 3`
- `LOCKOUT_DURATION = 2 minutes`

**Security Benefit**: 
- Prevents brute force attacks
- Limits credential stuffing attempts
- Provides user feedback with countdown timer

---

#### Step 5: User Lookup
```javascript
Database query: SELECT * FROM users WHERE email = ?
↓
Uses parameterized query (prevents SQL injection)
↓
If user not found:
  → Track failed attempt
  → Return 401: "Incorrect email or password"
```

**Location**: `src/features/Login/server.js` (lines 188-192)

**Security**: 
- ✅ Parameterized queries prevent SQL injection
- ✅ Generic error message doesn't reveal if email exists
- ✅ Failed attempt logged for rate limiting

---

#### Step 6: Password Verification
```javascript
Retrieved user from database
↓
Compare plain password with stored hash:
  bcrypt.compare(password, user.password)
↓
If password doesn't match:
  → Track failed attempt
  → Return 401: "Incorrect email or password"
```

**Location**: `src/features/Login/server.js` (lines 195-199)

**Security**: 
- ✅ Passwords never stored in plain text
- ✅ bcrypt provides constant-time comparison (prevents timing attacks)
- ✅ Uses secure hashing algorithm (bcrypt)
- ✅ Generic error message prevents user enumeration

---

#### Step 7: Token Generation
```javascript
Password verified successfully
↓
Generate Access Token (JWT):
  - Payload: { id: user.id, email: user.email }
  - Secret: ACCESS_TOKEN_SECRET (from environment)
  - Expiration: 15 minutes
↓
Generate Refresh Token (JWT):
  - Payload: { id: user.id }
  - Secret: REFRESH_TOKEN_SECRET (from environment)
  - Expiration: 60 days
```

**Location**: `src/features/Login/server.js` (lines 53-69, 201-202)

**Token Lifetimes**:
- **Access Token**: 15 minutes (short-lived for security)
- **Refresh Token**: 60 days (longer-lived for convenience)

**Security**: 
- ✅ Separate secrets for access and refresh tokens
- ✅ Tokens signed with HMAC (cannot be forged)
- ✅ Short access token lifetime limits exposure window

---

#### Step 8: Session Storage
```javascript
Save session to database:
  - user_id
  - refresh_token
  - device_info (JSON: IP, User Agent, Device ID)
  - device_fingerprint
  - expires_at (60 days from now)
↓
If session exists for (user_id + device_fingerprint):
  → Update existing session
Else:
  → Create new session
```

**Location**: `src/features/Login/server.js` (lines 89-131, 204)

**Security Benefits**:
- ✅ Sessions can be revoked server-side
- ✅ Device fingerprint validation on token refresh
- ✅ Session expiry enforced in database
- ✅ One session per device per user

---

#### Step 9: Cookie Setting
```javascript
Set HttpOnly Cookies:
  - accessToken: 
      * HttpOnly: true (not accessible via JavaScript)
      * Secure: true (HTTPS only in production)
      * SameSite: Strict (CSRF protection)
      * maxAge: 15 minutes
  
  - refreshToken:
      * HttpOnly: true
      * Secure: true
      * SameSite: Strict
      * maxAge: 60 days
  
  - userId:
      * HttpOnly: false (needed for client-side)
      * Secure: true
      * SameSite: Strict
      * maxAge: 60 days
```

**Location**: `src/features/Login/server.js` (lines 206-225)

**Cookie Security Flags Explained**:
- **HttpOnly**: Prevents XSS attacks (JavaScript cannot access token)
- **Secure**: Only sent over HTTPS in production
- **SameSite: Strict**: Prevents CSRF attacks (cookies not sent on cross-site requests)
- **maxAge**: Automatic expiration

---

#### Step 10: Success Response
```javascript
Return 200 OK:
  {
    message: "Login successful",
    user: { id: user.id, email: user.email }
  }
```

**Location**: `src/features/Login/server.js` (lines 227-230)

**Frontend Response Handling**:
```javascript
On success:
  → setIsLoggedIn(true)
  → Navigate to home page (/)
```

**Location**: `src/features/Login/index.jsx` (lines 48-49)

---

### Post-Login: Token Refresh Flow

#### Automatic Token Refresh
```javascript
User makes API request
↓
Request fails with 401 (token expired)
↓
Axios interceptor catches 401
↓
Calls /refresh endpoint automatically
↓
Backend validates refresh token:
  - Check token signature
  - Verify session exists in database
  - Validate device fingerprint matches
  - Check session hasn't expired
↓
If valid:
  → Generate new access token
  → Generate new refresh token (rotation)
  → Update session in database
  → Set new cookies
↓
Retry original request with new token
```

**Location**: 
- Frontend: `src/api/requestAccessToken.js` (lines 17-40)
- Backend: `src/features/Login/server.js` (lines 239-305)

**Security Features**:
- ✅ **Token Rotation**: New refresh token issued on each refresh
- ✅ **Device Validation**: Refresh token only works from same device
- ✅ **Session Validation**: Database check ensures session is active
- ✅ **Seamless UX**: User never sees login screen during active session

---

## Security Features Breakdown

### 1. Password Security

**Hashing Algorithm**: bcrypt  
**Implementation**: Passwords hashed before database storage  
**Comparison**: Constant-time comparison prevents timing attacks  

**Location**: `src/features/Login/server.js` (line 195)

---

### 2. Token-Based Authentication

**Access Token**:
- Type: JWT (JSON Web Token)
- Lifetime: 15 minutes
- Purpose: Authenticate API requests
- Storage: HttpOnly cookie

**Refresh Token**:
- Type: JWT
- Lifetime: 60 days
- Purpose: Obtain new access tokens
- Storage: HttpOnly cookie

**Why Separate Tokens?**
- Short-lived access tokens limit exposure if compromised
- Refresh tokens can be revoked server-side
- Automatic rotation on each refresh

---

### 3. Rate Limiting & Brute Force Protection

**Mechanism**: Per-device, per-email attempt tracking

**Limits**:
- Maximum attempts: 3
- Time window: 2 minutes
- Lockout duration: 2 minutes
- Tracking: By device fingerprint + email

**How It Works**:
1. Each failed login attempt is logged to `users_login_attempts` table
2. Before processing login, system counts attempts in last 2 minutes
3. If >= 3 attempts, login is blocked with 429 status
4. Countdown timer displayed to user

**Security Benefits**:
- Prevents brute force attacks
- Device-specific prevents distributed attacks
- Automatic reset after lockout period

**Location**: `src/features/Login/server.js` (lines 149-172, 183-186)

---

### 4. Device Fingerprinting

**Components Used**:
- IP Address (from headers or socket)
- User Agent string
- Client Device ID (optional, from header)

**Fingerprint Generation**:
```javascript
const fingerprintSource = clientDeviceId 
  ? `client:${clientDeviceId}` 
  : `${userAgent}||${ip}`;
const fingerprint = SHA256(fingerprintSource);
```

**Purpose**:
- Rate limiting per device
- Session validation on token refresh
- Security monitoring (detect suspicious logins)

**Privacy**: SHA-256 hash ensures IP/user agent not stored in readable form

**Location**: `src/features/Login/server.js` (lines 74-84)

---

### 5. Session Management

**Storage**: MySQL database (`users_sessions` table)

**Session Data Stored**:
- User ID
- Refresh token
- Device information (JSON)
- Device fingerprint
- Expiration timestamp
- Created/updated timestamps

**Session Lifecycle**:
1. Created on successful login
2. Updated on token refresh (token rotation)
3. Expired on logout or manual expiration
4. Validated on every token refresh

**Security Features**:
- One session per device per user
- Server-side revocation capability
- Device fingerprint validation
- Automatic expiration enforcement

**Location**: `src/features/Login/server.js` (lines 89-144)

---

### 6. Cookie Security

**Cookie Attributes**:

| Cookie | HttpOnly | Secure | SameSite | Purpose |
|--------|----------|--------|----------|---------|
| accessToken | ✅ | ✅ (prod) | Strict | API authentication |
| refreshToken | ✅ | ✅ (prod) | Strict | Token refresh |
| userId | ❌ | ✅ (prod) | Strict | Client-side user ID |

**HttpOnly Flag**:
- Prevents JavaScript access (XSS protection)
- Tokens cannot be stolen via client-side scripts

**Secure Flag**:
- Only sent over HTTPS in production
- Prevents man-in-the-middle attacks

**SameSite: Strict**:
- Cookies only sent on same-site requests
- Prevents CSRF (Cross-Site Request Forgery) attacks

**Location**: `src/features/Login/server.js` (lines 206-225)

---

### 7. SQL Injection Protection

**Method**: Parameterized Queries

**Implementation**:
```javascript
const [rows] = await connection.execute(
  "SELECT * FROM users WHERE email = ?", 
  [email]
);
```

**Why It's Secure**:
- Database driver escapes parameters automatically
- Special characters cannot break SQL syntax
- User input never concatenated into queries

**Location**: Throughout `src/features/Login/server.js`

---

### 8. Error Message Security

**Strategy**: Generic Error Messages

**Implementation**:
- All authentication failures return: "Incorrect email or password"
- Doesn't reveal if email exists in system
- Prevents user enumeration attacks

**Trade-off**: 
- ✅ Better security (prevents information disclosure)
- ❌ Slightly worse UX (can't tell user to check email)

**Location**: `src/features/Login/server.js` (lines 191, 198)

---

## Token Management

### Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Session Lifecycle                                     │
└─────────────────────────────────────────────────────────────┘

Login (Day 0)
  ├─ Access Token: 15 minutes
  └─ Refresh Token: 60 days

Day 0-60: Automatic Refresh
  ├─ Access Token expires → Auto-refresh via interceptor
  ├─ New Access Token: +15 minutes
  └─ New Refresh Token: +60 days (rotation)

Day 60: Refresh Token Expires
  ├─ Session expired
  └─ User must log in again
```

### Token Refresh Endpoint

**Endpoint**: `POST /refresh`

**Security Checks**:
1. Refresh token exists in cookies
2. Token signature valid (JWT verification)
3. Session exists in database
4. Session not expired
5. Device fingerprint matches stored fingerprint
6. User ID in token matches session user ID

**On Success**:
- New access token (15 min)
- New refresh token (60 days, rotated)
- Session updated in database
- New cookies set

**On Failure**:
- 401: No refresh token
- 403: Invalid/expired token or device mismatch

**Location**: `src/features/Login/server.js` (lines 239-305)

---

## Rate Limiting & Brute Force Protection

### Attempt Tracking

**Database Table**: `users_login_attempts`

**Stored Data**:
- `user_id` (null if email not found)
- `email` (attempted email)
- `attempt_time` (timestamp)
- `ip` (IP address)
- `device_fingerprint` (SHA-256 hash)

**Tracking Logic**:
```javascript
Before login attempt:
  1. Count attempts where:
     - email = attempted_email
     - device_fingerprint = current_device
     - attempt_time > (now - 2 minutes)
  
  2. If count >= 3:
     → Block login (429 status)
  
  3. If login fails:
     → Log attempt to database
```

**Lockout Behavior**:
- Blocks login attempts from same device/email combination
- Different devices can still attempt (device-specific)
- Automatic unlock after 2 minutes
- Frontend shows countdown timer

**Location**: `src/features/Login/server.js` (lines 149-172)

---

## Device Fingerprinting

### How Device Fingerprinting Works

**Step 1: Information Collection**
```javascript
const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
const userAgent = req.headers["user-agent"];
const clientDeviceId = req.headers["x-device-id"]; // Optional
```

**Step 2: Fingerprint Generation**
```javascript
const fingerprintSource = clientDeviceId 
  ? `client:${clientDeviceId}` 
  : `${userAgent}||${ip}`;

const fingerprint = crypto
  .createHash("sha256")
  .update(fingerprintSource)
  .digest("hex");
```

**Step 3: Usage**
- Track login attempts per device
- Validate token refresh from same device
- Detect suspicious login patterns

**Privacy Considerations**:
- IP address hashed (not stored in readable form)
- Fingerprint is one-way hash (cannot reverse)
- Device ID optional (can use client-generated UUID)

**Location**: `src/features/Login/server.js` (lines 74-84)

---

## Session Management

### Session Storage

**Database Table**: `users_sessions`

**Schema** (conceptual):
```sql
users_sessions:
  - id: Primary key
  - user_id: Foreign key to users
  - refresh_token: JWT refresh token
  - expires_at: Timestamp
  - device_info: JSON (IP, user agent, device ID)
  - device_fingerprint: SHA-256 hash
  - created_at: Timestamp
  - last_updated: Timestamp
```

### Session Lifecycle

**1. Session Creation** (On Login):
- New session created or existing updated
- Based on `user_id + device_fingerprint`
- Expiration set to 60 days

**2. Session Update** (On Token Refresh):
- Refresh token rotated (old token replaced)
- `last_updated` timestamp refreshed
- Expiration extended

**3. Session Expiration** (On Logout):
- `expires_at` set to current time
- Session invalidated immediately

**4. Session Validation** (On Token Refresh):
- Session must exist
- Must not be expired
- Device fingerprint must match

**Location**: `src/features/Login/server.js` (lines 89-144, 310-320)

---

## Cookie Security

### Cookie Configuration

**Access Token Cookie**:
```javascript
{
  name: 'accessToken',
  httpOnly: true,        // ✅ Not accessible via JavaScript
  secure: true,          // ✅ HTTPS only (production)
  sameSite: 'Strict',    // ✅ CSRF protection
  maxAge: 900000         // 15 minutes (in milliseconds)
}
```

**Refresh Token Cookie**:
```javascript
{
  name: 'refreshToken',
  httpOnly: true,        // ✅ Not accessible via JavaScript
  secure: true,          // ✅ HTTPS only (production)
  sameSite: 'Strict',    // ✅ CSRF protection
  maxAge: 5184000000     // 60 days (in milliseconds)
}
```

**userId Cookie**:
```javascript
{
  name: 'userId',
  httpOnly: false,       // ⚠️ Needed for client-side access
  secure: true,          // ✅ HTTPS only (production)
  sameSite: 'Strict',    // ✅ CSRF protection
  maxAge: 5184000000     // 60 days
}
```

### Security Implications

**HttpOnly: true**
- ✅ Prevents XSS attacks (JavaScript cannot read token)
- ✅ Tokens cannot be stolen by malicious scripts
- ⚠️ Cannot access tokens in client-side code (intended)

**Secure: true** (Production)
- ✅ Cookies only sent over HTTPS
- ✅ Prevents man-in-the-middle attacks
- ✅ Prevents token interception on unencrypted connections

**SameSite: Strict**
- ✅ Cookies only sent on same-site requests
- ✅ Prevents CSRF attacks
- ⚠️ Cookies not sent on cross-site redirects (intended)

**Location**: `src/features/Login/server.js` (lines 206-225)

---

## Password Security

### Password Hashing

**Algorithm**: bcrypt

**Process**:
1. User submits plain password during login
2. System retrieves hashed password from database
3. `bcrypt.compare(plainPassword, hashedPassword)` compares
4. Returns true if match, false otherwise

**Security Properties**:
- ✅ One-way hash (cannot reverse)
- ✅ Constant-time comparison (prevents timing attacks)
- ✅ Salted by default (each hash unique)
- ✅ Computationally expensive (slows brute force)

**Storage**: Passwords never stored in plain text

**Location**: `src/features/Login/server.js` (line 195)

---

## API Endpoints

### POST `/login`

**Purpose**: Authenticate user and create session

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "plaintext_password"
}
```

**Success Response** (200):
```json
{
  "message": "Login successful",
  "user": {
    "id": 123,
    "email": "user@example.com"
  }
}
```

**Error Responses**:
- `401`: Invalid credentials
- `429`: Too many login attempts (rate limited)
- `500`: Internal server error

**Sets Cookies**:
- `accessToken` (HttpOnly, 15 min)
- `refreshToken` (HttpOnly, 60 days)
- `userId` (Not HttpOnly, 60 days)

---

### POST `/refresh`

**Purpose**: Refresh access token using refresh token

**Request**: No body required (uses cookies)

**Success Response** (200):
```json
{
  "message": "Access token refreshed"
}
```

**Error Responses**:
- `401`: No refresh token
- `403`: Invalid/expired token or device mismatch

**Sets Cookies**: Same as `/login`

---

### POST `/logout`

**Purpose**: Invalidate session and clear cookies

**Request**: No body required (uses cookies)

**Success Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

**Actions**:
- Expires session in database
- Clears all authentication cookies

---

## Security Best Practices Implemented

✅ **Defense in Depth**: Multiple layers of security  
✅ **Least Privilege**: Tokens have minimal required scope  
✅ **Fail Secure**: Authentication errors don't leak information  
✅ **Token Rotation**: Refresh tokens rotated on each use  
✅ **Session Management**: Server-side session tracking  
✅ **Rate Limiting**: Brute force protection  
✅ **Secure Transport**: HTTPS enforced in production  
✅ **Input Validation**: SQL injection prevention  
✅ **Cookie Security**: HttpOnly, Secure, SameSite flags  
✅ **Error Handling**: Generic error messages  

---

## Frontend Security Considerations

### Automatic Token Refresh

**Implementation**: Axios response interceptor

**Flow**:
1. API request fails with 401 (token expired)
2. Interceptor catches error
3. Calls `/refresh` endpoint
4. Retries original request with new token
5. If refresh fails, redirects to login

**Location**: `src/api/requestAccessToken.js`

**Security**: Prevents token expiration from disrupting user experience while maintaining security.

---

## Database Schema (Conceptual)

### Tables Used

**`users`**:
- `id`: Primary key
- `email`: Unique email address
- `password`: bcrypt hash (not plain text)

**`users_sessions`**:
- `id`: Primary key
- `user_id`: Foreign key
- `refresh_token`: JWT refresh token
- `expires_at`: Expiration timestamp
- `device_info`: JSON device information
- `device_fingerprint`: SHA-256 hash
- `created_at`: Creation timestamp
- `last_updated`: Last update timestamp

**`users_login_attempts`**:
- `id`: Primary key
- `user_id`: Foreign key (nullable)
- `email`: Attempted email
- `attempt_time`: Timestamp
- `ip`: IP address
- `device_fingerprint`: SHA-256 hash

---

## Environment Variables Required

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gamers

# JWT Secrets (use strong, random strings)
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Environment
NODE_ENV=production|development

# API URL (Frontend)
VITE_API_URL=https://your-api-domain.com
```

**Security Note**: 
- Use strong, random secrets for JWT tokens
- Never commit secrets to version control
- Use environment variables or secret management system

---

## Security Audit Checklist

When reviewing or auditing this login system, verify:

- [ ] Passwords hashed with bcrypt (never plain text)
- [ ] Rate limiting active (3 attempts, 2-minute lockout)
- [ ] Device fingerprinting enabled
- [ ] HttpOnly cookies set for tokens
- [ ] Secure flag set in production
- [ ] SameSite: Strict configured
- [ ] Token expiration enforced (15 min access, 60 day refresh)
- [ ] SQL injection prevented (parameterized queries)
- [ ] Generic error messages (no user enumeration)
- [ ] Session management in database
- [ ] Token rotation on refresh
- [ ] Device validation on token refresh
- [ ] HTTPS enforced in production
- [ ] JWT secrets are strong and random
- [ ] Environment variables not committed

---

## Troubleshooting

### Common Issues

**Issue**: Token expires too quickly  
**Solution**: Access token lifetime is intentionally short (15 min). Use automatic refresh flow.

**Issue**: Rate limited after 3 attempts  
**Solution**: Wait 2 minutes or use different device/network.

**Issue**: Refresh token invalid  
**Solution**: Device fingerprint changed (different browser/device). User must log in again.

**Issue**: Cookies not set  
**Solution**: Check CORS configuration, ensure `withCredentials: true` in requests.

---

## Conclusion

This login system implements with:

- ✅ Multi-layer authentication (password + tokens)
- ✅ Brute force protection (rate limiting)
- ✅ Device tracking (fingerprinting)
- ✅ Secure token storage (HttpOnly cookies)
- ✅ Session management (database-backed)
- ✅ Automatic token refresh (seamless UX)
- ✅ CSRF protection (SameSite cookies)
- ✅ XSS protection (HttpOnly cookies)

The system balances **security** and **user experience**, providing robust protection against common attack vectors while maintaining a smooth authentication flow.

---

**Last Updated**: 2024  
**Version**: 1.0  
**Author**: Dating App Development Team

