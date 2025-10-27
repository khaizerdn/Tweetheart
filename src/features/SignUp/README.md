# Create Account Feature

## Overview
The Create Account feature allows users to register for an account with email verification. This feature handles user registration, data validation, and integrates with the email verification system.

## Dependencies

### External Packages
- **express** - Web framework for handling HTTP requests
- **mysql** / **mysql2** - Database connection and queries
- **bcrypt** - Password hashing and verification code encryption
- **axios** - HTTP client for API requests (frontend)
- **react-router-dom** - Client-side routing
- **dotenv** - Environment variable management

### Internal Dependencies
- **EmailVerification** (`src/features/EmailVerification/`) - Handles email verification process
  - Verifies OTP codes sent to user email
  - Resends verification codes
  - Updates user verification status
- **InputFields Component** (`src/components/InputFields/`) - Reusable form inputs
  - Text input
  - Password input
  - Date input
  - Select input
  - **Textarea input** (for bio field)
- **Button Component** (`src/components/Buttons/Button.jsx`)
- **SnowflakeID Utility** (`src/utils/SnowflakeID.js`) - Unique ID generation
- **OTP API** (`src/api/requestOTP.js`) - Generates and sends verification emails

## Features

### User Registration
- First Name & Last Name
- Email (unique, validated)
- Password (with confirmation)
- Gender selection (Male, Female, Other)
- Birth Date
- Bio (optional, max 500 characters) - uses textarea input

### Validation
- Real-time field validation
- Email format verification
- Password strength requirements
- Password confirmation matching
- Age verification from birth date

### Security
- Password hashing with bcrypt (10 rounds)
- Verification code hashing
- SQL injection protection via parameterized queries
- CORS enabled with credentials

### Email Verification Flow
1. User submits registration form
2. Account created with `is_verified = 0`
3. Verification code generated and hashed
4. Email sent with 6-digit OTP code
5. Code expires after 2 minutes
6. User redirected to Email Verification page

## Database Schema

### Users Table
```sql
CREATE TABLE `users` (
  `id` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `birthdate` date NOT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `bio` varchar(500) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `verification_code` varchar(255) DEFAULT NULL,
  `expiration_time` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### Indexes
- Primary Key: `id`
- Unique Key: `email`
- Index: `idx_email`

## API Endpoints

### POST `/signup`
Creates a new user account or updates existing unverified account.

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "gender": "Male|Female|Other",
  "month": "string",
  "day": "string",
  "year": "string",
  "bio": "string (optional, max 500 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created. Verification email sent."
}
```

## Environment Variables

Required in `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gamers
VITE_API_URL=http://localhost:5000
```

## File Structure

```
SignUp/
├── index.jsx           # Main component with form and state management
├── server.js           # Backend API routes
├── styles.module.css   # Component-specific styles
└── README.md           # This file
```

## Usage Example

```jsx
import SignUp from './features/SignUp';

// In your router
<Route path="/signup" element={<SignUp />} />
```

## Related Features

- **Email Verification** - Confirms user email address
- **Login** - Authenticates registered users
- **Forgot Password** - Handles password reset flow

## Notes

- Users can re-submit registration with same email if not verified
- Existing unverified accounts get updated instead of creating duplicates
- Verification code expires after 2 minutes

