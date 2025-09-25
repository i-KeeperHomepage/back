# i-Keeper 동아리 관리 시스템 API 명세서

## 목차

1. [개요](#개요)
2. [인증 및 권한 부여](#인증-및-권한-부여)
3. [응답 형식](#응답-형식)
4. [오류 처리](#오류-처리)
5. [API 엔드포인트](#api-엔드포인트)
   - [인증](#1-인증-엔드포인트)
   - [관리자 관리](#2-관리자-관리-엔드포인트)
   - [게시글 및 댓글](#3-게시글-및-댓글-엔드포인트)
   - [카테고리](#4-카테고리-엔드포인트)
   - [도서 관리](#5-도서-관리-엔드포인트)
   - [이벤트 관리](#6-이벤트-관리-엔드포인트)
   - [회비 관리](#7-회비-관리-엔드포인트)
   - [평가](#8-평가-엔드포인트)
   - [파일 관리](#9-파일-관리-엔드포인트)
   - [수상](#10-수상-엔드포인트)
   - [교육 이력](#11-교육-이력-엔드포인트)
   - [청소 관리](#12-청소-관리-엔드포인트)
   - [사용자 프로필](#13-사용자-프로필-엔드포인트)

---

## 개요

i-Keeper 동아리 관리 시스템은 Next.js 15 App Router로 구축된 포괄적인 REST API입니다. 회원 관리, 이벤트 추적, 회비 수집, 자원 관리 등을 포함한 완전한 동아리 관리 기능을 제공합니다.

### 기본 URL
```
http://localhost:3000/api
```

### 기술 스택
- **프레임워크**: Next.js 15 with App Router
- **데이터베이스**: MySQL 8.0
- **ORM**: Prisma
- **인증**: JWT with HttpOnly cookies
- **유효성 검사**: Zod schemas
- **파일 저장소**: 데이터베이스 메타데이터를 사용한 로컬 파일시스템

---

## 인증 및 권한 부여

### 인증 방법
- **유형**: JWT (JSON Web Tokens)
- **저장소**: HttpOnly cookies
- **토큰 이름**: `accessToken`
- **만료**: `JWT_EXPIRES_IN` 환경 변수를 통해 설정 가능

### 권한 부여 방법
- **유형**: 역할 기반 접근 제어 (RBAC)
- **구현**: 세분화된 권한 시스템
- **컨텍스트 헤더**:
  - `x-user-id`: 현재 사용자 ID
  - `x-user-role`: 현재 사용자 역할 ID

### 사용자 생명주기 상태
1. `pending_approval` - 신규 등록, 관리자 승인 대기 중
2. `active` - 승인됨, 시스템 접근 가능
3. `inactive` - 일시적으로 비활성화
4. `withdrawn` - 영구적으로 조직을 떠남

### 기본 역할
1. **Admin** (roleId: 1) - 전체 시스템 접근
2. **Member** (roleId: 2) - 표준 회원 접근
3. **Non-Member** (roleId: 3) - 승인 대기 사용자

---

## 응답 형식

### 성공 응답
```json
{
  "data": {
    // Response data here
  }
}
```

### 페이지네이션이 포함된 성공 응답
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### 오류 응답
```json
{
  "error": "Error message",
  "details": {
    // Optional: Additional error details
  }
}
```

### HTTP 상태 코드
- `200` OK - 성공적인 GET, PATCH 요청
- `201` Created - 성공적인 POST 요청
- `204` No Content - 성공적인 DELETE 요청
- `400` Bad Request - 잘못된 입력
- `401` Unauthorized - 인증 필요
- `403` Forbidden - 권한 거부
- `404` Not Found - 리소스를 찾을 수 없음
- `500` Internal Server Error - 서버 오류

---

## 오류 처리

### 유효성 검사 오류
요청 유효성 검사가 실패하면 API는 필드별 오류와 함께 400 상태를 반환합니다:
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 6 characters"
  }
}
```

### 인증 오류
```json
{
  "error": "Authentication required"
}
```

### 권한 오류
```json
{
  "error": "Permission denied"
}
```

---

## API 엔드포인트

## 1. 인증 엔드포인트

### 사용자 등록
```http
POST /api/auth/register
```

"pending_approval" 상태로 새 사용자 계정을 생성합니다.

**요청 본문:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "major": "Computer Science",
  "class": "2024-1",
  "signatureImageId": 1  // Optional
}
```

**응답:** `201 Created`
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "status": "pending_approval",
    "roleId": 3,
    "message": "Registration successful. Please wait for admin approval."
  }
}
```

**참고:**
- 신규 사용자는 "non-member" 역할이 할당됨
- 로그인 전 관리자 승인 필요
- 이메일은 고유해야 함

---

### 로그인
```http
POST /api/auth/login
```

사용자를 인증하고 액세스 토큰을 반환합니다.

**요청 본문:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:** `200 OK`
```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "roleId": 2,
      "status": "active"
    },
    "accessToken": "jwt.token.here"
  }
}
```

**오류:**
- `401` - 잘못된 인증 정보
- `403` - 사용자 승인 대기 중 또는 비활성

**참고:**
- JWT 토큰과 함께 HttpOnly 쿠키 설정
- 활성 사용자만 로그인 가능

---

### 로그아웃
```http
POST /api/auth/logout
```

인증 쿠키를 삭제합니다.

**응답:** `200 OK`
```json
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## 2. 관리자 관리 엔드포인트

### 대기 중인 사용자 조회
```http
GET /api/admin/pending-users
```

**인증:** 필수
**권한:** `VIEW_PENDING_USERS`

**응답:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "major": "Computer Science",
      "class": "2024-1",
      "status": "pending_approval",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 모든 사용자 목록
```http
GET /api/admin/users
```

**인증:** 필수
**권한:** `VIEW_ALL_USERS`

**쿼리 파라미터:**
- `status` - 사용자 상태로 필터링
- `roleId` - 역할로 필터링
- `page` - 페이지 번호 (기본값: 1)
- `limit` - 페이지당 항목 수 (기본값: 10)

**응답:** `200 OK`
```json
{
  "data": [...],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

### 사용자 상세 정보
```http
GET /api/admin/users/{userId}
```

**인증:** 필수
**권한:** `VIEW_USER_DETAILS`

**응답:** `200 OK`
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": {
      "id": 2,
      "name": "member",
      "permissions": [...]
    },
    "recentPosts": [...],
    "recentComments": [...]
  }
}
```

---

### 사용자 정보 수정
```http
PATCH /api/admin/users/{userId}
```

**인증:** 필수
**권한:** `UPDATE_USER`

**요청 본문:**
```json
{
  "status": "active",
  "roleId": 2,
  "profileImageId": 1
}
```

**응답:** `200 OK`

---

### 사용자 삭제
```http
DELETE /api/admin/users/{userId}
```

**인증:** 필수
**권한:** `DELETE_USER`

**응답:** `204 No Content`

**참고:**
- 자신의 계정은 삭제할 수 없음
- 모든 관련 레코드도 삭제됨

---

### 사용자 승인/거부
```http
PATCH /api/admin/users/{userId}/approve
```

**인증:** 필수
**권한:** `APPROVE_USERS`

**요청 본문:**
```json
{
  "approve": true
}
```

**응답:** `200 OK`
```json
{
  "data": {
    "message": "User approved successfully",
    "user": {...}
  }
}
```

**참고:**
- 승인: 상태를 "active"로, 역할을 "member"로 설정
- 거부: 사용자 계정 삭제

---

### 역할 목록
```http
GET /api/admin/roles
```

**인증:** 필수
**권한:** `VIEW_ROLES`

**응답:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "name": "admin",
      "description": "System administrator",
      "permissions": [...],
      "_count": { "users": 2 }
    }
  ]
}
```

---

### 역할 생성
```http
POST /api/admin/roles
```

**인증:** 필수
**권한:** `CREATE_ROLE`

**요청 본문:**
```json
{
  "name": "moderator",
  "description": "Content moderator",
  "permissionIds": [1, 2, 3]
}
```

**응답:** `201 Created`

---

### 역할 상세 정보
```http
GET /api/admin/roles/{roleId}
```

**인증:** 필수
**권한:** `VIEW_ROLES`

**응답:** `200 OK`

---

### 역할 수정
```http
PATCH /api/admin/roles/{roleId}
```

**인증:** 필수
**권한:** `UPDATE_ROLE`

**요청 본문:**
```json
{
  "name": "moderator",
  "description": "Updated description",
  "permissionIds": [1, 2, 3, 4]
}
```

**응답:** `200 OK`

**참고:**
- "admin" 역할 이름은 변경할 수 없음
- 권한 업데이트는 원자적으로 처리됨

---

### 역할 삭제
```http
DELETE /api/admin/roles/{roleId}
```

**인증:** 필수
**권한:** `DELETE_ROLE`

**응답:** `200 OK`

**참고:**
- 시스템 역할(admin, member, non-member)은 삭제할 수 없음
- 사용자가 할당된 역할은 삭제할 수 없음

---

### 역할 이전
```http
POST /api/admin/roles/transfer
```

**인증:** 필수
**권한:** `TRANSFER_ROLE`

**요청 본문:**
```json
{
  "fromUserId": 1,
  "toUserId": 2,
  "roleId": 1
}
```

**응답:** `200 OK`
```json
{
  "data": {
    "message": "Role transferred successfully",
    "fromUser": {...},
    "toUser": {...}
  }
}
```

**참고:**
- 대상 사용자는 "member"여야 함
- 원본 사용자는 "member" 역할로 복귀

---

## 3. 게시글 및 댓글 엔드포인트

### 게시글 목록
```http
GET /api/posts
```

**쿼리 파라미터:**
- `categoryId` - 카테고리로 필터링
- `authorId` - 작성자로 필터링
- `page` - 페이지 번호 (기본값: 1)
- `limit` - 페이지당 항목 수 (기본값: 10)

**응답:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "title": "Post Title",
      "content": "Post content...",
      "author": {...},
      "category": {...},
      "_count": { "comments": 5 },
      "files": [...]
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

---

### 게시글 작성
```http
POST /api/posts
```

**인증:** 필수
**권한:** `CREATE_POST`

**요청 본문:**
```json
{
  "title": "New Post",
  "content": "Post content...",
  "categoryId": 1,
  "fileIds": [1, 2, 3]
}
```

**응답:** `201 Created`

---

### 게시글 상세 정보
```http
GET /api/posts/{postId}
```

**응답:** `200 OK`
```json
{
  "data": {
    "id": 1,
    "title": "Post Title",
    "content": "Post content...",
    "author": {...},
    "category": {...},
    "comments": [...],
    "files": [...]
  }
}
```

---

### 게시글 수정
```http
PATCH /api/posts/{postId}
```

**인증:** 필수
**권한:** 작성자 또는 `EDIT_ANY_POST`

**요청 본문:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "categoryId": 2,
  "fileIds": [1, 2]
}
```

**응답:** `200 OK`

---

### 게시글 삭제
```http
DELETE /api/posts/{postId}
```

**인증:** 필수
**권한:** 작성자 또는 `DELETE_ANY_POST`

**응답:** `204 No Content`

---

### 게시글 댓글 조회
```http
GET /api/posts/{postId}/comments
```

**응답:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "content": "Comment text",
      "author": {...},
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 댓글 추가
```http
POST /api/posts/{postId}/comments
```

**인증:** 필수
**권한:** `CREATE_COMMENT`

**요청 본문:**
```json
{
  "content": "New comment"
}
```

**응답:** `201 Created`

---

## 4. 카테고리 엔드포인트

### 카테고리 목록
```http
GET /api/categories
```

**응답:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "name": "General",
      "description": "General posts",
      "_count": { "posts": 25 }
    }
  ]
}
```

---

### 카테고리 생성
```http
POST /api/categories
```

**인증:** 필수
**권한:** `CREATE_CATEGORY`

**요청 본문:**
```json
{
  "name": "Technology",
  "description": "Tech-related posts"
}
```

**응답:** `201 Created`

---

## 5. 도서 관리 엔드포인트

### 도서 목록
```http
GET /api/books
```

**쿼리 파라미터:**
- `status` - 상태로 필터링 (available/borrowed)
- `search` - 제목/저자에서 검색
- `page` - 페이지 번호
- `limit` - 페이지당 항목 수

**응답:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "title": "Book Title",
      "author": "Author Name",
      "isbn": "123-456-789",
      "status": "available",
      "borrower": null
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

### 도서 추가
```http
POST /api/books
```

**인증:** 필수
**권한:** `MANAGE_BOOKS`

**요청 본문:**
```json
{
  "title": "New Book",
  "author": "Author Name",
  "publisher": "Publisher",
  "isbn": "123-456-789",
  "location": "Shelf A-1"
}
```

**응답:** `201 Created`

---

### 도서 상세 정보
```http
GET /api/books/{bookId}
```

**응답:** `200 OK`
```json
{
  "data": {
    "id": 1,
    "title": "Book Title",
    "author": "Author Name",
    "status": "borrowed",
    "borrower": {
      "id": 1,
      "name": "John Doe"
    },
    "borrowedAt": "2024-01-01T00:00:00Z",
    "returnDate": "2024-02-01T00:00:00Z"
  }
}
```

---

### 도서 정보 수정
```http
PATCH /api/books/{bookId}
```

**인증:** 필수
**권한:** `MANAGE_BOOKS`

**요청 본문:**
```json
{
  "title": "Updated Title",
  "location": "Shelf B-2"
}
```

**응답:** `200 OK`

---

### 도서 삭제
```http
DELETE /api/books/{bookId}
```

**인증:** 필수
**권한:** `MANAGE_BOOKS`

**응답:** `204 No Content`

**참고:**
- 대출 중인 도서는 삭제할 수 없음

---

### 도서 대출
```http
POST /api/books/{bookId}/borrow
```

**인증:** 필수
**권한:** `BORROW_BOOK`

**요청 본문:**
```json
{
  "returnDate": "2024-02-01"
}
```

**응답:** `200 OK`
```json
{
  "data": {
    "message": "Book borrowed successfully",
    "book": {...}
  }
}
```

**오류:**
- `400` - 도서가 이미 대출됨
- `400` - 사용자가 연체 도서가 있음
- `400` - 잘못된 반납 날짜

---

### 도서 반납
```http
POST /api/books/{bookId}/return
```

**인증:** 필수
**권한:** `RETURN_BOOK`

**응답:** `200 OK`
```json
{
  "data": {
    "message": "Book returned successfully",
    "wasOverdue": false,
    "book": {...}
  }
}
```

**참고:**
- 대출자 또는 관리자만 반납 가능
- 연체 상태 추적

---

## 6. 이벤트 관리 엔드포인트

### 이벤트 목록
```http
GET /api/events
```

**쿼리 파라미터:**
- `eventType` - 유형으로 필터링 (meeting/workshop/social)
- `startDate` - 이 날짜 이후 이벤트 필터링
- `endDate` - 이 날짜 이전 이벤트 필터링
- `page` - 페이지 번호
- `limit` - 페이지당 항목 수

**응답:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "title": "Monthly Meeting",
      "description": "Regular meeting",
      "eventType": "meeting",
      "startDate": "2024-01-15T10:00:00Z",
      "endDate": "2024-01-15T12:00:00Z",
      "location": "Room 101",
      "_count": { "attendance": 15 }
    }
  ],
  "total": 20,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

---

### 이벤트 생성
```http
POST /api/events
```

**인증:** 필수
**권한:** `MANAGE_EVENTS`

**요청 본문:**
```json
{
  "title": "Workshop",
  "description": "Technical workshop",
  "eventType": "workshop",
  "startDate": "2024-02-01T10:00:00",
  "endDate": "2024-02-01T15:00:00",
  "location": "Lab 202"
}
```

**응답:** `201 Created`

---

### 이벤트 상세 정보
```http
GET /api/events/{eventId}
```

**응답:** `200 OK`
```json
{
  "data": {
    "id": 1,
    "title": "Workshop",
    "description": "Technical workshop",
    "attendance": [
      {
        "user": {...},
        "status": "present",
        "checkedInAt": "2024-02-01T10:05:00Z"
      }
    ]
  }
}
```

---

### 이벤트 수정
```http
PATCH /api/events/{eventId}
```

**인증:** 필수
**권한:** `MANAGE_EVENTS`

**요청 본문:**
```json
{
  "title": "Updated Workshop",
  "endDate": "2024-02-01T16:00:00"
}
```

**응답:** `200 OK`

---

### 이벤트 삭제
```http
DELETE /api/events/{eventId}
```

**인증:** 필수
**권한:** `MANAGE_EVENTS`

**응답:** `204 No Content`

---

### 이벤트 출석 조회
```http
GET /api/events/{eventId}/attendance
```

**인증:** 필수
**권한:** `VIEW_ATTENDANCE`

**응답:** `200 OK`
```json
{
  "data": {
    "event": {...},
    "attendance": [...],
    "statistics": {
      "total": 20,
      "present": 15,
      "late": 3,
      "absent": 2
    }
  }
}
```

---

### 이벤트 체크인
```http
POST /api/events/{eventId}/attendance
```

**인증:** 필수
**권한:** `CHECK_IN`

**요청 본문:**
```json
{
  "status": "present"
}
```

**응답:** `201 Created`
```json
{
  "data": {
    "id": 1,
    "userId": 1,
    "eventId": 1,
    "status": "late",
    "checkedInAt": "2024-02-01T10:35:00Z"
  }
}
```

**참고:**
- 지각 출석 자동 감지 (시작 시간 30분 이후)
- 중복 체크인 방지

---

## 7. 회비 관리 엔드포인트 (장부 시스템)

### 거래 내역 목록
```http
GET /api/fees
```

**인증:** 필수
**권한:** `VIEW_FEES`

**쿼리 파라미터:**
- `type` - 거래 유형으로 필터링 (deposit/withdrawal)
- `year` - 연도로 필터링
- `semester` - 학기로 필터링
- `userId` - 사용자로 필터링
- `dateFrom` - 시작 날짜 필터
- `dateTo` - 종료 날짜 필터
- `page` - 페이지 번호
- `limit` - 페이지당 항목 수

**응답:** `200 OK`
```json
{
  "fees": [...],
  "statistics": {
    "totalDeposits": 1500000,
    "depositCount": 20,
    "totalWithdrawals": 500000,
    "withdrawalCount": 10,
    "netBalance": 1000000,
    "totalTransactions": 30
  },
  "pagination": {
    "total": 30,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### 거래 생성
```http
POST /api/fees
```

**인증:** 필수
**권한:** `MANAGE_FEES`

**요청 본문:**
```json
{
  "userId": 1,
  "type": "deposit",
  "amount": 50000,
  "description": "Monthly membership fee",
  "date": "2024-01-01"
}
```

**응답:** `201 Created`

---

### 거래 상세 정보
```http
GET /api/fees/{feeId}
```

**인증:** 필수
**권한:** `VIEW_FEES` 또는 `VIEW_OWN_FEES`

**응답:** `200 OK`
```json
{
  "id": 1,
  "type": "deposit",
  "amount": 50000,
  "description": "Monthly membership fee",
  "date": "2024-01-01",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "user": {...}
}
```

---

### 거래 수정
```http
PATCH /api/fees/{feeId}
```

**인증:** 필수
**권한:** `MANAGE_FEES`

**요청 본문:**
```json
{
  "type": "withdrawal",
  "amount": 30000,
  "description": "Updated description",
  "date": "2024-01-15"
}
```

**응답:** `200 OK`

**참고:**
- 거래 유형, 금액, 설명, 날짜 수정 가능

---

## 8. 평가 엔드포인트

### 평가 목록
```http
GET /api/evaluations
```

**인증:** 필수
**권한:** `VIEW_EVALUATIONS`

**쿼리 파라미터:**
- `year` - 연도로 필터링
- `semester` - 학기로 필터링
- `userId` - 평가받은 사용자로 필터링
- `evaluatorId` - 평가자로 필터링
- `page` - 페이지 번호
- `limit` - 페이지당 항목 수

**응답:** `200 OK`
```json
{
  "data": {
    "evaluations": [...],
    "statistics": {
      "averageScore": 4.2,
      "totalEvaluations": 50,
      "scoreDistribution": {...}
    }
  }
}
```

---

### 평가 생성
```http
POST /api/evaluations
```

**인증:** 필수
**권한:** `MANAGE_EVALUATIONS`

**요청 본문:**
```json
{
  "userId": 1,
  "year": 2024,
  "semester": 1,
  "score": 4.5,
  "comments": "Excellent performance"
}
```

**응답:** `201 Created`

**참고:**
- 동일 사용자/기간에 대한 중복 평가 방지

---

### 평가 상세 정보
```http
GET /api/evaluations/{evaluationId}
```

**인증:** 필수
**권한:** `VIEW_EVALUATIONS` 또는 `VIEW_OWN_EVALUATIONS`

**응답:** `200 OK`

---

### 평가 수정
```http
PATCH /api/evaluations/{evaluationId}
```

**인증:** 필수
**권한:** `MANAGE_EVALUATIONS`

**요청 본문:**
```json
{
  "score": 4.8,
  "comments": "Updated comments"
}
```

**응답:** `200 OK`

**참고:**
- 평가자 또는 관리자만 수정 가능

---

## 9. 파일 관리 엔드포인트

### 파일 목록
```http
GET /api/files
```

**인증:** 필수
**권한:** `VIEW_FILES` 또는 `VIEW_OWN_FILES`

**쿼리 파라미터:**
- `purpose` - 용도로 필터링
- `uploaderId` - 업로더로 필터링
- `page` - 페이지 번호
- `limit` - 페이지당 항목 수

**응답:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "filename": "document.pdf",
      "originalName": "Report.pdf",
      "mimeType": "application/pdf",
      "size": 102400,
      "purpose": "document",
      "uploader": {...}
    }
  ]
}
```

---

### 파일 업로드
```http
POST /api/files/upload
```

**인증:** 필수
**권한:** `UPLOAD_FILE`

**요청:** Multipart form data
- `file` - 업로드할 파일
- `purpose` - 파일 용도
- `description` - 선택적 설명

**응답:** `201 Created`
```json
{
  "data": {
    "id": 1,
    "filename": "abc123_document.pdf",
    "originalName": "document.pdf",
    "size": 102400
  }
}
```

**참고:**
- 최대 파일 크기: 10MB
- 허용된 유형: 이미지, PDF, 문서
- 고유한 파일명 생성

---

### 파일 메타데이터 조회
```http
GET /api/files/{fileId}
```

**인증:** 필수
**권한:** `VIEW_FILES` 또는 `VIEW_OWN_FILES`

**응답:** `200 OK`

---

### 파일 삭제
```http
DELETE /api/files/{fileId}
```

**인증:** 필수
**권한:** `DELETE_OWN_FILE` 또는 `DELETE_ANY_FILE`

**응답:** `200 OK`
```json
{
  "data": {
    "message": "File deleted successfully"
  }
}
```

---

### 파일 다운로드
```http
GET /api/files/{fileId}/download
```

**인증:** 필수
**권한:** `DOWNLOAD_FILE`

**응답:** 적절한 헤더와 함께 파일 바이너리 데이터

---

## 10. 수상 엔드포인트

### 수상 내역 목록
```http
GET /api/awards
```

**인증:** 필수
**권한:** 자동 결정

**응답:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "title": "Best Project",
      "description": "Annual project competition",
      "user": {...},
      "evidenceFile": {...}
    }
  ]
}
```

**참고:**
- 관리자는 모든 수상 내역 확인 가능
- 사용자는 자신의 수상 내역만 확인 가능

---

### 수상 내역 생성
```http
POST /api/awards
```

**인증:** 필수
**권한:** `CREATE_OWN_AWARD`

**요청 본문:**
```json
{
  "title": "Competition Winner",
  "description": "First place in coding competition",
  "evidenceFileId": 1
}
```

**응답:** `201 Created`

---

### 수상 내역 상세 정보
```http
GET /api/awards/{awardId}
```

**인증:** 필수
**권한:** 작성자 또는 `VIEW_ALL_AWARDS`

**응답:** `200 OK`

---

### 수상 내역 수정
```http
PATCH /api/awards/{awardId}
```

**인증:** 필수
**권한:** `UPDATE_OWN_AWARD` 또는 `UPDATE_ANY_AWARD`

**요청 본문:**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**응답:** `200 OK`

---

### 수상 내역 삭제
```http
DELETE /api/awards/{awardId}
```

**인증:** 필수
**권한:** `DELETE_OWN_AWARD` 또는 `DELETE_ANY_AWARD`

**응답:** `200 OK`

---

## 11. 교육 이력 엔드포인트

### 교육 이력 목록
```http
GET /api/education
```

**인증:** 필수
**권한:** 자동 결정

**응답:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "title": "Python Workshop",
      "description": "Advanced Python programming",
      "user": {...},
      "evidenceFile": {...}
    }
  ]
}
```

---

### 교육 이력 생성
```http
POST /api/education
```

**인증:** 필수
**권한:** `CREATE_OWN_EDUCATION`

**요청 본문:**
```json
{
  "title": "Database Course",
  "description": "MySQL and database design",
  "evidenceFileId": 1
}
```

**응답:** `201 Created`

---

### 교육 이력 상세 정보
```http
GET /api/education/{educationId}
```

**인증:** 필수
**권한:** 작성자 또는 `VIEW_ALL_EDUCATION`

**응답:** `200 OK`

---

### 교육 이력 수정
```http
PATCH /api/education/{educationId}
```

**인증:** 필수
**권한:** `UPDATE_OWN_EDUCATION` 또는 `UPDATE_ANY_EDUCATION`

**요청 본문:**
```json
{
  "title": "Updated Course",
  "description": "Updated description"
}
```

**응답:** `200 OK`

---

### 교육 이력 삭제
```http
DELETE /api/education/{educationId}
```

**인증:** 필수
**권한:** `DELETE_OWN_EDUCATION` 또는 `DELETE_ANY_EDUCATION`

**응답:** `200 OK`

---

## 12. 청소 관리 엔드포인트

### 청소 일정 목록
```http
GET /api/cleanings
```

**인증:** 필수
**권한:** `VIEW_CLEANINGS`

**쿼리 파라미터:**
- `dateFrom` - 시작 날짜 필터
- `dateTo` - 종료 날짜 필터
- `page` - 페이지 번호
- `limit` - 페이지당 항목 수

**응답:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "date": "2024-01-15",
      "description": "Weekly cleaning",
      "assignedUsers": [...]
    }
  ]
}
```

---

### 청소 일정 생성
```http
POST /api/cleanings
```

**인증:** 필수
**권한:** `CREATE_CLEANING`

**요청 본문:**
```json
{
  "date": "2024-01-15",
  "description": "Weekly cleaning",
  "userIds": [1, 2, 3]
}
```

**응답:** `201 Created`

---

### 청소 일정 상세 정보
```http
GET /api/cleanings/{cleaningId}
```

**인증:** 필수
**권한:** `VIEW_CLEANINGS`

**응답:** `200 OK`

---

### 청소 일정 수정
```http
PATCH /api/cleanings/{cleaningId}
```

**인증:** 필수
**권한:** `UPDATE_CLEANING`

**요청 본문:**
```json
{
  "date": "2024-01-16",
  "description": "Updated description",
  "userIds": [1, 2, 4]
}
```

**응답:** `200 OK`

---

### 청소 일정 삭제
```http
DELETE /api/cleanings/{cleaningId}
```

**인증:** 필수
**권한:** `DELETE_CLEANING`

**응답:** `200 OK`

---

## 13. 사용자 프로필 엔드포인트

### 현재 사용자 프로필 조회
```http
GET /api/users/me
```

**인증:** 필수

**응답:** `200 OK`
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "major": "Computer Science",
    "class": "2024-1",
    "role": {
      "name": "member",
      "permissions": [...]
    },
    "awards": [...],
    "educationHistory": [...],
    "profileImage": {...},
    "signatureImage": {...}
  }
}
```

---

### 프로필 수정
```http
PATCH /api/users/me
```

**인증:** 필수

**요청 본문:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "major": "Software Engineering",
  "class": "2024-2",
  "profileImageId": 2
}
```

**응답:** `200 OK`

**참고:**
- 이메일은 고유해야 함
- 학번 형식: YYYY-S (예: 2024-1)

---

### 비밀번호 변경
```http
PATCH /api/users/me/password
```

**인증:** 필수

**요청 본문:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password123"
}
```

**응답:** `200 OK`
```json
{
  "data": {
    "message": "Password updated successfully"
  }
}
```

---

### 내 출석 기록
```http
GET /api/users/me/attendance
```

**인증:** 필수
**권한:** `VIEW_OWN_ATTENDANCE`

**쿼리 파라미터:**
- `year` - 연도로 필터링
- `semester` - 학기로 필터링
- `page` - 페이지 번호
- `limit` - 페이지당 항목 수

**응답:** `200 OK`
```json
{
  "data": {
    "attendance": [...],
    "statistics": {
      "totalEvents": 10,
      "attendedEvents": 8,
      "attendanceRate": 80,
      "lateCount": 2
    }
  }
}
```

---

### 내 평가 기록
```http
GET /api/users/me/evaluations
```

**인증:** 필수
**권한:** `VIEW_OWN_EVALUATIONS`

**쿼리 파라미터:**
- `year` - 연도로 필터링
- `semester` - 학기로 필터링
- `page` - 페이지 번호
- `limit` - 페이지당 항목 수

**응답:** `200 OK`
```json
{
  "data": {
    "evaluations": [...],
    "statistics": {
      "averageScore": 4.5,
      "trend": "improving",
      "totalEvaluations": 5
    }
  }
}
```

---

### 내 거래 내역
```http
GET /api/users/me/fees
```

**인증:** 필수
**권한:** `VIEW_OWN_FEES`

**쿼리 파라미터:**
- `type` - 거래 유형으로 필터링 (deposit/withdrawal)
- `year` - 연도로 필터링
- `semester` - 학기로 필터링
- `dateFrom` - 시작 날짜
- `dateTo` - 종료 날짜
- `page` - 페이지 번호
- `limit` - 페이지당 항목 수

**응답:** `200 OK`
```json
{
  "fees": [...],
  "statistics": {
    "totalDeposits": 200000,
    "depositCount": 5,
    "totalWithdrawals": 50000,
    "withdrawalCount": 2,
    "netBalance": 150000,
    "totalTransactions": 7
  },
  "pagination": {...}
}
```

---

### 내 수상 내역
```http
GET /api/users/me/awards
```

**인증:** 필수

**응답:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "title": "Achievement",
      "description": "Description",
      "evidenceFile": {...}
    }
  ]
}
```

---

### 내 교육 이력
```http
GET /api/users/me/education
```

**인증:** 필수

**응답:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "title": "Course",
      "description": "Description",
      "evidenceFile": {...}
    }
  ]
}
```

---

## 공통 패턴

### 페이지네이션
모든 목록 엔드포인트는 일관된 파라미터로 페이지네이션을 지원합니다:
- `page` - 페이지 번호 (기본값: 1)
- `limit` - 페이지당 항목 수 (기본값: 10)

응답에 포함되는 내용:
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### 날짜 필터링
날짜 파라미터는 ISO 8601 형식을 수용합니다:
- 날짜만: `2024-01-15`
- 날짜와 시간: `2024-01-15T10:30:00`
- 시간대 포함: `2024-01-15T10:30:00Z`

### 검색
검색 파라미터는 일반적으로 여러 필드에서 검색합니다:
- 도서: 제목, 저자, ISBN
- 게시글: 제목, 내용
- 사용자: 이름, 이메일

### 파일 처리
- 업로드: Multipart form data
- 다운로드: 적절한 헤더와 함께 바이너리 응답
- 메타데이터: 파일 상세 정보와 함께 JSON 응답

### 권한 확인
- 라우트는 `hasPermission()` 헬퍼를 사용하여 권한 확인
- `canModifyResource()`로 리소스 소유권 확인
- 사용자 컨텍스트를 기반으로 자동 결정되는 권한

---

## 유효성 검사 스키마

API는 요청 유효성 검사를 위해 Zod 스키마를 사용합니다. 공통 스키마는 다음과 같습니다:

### 사용자 스키마
- `registerSchema` - 등록 유효성 검사
- `loginSchema` - 로그인 유효성 검사
- `updateUserSchema` - 사용자 업데이트 유효성 검사
- `changePasswordSchema` - 비밀번호 변경 유효성 검사

### 리소스 스키마
- `createPostSchema` - 게시글 생성
- `createBookSchema` - 도서 추가
- `createEventSchema` - 이벤트 생성
- `createFeeSchema` - 회비 기록 생성

### 공통 유효성 검사
- 이메일 형식 유효성 검사
- 날짜 형식 및 범위 유효성 검사
- 문자열 길이 제한
- 숫자 범위
- 상태 필드의 열거형 값

---

## 오류 코드 참조

| 상태 코드 | 의미 | 일반적인 원인 |
|------------|---------|---------------|
| 400 | Bad Request | 잘못된 입력, 유효성 검사 실패 |
| 401 | Unauthorized | 인증 누락 또는 잘못된 인증 |
| 403 | Forbidden | 권한 부족 |
| 404 | Not Found | 리소스가 존재하지 않음 |
| 409 | Conflict | 중복 항목, 제약 조건 위반 |
| 500 | Server Error | 예상치 못한 서버 오류 |

---

## 요청 제한

현재 요청 제한은 구현되지 않았습니다. 프로덕션 배포를 위해 요청 제한 추가를 고려하세요.

---

## CORS 설정

CORS는 Next.js 미들웨어에서 구성됩니다. 프론트엔드 도메인에 맞게 헤더를 조정하세요.

---

## 환경 변수

필수 환경 변수:

```env
DATABASE_URL=mysql://user:password@localhost:3306/database
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
UPLOAD_DIR=/uploads
```

---

## 보안 고려사항

1. **인증**: HttpOnly 쿠키의 JWT 토큰
2. **비밀번호 보안**: 설정 가능한 라운드로 Bcrypt 해싱
3. **SQL 인젝션**: Prisma ORM으로 보호
4. **XSS 보호**: 입력 검증 및 살균
5. **파일 업로드**: 유형 및 크기 제한
6. **권한 시스템**: 세분화된 RBAC

---

## 개발 팁

1. 데이터베이스 검사를 위해 Prisma Studio 사용: `npm run prisma:studio`
2. 테스트 데이터로 데이터베이스 시드: `npm run prisma:seed`
3. 개발 중 API 경로 확인: `npm run dev`
4. 인증 문제 디버깅을 위해 로그 확인
5. Postman 또는 curl과 같은 도구로 테스트

---

## 지원

API에 대한 문제나 질문이 있는 경우 프로젝트 문서를 참조하거나 개발팀에 문의하세요.

---

*마지막 업데이트: 2025/09/25*
*API 버전: 1.0.0*