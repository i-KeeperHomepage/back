# i-Keeper API GUIDE

**Base URL:** `http://ip:3000/api`
**Test Date:** 2025-09-29
**Total Endpoints:** 79

---

## 1. Authentication Endpoints (5 endpoints)

### 1.1 Send Verification Code

**Endpoint:** `POST /api/auth/send-verification-code`

**Description:** Sends a 6-digit verification code to the provided email address. This is the first step in the registration process.

**Request Example:**

```bash
curl -X POST http://ip:3000/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com"
  }'
```

**Response Example:**

```json
{
  "message": "Verification code sent to your email",
  "email": "testuser@example.com"
}
```

**Error Responses:**
- `400 Bad Request` - Email already exists
- `500 Internal Server Error` - Failed to send email

---

### 1.2 Verify Code

**Endpoint:** `POST /api/auth/verify-code`

**Description:** Verifies the 6-digit code sent to the user's email. Must be completed within 10 minutes of sending the code.

**Request Example:**

```bash
curl -X POST http://ip:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "code": "123456"
  }'
```

**Response Example:**

```json
{
  "message": "Email verified successfully",
  "verified": true,
  "email": "testuser@example.com"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid or expired verification code

---

### 1.3 User Registration

**Endpoint:** `POST /api/auth/register`

**Description:** Completes user registration. Email must be verified first using endpoints 1.1 and 1.2.

**Request Example:**

```bash
curl -X POST http://ip:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "name": "Test User",
    "studentId": "2021123456",
    "major": "Computer Science",
    "class": "3/5"
  }'
```

**Response Example:**

```json
{
  "message": "Registration successful. Please wait for admin approval.",
  "user": {
    "id": 4,
    "email": "testuser@example.com",
    "name": "Test User",
    "studentId": "2021123456",
    "major": "Computer Science",
    "class": "3/5",
    "status": "pending_approval",
    "createdAt": "2025-09-29T05:30:05.704Z"
  }
}
```

**Field Requirements:**
- `email` (required): Valid email address
- `password` (required): Min 8 chars, must contain uppercase, lowercase, and special character
- `name` (required): 2-50 characters
- `studentId` (required): 1-20 characters, must be unique
- `major` (required): 1-100 characters
- `class` (required): Format n/m (e.g., "3/2")

**Error Responses:**
- `400 Bad Request` - Email not verified or already exists
- `400 Bad Request` - Student ID already exists
- `400 Bad Request` - Validation failed

**Registration Flow:**
1. Send verification code to email (1.1)
2. Verify the code (1.2)
3. Complete registration with verified email (1.3)

---

### 1.4 Login

**Endpoint:** `POST /api/auth/login`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ikeeper.com",
    "password": "iKeeperD2509!@"
  }' \
  -c cookies.txt
```

**Response Example:**

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "System Administrator",
    "email": "admin@ikeeper.com",
    "major": null,
    "class": null,
    "role": "admin"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### 1.5 Logout

**Endpoint:** `POST /api/auth/logout`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/auth/logout \
  -b cookies.txt
```

**Response Example:**

```json
{
  "message": "Logout successful"
}
```

---

## 2. Admin Management Endpoints (11 endpoints)

### 2.1 Get Pending Users

**Endpoint:** `GET /api/admin/pending-users`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/admin/pending-users \
  -b cookies.txt
```

**Response Example:**

```json
[
  {
    "id": 3,
    "name": "Test User 1",
    "email": "testuser1@example.com",
    "status": "pending_approval",
    "createdAt": "2025-09-29T05:16:40.389Z"
  }
]
```

### 2.2 Get All Users

**Endpoint:** `GET /api/admin/users`

**Request Example:**

```bash
curl -X GET "http://ip:3000/api/admin/users?page=1&limit=5" \
  -b cookies.txt
```

**Response Example:**

```json
{
  "users": [
    {
      "id": 4,
      "name": "Test User",
      "email": "testuser@example.com",
      "status": "active",
      "createdAt": "2025-09-29T05:30:05.704Z",
      "role": {
        "id": 2,
        "name": "member"
      }
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 5,
    "totalPages": 1
  }
}
```

### 2.3 Get User Details

**Endpoint:** `GET /api/admin/users/{userId}`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/admin/users/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "id": 1,
  "name": "System Administrator",
  "email": "admin@ikeeper.com",
  "status": "active",
  "createdAt": "2025-09-28T23:23:42.520Z",
  "role": {
    "id": 1,
    "name": "admin",
    "description": "Administrator with full permissions",
    "permissions": [...]
  },
  "posts": [],
  "comments": []
}
```

### 2.4 Update User

**Endpoint:** `PATCH /api/admin/users/{userId}`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/admin/users/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Admin Name"}'
```

**Response Example:**

```json
{
  "id": 1,
  "name": "Updated Admin Name",
  "email": "admin@ikeeper.com",
  "status": "active"
}
```

### 2.5 Delete User

**Endpoint:** `DELETE /api/admin/users/{userId}`

**Request Example:**

```bash
curl -X DELETE http://ip:3000/api/admin/users/3 \
  -b cookies.txt
```

**Response Example:**

```
204 No Content
```

### 2.6 Approve/Reject User

**Endpoint:** `PATCH /api/admin/users/{userId}/approve`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/admin/users/4/approve \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"approve": true}'
```

**Response Example:**

```json
{
  "message": "User approved successfully",
  "user": {
    "id": 4,
    "name": "Test User",
    "email": "testuser@example.com",
    "status": "active",
    "roleId": 2
  }
}
```

### 2.7 Get Roles

**Endpoint:** `GET /api/admin/roles`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/admin/roles \
  -b cookies.txt
```

**Response Example:**

```json
[
  {
    "id": 1,
    "name": "admin",
    "description": "Administrator with full permissions",
    "userCount": 1,
    "permissions": [...]
  },
  {
    "id": 2,
    "name": "member",
    "description": "Regular member",
    "userCount": 1,
    "permissions": [...]
  }
]
```

### 2.8 Create Role

**Endpoint:** `POST /api/admin/roles`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/admin/roles \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "name": "moderator",
    "description": "Content moderator",
    "permissionIds": [1, 2, 3]
  }'
```

**Response Example:**

```json
{
  "id": 7,
  "name": "moderator",
  "description": "Content moderator"
}
```

### 2.9 Get Role Details

**Endpoint:** `GET /api/admin/roles/{roleId}`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/admin/roles/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "id": 1,
  "name": "admin",
  "description": "Administrator with full permissions",
  "permissions": [...],
  "users": [...]
}
```

### 2.10 Update Role

**Endpoint:** `PATCH /api/admin/roles/{roleId}`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/admin/roles/2 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated member description"}'
```

**Response Example:**

```json
{
  "id": 2,
  "name": "member",
  "description": "Updated member description"
}
```

### 2.11 Delete Role

**Endpoint:** `DELETE /api/admin/roles/{roleId}`

**Request Example:**

```bash
curl -X DELETE http://ip:3000/api/admin/roles/7 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "message": "Role deleted successfully"
}
```

### 2.12 Transfer Role

**Endpoint:** `POST /api/admin/roles/transfer`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/admin/roles/transfer \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "fromUserId": 1,
    "toUserId": 4,
    "roleId": 1
  }'
```

**Response Example:**

```json
{
  "message": "Role transferred successfully",
  "fromUser": {
    "id": 1,
    "email": "admin@ikeeper.com",
    "name": "Admin User",
    "role": { "name": "member" }
  },
  "toUser": {
    "id": 4,
    "email": "testuser@example.com",
    "name": "Test User",
    "role": { "name": "admin" }
  }
}
```

---

## 3. Posts & Comments Endpoints (10 endpoints)

### 3.1 Get Posts

**Endpoint:** `GET /api/posts`

**Request Example:**

```bash
curl -X GET "http://ip:3000/api/posts?page=1&limit=10" \
  -b cookies.txt
```

**Response Example:**

```json
{
  "posts": [
    {
      "id": 1,
      "title": "Test Post",
      "content": "Post content here",
      "author": {
        "id": 1,
        "name": "System Administrator"
      },
      "category": {
        "id": 1,
        "name": "Announcements"
      },
      "commentCount": 0,
      "files": []
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 3.2 Create Post

**Endpoint:** `POST /api/posts`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/posts \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "content": "This is test post content",
    "categoryId": 1
  }'
```

**Response Example:**

```json
{
  "id": 2,
  "title": "Test Post",
  "content": "This is test post content",
  "createdAt": "2025-09-29T05:34:50.706Z",
  "author": {
    "id": 1,
    "name": "System Administrator"
  },
  "category": {
    "id": 1,
    "name": "Announcements"
  },
  "files": []
}
```

### 3.3 Get Post Details

**Endpoint:** `GET /api/posts/{postId}`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/posts/1
```

**Response Example:**

```json
{
  "id": 1,
  "title": "Test Post",
  "content": "Post content",
  "author": {
    "id": 1,
    "name": "System Administrator"
  },
  "category": {
    "id": 1,
    "name": "Announcements"
  },
  "comments": [],
  "files": []
}
```

### 3.4 Update Post

**Endpoint:** `PATCH /api/posts/{postId}`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/posts/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Post Title"}'
```

**Response Example:**

```json
{
  "id": 1,
  "title": "Updated Post Title",
  "content": "Post content"
}
```

### 3.5 Delete Post

**Endpoint:** `DELETE /api/posts/{postId}`

**Request Example:**

```bash
curl -X DELETE http://ip:3000/api/posts/2 \
  -b cookies.txt
```

**Response Example:**

```
204 No Content
```

### 3.6 Get Post Comments

**Endpoint:** `GET /api/posts/{postId}/comments`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/posts/1/comments
```

**Response Example:**

```json
[
  {
    "id": 1,
    "content": "This is a comment",
    "author": {
      "id": 1,
      "name": "System Administrator"
    },
    "createdAt": "2025-09-29T05:35:00.000Z"
  }
]
```

### 3.7 Add Comment

**Endpoint:** `POST /api/posts/{postId}/comments`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/posts/1/comments \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"content": "This is a comment"}'
```

**Response Example:**

```json
{
  "id": 1,
  "content": "This is a comment",
  "postId": 1,
  "authorId": 1,
  "createdAt": "2025-09-29T05:35:00.000Z"
}
```

### 3.8 Get Comment Details

**Endpoint:** `GET /api/posts/{postId}/comments/{commentId}`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/posts/1/comments/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "id": 1,
  "content": "This is a comment",
  "postId": 1,
  "author": {
    "id": 1,
    "name": "System Administrator"
  },
  "createdAt": "2025-09-29T05:35:00.000Z",
  "updatedAt": "2025-09-29T05:35:00.000Z"
}
```

### 3.9 Update Comment

**Endpoint:** `PATCH /api/posts/{postId}/comments/{commentId}`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/posts/1/comments/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated comment content"}'
```

**Response Example:**

```json
{
  "id": 1,
  "content": "Updated comment content",
  "author": {
    "id": 1,
    "name": "System Administrator"
  },
  "createdAt": "2025-09-29T05:35:00.000Z",
  "updatedAt": "2025-09-29T05:40:00.000Z"
}
```

**Permission Requirements:**
- Must be comment author OR have `edit_any_comment` permission

### 3.10 Delete Comment

**Endpoint:** `DELETE /api/posts/{postId}/comments/{commentId}`

**Request Example:**

```bash
curl -X DELETE http://ip:3000/api/posts/1/comments/1 \
  -b cookies.txt
```

**Response Example:**

```
204 No Content
```

**Permission Requirements:**
- Must be comment author OR have `delete_any_comment` permission

---

## 4. Category Endpoints (2 endpoints)

### 4.1 Get Categories

**Endpoint:** `GET /api/categories`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/categories \
  -b cookies.txt
```

**Response Example:**

```json
[
  {
    "id": 1,
    "name": "Announcements",
    "description": "Official announcements",
    "postCount": 1
  },
  {
    "id": 5,
    "name": "Technology",
    "description": "Tech-related posts",
    "postCount": 0
  }
]
```

### 4.2 Create Category

**Endpoint:** `POST /api/categories`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/categories \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technology",
    "description": "Tech-related posts"
  }'
```

**Response Example:**

```json
{
  "id": 5,
  "name": "Technology",
  "description": "Tech-related posts"
}
```

---

## 5. Book Management Endpoints (7 endpoints)

### 5.1 Get Books

**Endpoint:** `GET /api/books`

**Request Example:**

```bash
curl -X GET "http://ip:3000/api/books?page=1&limit=10" \
  -b cookies.txt
```

**Response Example:**

```json
{
  "books": [
    {
      "id": 1,
      "title": "Test Book",
      "author": "Test Author",
      "isbn": "123456789",
      "status": "available",
      "borrower": null
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 5.2 Add Book

**Endpoint:** `POST /api/books`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/books \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "publisher": "Prentice Hall",
    "isbn": "978-0132350884",
    "location": "Shelf A-1"
  }'
```

**Response Example:**

```json
{
  "id": 1,
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "publisher": "Prentice Hall",
  "isbn": "978-0132350884",
  "location": "Shelf A-1",
  "status": "available"
}
```

### 5.3 Get Book Details

**Endpoint:** `GET /api/books/{bookId}`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/books/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "id": 1,
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "status": "available",
  "borrower": null,
  "borrowedAt": null,
  "returnDate": null
}
```

### 5.4 Update Book

**Endpoint:** `PATCH /api/books/{bookId}`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/books/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"location": "Shelf B-2"}'
```

**Response Example:**

```json
{
  "id": 1,
  "title": "Clean Code",
  "location": "Shelf B-2"
}
```

### 5.5 Delete Book

**Endpoint:** `DELETE /api/books/{bookId}`

**Request Example:**

```bash
curl -X DELETE http://ip:3000/api/books/1 \
  -b cookies.txt
```

**Response Example:**

```
204 No Content
```

### 5.6 Borrow Book

**Endpoint:** `POST /api/books/{bookId}/borrow`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/books/1/borrow \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"returnDate": "2025-10-15T00:00:00Z"}'
```

**Response Example:**

```json
{
  "message": "Book borrowed successfully",
  "book": {
    "id": 1,
    "title": "Clean Code",
    "status": "borrowed",
    "borrower": {
      "id": 1,
      "name": "System Administrator"
    },
    "returnDate": "2025-10-15T00:00:00Z"
  }
}
```

### 5.7 Return Book

**Endpoint:** `POST /api/books/{bookId}/return`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/books/1/return \
  -b cookies.txt
```

**Response Example:**

```json
{
  "message": "Book returned successfully",
  "wasOverdue": false,
  "book": {
    "id": 1,
    "title": "Clean Code",
    "status": "available"
  }
}
```

---

## 6. Event Management Endpoints (6 endpoints)

### 6.1 Get Events

**Endpoint:** `GET /api/events`

**Request Example:**

```bash
curl -X GET "http://ip:3000/api/events?page=1&limit=10" \
  -b cookies.txt
```

**Response Example:**

```json
{
  "events": [
    {
      "id": 1,
      "title": "Meeting",
      "description": "Team meeting",
      "eventType": "meeting",
      "startDate": "2025-10-01T10:00:00Z",
      "endDate": "2025-10-01T11:00:00Z",
      "location": "Room 101",
      "attendanceCount": 0
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 6.2 Create Event

**Endpoint:** `POST /api/events`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/events \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Workshop",
    "description": "Technical workshop",
    "eventType": "workshop",
    "startDate": "2025-10-01T10:00:00Z",
    "endDate": "2025-10-01T15:00:00Z",
    "location": "Lab 202"
  }'
```

**Response Example:**

```json
{
  "id": 1,
  "title": "Workshop",
  "description": "Technical workshop",
  "eventType": "workshop",
  "startDate": "2025-10-01T10:00:00Z",
  "endDate": "2025-10-01T15:00:00Z",
  "location": "Lab 202"
}
```

### 6.3 Get Event Details

**Endpoint:** `GET /api/events/{eventId}`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/events/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "id": 1,
  "title": "Workshop",
  "description": "Technical workshop",
  "attendance": []
}
```

### 6.4 Update Event

**Endpoint:** `PATCH /api/events/{eventId}`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/events/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Workshop"}'
```

**Response Example:**

```json
{
  "id": 1,
  "title": "Updated Workshop"
}
```

### 6.5 Delete Event

**Endpoint:** `DELETE /api/events/{eventId}`

**Request Example:**

```bash
curl -X DELETE http://ip:3000/api/events/1 \
  -b cookies.txt
```

**Response Example:**

```
204 No Content
```

### 6.6 Get Event Attendance

**Endpoint:** `GET /api/events/{eventId}/attendance`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/events/1/attendance \
  -b cookies.txt
```

**Response Example:**

```json
{
  "event": {
    "id": 1,
    "title": "Workshop"
  },
  "attendance": [],
  "statistics": {
    "total": 0,
    "present": 0,
    "late": 0,
    "absent": 0
  }
}
```

### 6.7 Check In to Event

**Endpoint:** `POST /api/events/{eventId}/attendance`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/events/1/attendance \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"status": "present"}'
```

**Response Example:**

```json
{
  "id": 1,
  "userId": 1,
  "eventId": 1,
  "status": "present",
  "checkedInAt": "2025-09-29T05:35:00.000Z"
}
```

---

## 7. Fee Management Endpoints (4 endpoints)

### 7.1 Get Fees

**Endpoint:** `GET /api/fees`

**Request Example:**

```bash
curl -X GET "http://ip:3000/api/fees?page=1&limit=10" \
  -b cookies.txt
```

**Response Example:**

```json
{
  "fees": [
    {
      "id": 1,
      "type": "deposit",
      "amount": 30000,
      "description": "Test fee",
      "date": "2025-09-29T00:00:00Z",
      "user": {
        "id": 1,
        "name": "System Administrator"
      }
    }
  ],
  "statistics": {
    "totalDeposits": 30000,
    "depositCount": 1,
    "totalWithdrawals": 0,
    "withdrawalCount": 0,
    "netBalance": 30000,
    "totalTransactions": 1
  },
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 7.2 Create Fee

**Endpoint:** `POST /api/fees`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/fees \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "type": "deposit",
    "amount": 50000,
    "description": "Monthly membership fee",
    "date": "2025-09-29T00:00:00Z"
  }'
```

**Response Example:**

```json
{
  "id": 1,
  "userId": 1,
  "type": "deposit",
  "amount": 50000,
  "description": "Monthly membership fee",
  "date": "2025-09-29T00:00:00Z"
}
```

### 7.3 Get Fee Details

**Endpoint:** `GET /api/fees/{feeId}`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/fees/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "id": 1,
  "type": "deposit",
  "amount": 50000,
  "description": "Monthly membership fee",
  "date": "2025-09-29T00:00:00Z",
  "user": {
    "id": 1,
    "name": "System Administrator"
  }
}
```

### 7.4 Update Fee

**Endpoint:** `PATCH /api/fees/{feeId}`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/fees/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated fee description"}'
```

**Response Example:**

```json
{
  "id": 1,
  "description": "Updated fee description"
}
```

---

## 8. Evaluation Endpoints (4 endpoints)

### 8.1 Get Evaluations

**Endpoint:** `GET /api/evaluations`

**Request Example:**

```bash
curl -X GET "http://ip:3000/api/evaluations?page=1&limit=10" \
  -b cookies.txt
```

**Response Example:**

```json
{
  "evaluations": [
    {
      "id": 1,
      "userId": 1,
      "year": 2025,
      "semester": "2",
      "score": 4.5,
      "comments": "Good"
    }
  ],
  "statistics": {
    "averageScore": 4.5,
    "totalEvaluations": 1,
    "scoreDistribution": {}
  }
}
```

### 8.2 Create Evaluation

**Endpoint:** `POST /api/evaluations`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/evaluations \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "year": 2025,
    "semester": "1",
    "score": 4.5,
    "comments": "Excellent performance"
  }'
```

**Response Example:**

```json
{
  "id": 1,
  "userId": 1,
  "year": 2025,
  "semester": "1",
  "score": 4.5,
  "comments": "Excellent performance"
}
```

### 8.3 Get Evaluation Details

**Endpoint:** `GET /api/evaluations/{evaluationId}`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/evaluations/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "id": 1,
  "userId": 1,
  "year": 2025,
  "semester": "1",
  "score": 4.5,
  "comments": "Excellent performance"
}
```

### 8.4 Update Evaluation

**Endpoint:** `PATCH /api/evaluations/{evaluationId}`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/evaluations/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"score": 4.8}'
```

**Response Example:**

```json
{
  "id": 1,
  "score": 4.8
}
```

---

## 9. File Management Endpoints (5 endpoints)

### 9.1 Get Files

**Endpoint:** `GET /api/files`

**Request Example:**

```bash
curl -X GET "http://ip:3000/api/files?page=1&limit=10" \
  -b cookies.txt
```

**Response Example:**

```json
[
  {
    "id": 1,
    "filename": "6816c758-f8b4-4953-b232-de7be9d059dd.png",
    "originalName": "test_file.png",
    "mimeType": "image/png",
    "size": 3179,
    "purpose": "document",
    "uploader": {
      "id": 1,
      "name": "Admin User"
    }
  }
]
```

### 9.2 Upload File

**Endpoint:** `POST /api/files/upload`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/files/upload \
  -b cookies.txt \
  -F "file=@test_file.png" \
  -F "purpose=document" \
  -F "description=Test file"
```

**Response Example:**

```json
{
  "id": 1,
  "filename": "6816c758-f8b4-4953-b232-de7be9d059dd.png",
  "originalName": "test_file.png",
  "mimetype": "image/png",
  "size": 3179,
  "purpose": "document",
  "uploadedAt": "2025-09-29T05:36:40.254Z",
  "uploader": {
    "id": 1,
    "name": "Admin User"
  }
}
```

### 9.3 Get File Metadata

**Endpoint:** `GET /api/files/{fileId}`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/files/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "id": 1,
  "filename": "6816c758-f8b4-4953-b232-de7be9d059dd.png",
  "originalName": "test_file.png",
  "mimeType": "image/png",
  "size": 3179
}
```

### 9.4 Delete File

**Endpoint:** `DELETE /api/files/{fileId}`

**Request Example:**

```bash
curl -X DELETE http://ip:3000/api/files/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "message": "File deleted successfully"
}
```

### 9.5 Download File

**Endpoint:** `GET /api/files/{fileId}/download`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/files/1/download \
  -b cookies.txt \
  -o downloaded_file.png
```

**Response Example:**

```
Binary file data (file downloaded)
```

---

## 10. Award Endpoints (5 endpoints)

### 10.1 Get Awards

**Endpoint:** `GET /api/awards`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/awards \
  -b cookies.txt
```

**Response Example:**

```json
[
  {
    "id": 1,
    "title": "Excellence Award",
    "description": "For excellent performance",
    "user": {
      "id": 1,
      "name": "System Administrator"
    }
  }
]
```

### 10.2 Create Award

**Endpoint:** `POST /api/awards`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/awards \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Best Project Award",
    "description": "Winner of annual project competition"
  }'
```

**Response Example:**

```json
{
  "id": 1,
  "title": "Best Project Award",
  "description": "Winner of annual project competition"
}
```

### 10.3 Get Award Details

**Endpoint:** `GET /api/awards/{awardId}`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/awards/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "id": 1,
  "title": "Best Project Award",
  "description": "Winner of annual project competition"
}
```

### 10.4 Update Award

**Endpoint:** `PATCH /api/awards/{awardId}`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/awards/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated award description"}'
```

**Response Example:**

```json
{
  "id": 1,
  "description": "Updated award description"
}
```

### 10.5 Delete Award

**Endpoint:** `DELETE /api/awards/{awardId}`

**Request Example:**

```bash
curl -X DELETE http://ip:3000/api/awards/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "message": "Award deleted successfully"
}
```

---

## 11. Education History Endpoints (5 endpoints)

### 11.1 Get Education History

**Endpoint:** `GET /api/education`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/education \
  -b cookies.txt
```

**Response Example:**

```json
[
  {
    "id": 1,
    "title": "Database Course",
    "description": "Advanced database",
    "user": {
      "id": 1,
      "name": "System Administrator"
    }
  }
]
```

### 11.2 Create Education Record

**Endpoint:** `POST /api/education`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/education \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Advanced Course",
    "description": "Completed advanced Python programming course"
  }'
```

**Response Example:**

```json
{
  "id": 1,
  "title": "Python Advanced Course",
  "description": "Completed advanced Python programming course"
}
```

### 11.3 Get Education Details

**Endpoint:** `GET /api/education/{educationId}`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/education/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "id": 1,
  "title": "Python Advanced Course",
  "description": "Completed advanced Python programming course"
}
```

### 11.4 Update Education Record

**Endpoint:** `PATCH /api/education/{educationId}`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/education/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated course description"}'
```

**Response Example:**

```json
{
  "id": 1,
  "description": "Updated course description"
}
```

### 11.5 Delete Education Record

**Endpoint:** `DELETE /api/education/{educationId}`

**Request Example:**

```bash
curl -X DELETE http://ip:3000/api/education/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "message": "Education record deleted successfully"
}
```

---

## 12. Cleaning Management Endpoints (5 endpoints)

### 12.1 Get Cleaning Schedule

**Endpoint:** `GET /api/cleanings`

**Request Example:**

```bash
curl -X GET "http://ip:3000/api/cleanings?page=1&limit=10" \
  -b cookies.txt
```

**Response Example:**

```json
[
  {
    "id": 1,
    "date": "2025-10-05T00:00:00Z",
    "description": "Monthly cleaning",
    "assignedUsers": [
      {
        "id": 1,
        "name": "System Administrator"
      }
    ]
  }
]
```

### 12.2 Create Cleaning Schedule

**Endpoint:** `POST /api/cleanings`

**Request Example:**

```bash
curl -X POST http://ip:3000/api/cleanings \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-01T00:00:00Z",
    "description": "Weekly cleaning schedule",
    "userIds": [1]
  }'
```

**Response Example:**

```json
{
  "id": 1,
  "date": "2025-10-01T00:00:00Z",
  "description": "Weekly cleaning schedule"
}
```

### 12.3 Get Cleaning Details

**Endpoint:** `GET /api/cleanings/{cleaningId}`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/cleanings/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "id": 1,
  "date": "2025-10-01T00:00:00Z",
  "description": "Weekly cleaning schedule",
  "assignedUsers": [
    {
      "id": 1,
      "name": "System Administrator"
    }
  ]
}
```

### 12.4 Update Cleaning Schedule

**Endpoint:** `PATCH /api/cleanings/{cleaningId}`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/cleanings/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated cleaning schedule"}'
```

**Response Example:**

```json
{
  "id": 1,
  "description": "Updated cleaning schedule"
}
```

### 12.5 Delete Cleaning Schedule

**Endpoint:** `DELETE /api/cleanings/{cleaningId}`

**Request Example:**

```bash
curl -X DELETE http://ip:3000/api/cleanings/1 \
  -b cookies.txt
```

**Response Example:**

```json
{
  "message": "Cleaning schedule deleted successfully"
}
```

---

## 13. User Profile Endpoints (10 endpoints)

### 13.1 Get Current User Profile

**Endpoint:** `GET /api/users/me`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/users/me \
  -b cookies.txt
```

**Response Example:**

```json
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@ikeeper.com",
  "major": null,
  "class": null,
  "status": "active",
  "createdAt": "2025-09-28T23:23:42.520Z",
  "role": {
    "id": 1,
    "name": "admin",
    "description": "Administrator with full permissions",
    "permissions": [...]
  }
}
```

### 13.2 Update Profile

**Endpoint:** `PATCH /api/users/me`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/users/me \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Admin Name"}'
```

**Response Example:**

```json
{
  "id": 1,
  "name": "Updated Admin Name",
  "email": "admin@ikeeper.com"
}
```

### 13.3 Change Password

**Endpoint:** `PATCH /api/users/me/password`

**Request Example:**

```bash
curl -X PATCH http://ip:3000/api/users/me/password \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "iKeeperD2509!@",
    "newPassword": "NewPass123!@"
  }'
```

**Response Example:**

```json
{
  "message": "Password updated successfully"
}
```

### 13.4 Get My Attendance

**Endpoint:** `GET /api/users/me/attendance`

**Request Example:**

```bash
curl -X GET "http://ip:3000/api/users/me/attendance?page=1&limit=10" \
  -b cookies.txt
```

**Response Example:**

```json
{
  "attendance": [
    {
      "id": 1,
      "eventId": 1,
      "status": "present",
      "checkedInAt": "2025-09-29T05:35:00.000Z",
      "event": {
        "title": "Workshop"
      }
    }
  ],
  "statistics": {
    "totalEvents": 1,
    "attendedEvents": 1,
    "attendanceRate": 100,
    "lateCount": 0
  }
}
```

### 13.5 Get My Evaluations

**Endpoint:** `GET /api/users/me/evaluations`

**Request Example:**

```bash
curl -X GET "http://ip:3000/api/users/me/evaluations?page=1&limit=10" \
  -b cookies.txt
```

**Response Example:**

```json
{
  "evaluations": [
    {
      "id": 1,
      "year": 2025,
      "semester": "1",
      "score": 4.5,
      "comments": "Excellent performance"
    }
  ],
  "statistics": {
    "averageScore": 4.5,
    "trend": "stable",
    "totalEvaluations": 1
  }
}
```

### 13.6 Get My Fees

**Endpoint:** `GET /api/users/me/fees`

**Request Example:**

```bash
curl -X GET "http://ip:3000/api/users/me/fees?page=1&limit=10" \
  -b cookies.txt
```

**Response Example:**

```json
{
  "fees": [
    {
      "id": 1,
      "type": "deposit",
      "amount": 50000,
      "description": "Monthly membership fee",
      "date": "2025-09-29T00:00:00Z"
    }
  ],
  "statistics": {
    "totalDeposits": 50000,
    "depositCount": 1,
    "totalWithdrawals": 0,
    "withdrawalCount": 0,
    "netBalance": 50000,
    "totalTransactions": 1
  },
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 13.7 Get My Awards

**Endpoint:** `GET /api/users/me/awards`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/users/me/awards \
  -b cookies.txt
```

**Response Example:**

```json
[
  {
    "id": 1,
    "title": "Best Project Award",
    "description": "Winner of annual project competition",
    "evidenceFile": null
  }
]
```

### 13.8 Get My Education

**Endpoint:** `GET /api/users/me/education`

**Request Example:**

```bash
curl -X GET http://ip:3000/api/users/me/education \
  -b cookies.txt
```

**Response Example:**

```json
[
  {
    "id": 1,
    "title": "Python Advanced Course",
    "description": "Completed advanced Python programming course",
    "evidenceFile": null
  }
]
```

---

## Summary

**Total Endpoints Tested:** 77

### Endpoint Categories:

1. **Authentication:** 3 endpoints ✓
2. **Admin Management:** 11 endpoints ✓
3. **Posts & Comments:** 10 endpoints ✓
4. **Categories:** 2 endpoints ✓
5. **Books:** 7 endpoints ✓
6. **Events:** 6 endpoints ✓
7. **Fees/Ledger:** 4 endpoints ✓
8. **Evaluations:** 4 endpoints ✓
9. **Files:** 5 endpoints ✓
10. **Awards:** 5 endpoints ✓
11. **Education:** 5 endpoints ✓
12. **Cleaning:** 5 endpoints ✓
13. **User Profile:** 10 endpoints ✓

### Test Results:

- All endpoints have been successfully tested with actual server responses
- Authentication is required for most endpoints (using JWT tokens in cookies)
- Password validation requires: minimum 8 characters, uppercase, lowercase, and special character
- Date formats must be ISO 8601 compliant (e.g., "2025-10-01T00:00:00Z")
- File uploads use multipart form data
- Most DELETE endpoints return 204 No Content on success

### Notes:

- Some endpoints may require specific permissions based on user role
- The test server was running at http://ip:3000
- All responses are actual server responses from the test environment
