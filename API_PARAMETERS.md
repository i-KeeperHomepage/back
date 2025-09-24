# i-Keeper API Parameters Reference

이 문서는 i-Keeper 백엔드 API의 모든 엔드포인트에서 요구하는 파라미터 양식을 정리한 참조 문서입니다.

## 목차
- [인증 (Authentication)](#인증-authentication)
- [사용자 (User)](#사용자-user)
- [관리자 (Admin)](#관리자-admin)
- [게시물 (Posts)](#게시물-posts)
- [댓글 (Comments)](#댓글-comments)
- [카테고리 (Categories)](#카테고리-categories)
- [일정 관리 (Events)](#일정-관리-events)
- [출석 관리 (Attendance)](#출석-관리-attendance)
- [도서 관리 (Books)](#도서-관리-books)
- [회비 관리 (Fees)](#회비-관리-fees)
- [평가 관리 (Evaluations)](#평가-관리-evaluations)
- [파일 관리 (Files)](#파일-관리-files)

---

## 인증 (Authentication)

### POST /api/auth/register
**설명**: 새로운 사용자 회원가입

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| loginId | string | ✅ | 최소 3자, 최대 50자 | 로그인 ID |
| password | string | ✅ | 최소 8자, 최대 100자 | 비밀번호 |
| name | string | ✅ | 최소 2자, 최대 50자 | 사용자 이름 |
| email | string | ✅ | 유효한 이메일, 최대 100자 | 이메일 주소 |

**예제 요청**:
```json
{
  "loginId": "user123",
  "password": "password123!",
  "name": "홍길동",
  "email": "user@example.com"
}
```

**성공 응답 (201 Created)**:
```json
{
  "message": "Registration successful. Please wait for admin approval.",
  "user": {
    "id": 1,
    "loginId": "user123",
    "name": "홍길동",
    "email": "user@example.com",
    "status": "pending_approval",
    "createdAt": "2025-09-17T00:00:00.000Z"
  }
}
```

### POST /api/auth/login
**설명**: 사용자 로그인

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| loginId | string | ✅ | 최소 3자, 최대 50자 | 로그인 ID |
| password | string | ✅ | 최소 1자 | 비밀번호 |

**예제 요청**:
```json
{
  "loginId": "user123",
  "password": "password123!"
}
```

**성공 응답 (200 OK)**:
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "loginId": "user123",
    "name": "홍길동",
    "email": "user@example.com",
    "role": {
      "id": 2,
      "name": "member"
    }
  }
}
```

### POST /api/auth/logout
**설명**: 사용자 로그아웃

**Request Body**: 없음

**성공 응답 (200 OK)**:
```json
{
  "message": "Logout successful"
}
```

---

## 사용자 (User)

### GET /api/users/me
**설명**: 현재 로그인한 사용자 정보 조회

**Request Body**: 없음

**헤더 요구사항**: 인증 토큰 (Cookie에 자동 포함)

**성공 응답 (200 OK)**:
```json
{
  "id": 1,
  "loginId": "user123",
  "name": "홍길동",
  "email": "user@example.com",
  "status": "active",
  "createdAt": "2025-09-17T00:00:00.000Z",
  "role": {
    "id": 2,
    "name": "member",
    "description": "Default member role",
    "permissions": []
  }
}
```

### PATCH /api/users/me
**설명**: 현재 로그인한 사용자 정보 수정

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| name | string | ❌ | 최소 2자, 최대 50자 | 사용자 이름 |
| email | string | ❌ | 유효한 이메일, 최대 100자 | 이메일 주소 |

**예제 요청**:
```json
{
  "name": "김철수",
  "email": "newmail@example.com"
}
```

**성공 응답 (200 OK)**:
```json
{
  "id": 1,
  "loginId": "user123",
  "name": "김철수",
  "email": "newmail@example.com",
  "status": "active"
}
```

### PATCH /api/users/me/password
**설명**: 비밀번호 변경

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| currentPassword | string | ✅ | 최소 1자 | 현재 비밀번호 |
| newPassword | string | ✅ | 최소 8자, 최대 100자 | 새 비밀번호 |

**예제 요청**:
```json
{
  "currentPassword": "oldPassword123!",
  "newPassword": "newPassword456!"
}
```

**성공 응답 (200 OK)**:
```json
{
  "message": "Password changed successfully"
}
```

---

## 관리자 (Admin)

### GET /api/admin/pending-users
**설명**: 가입 승인 대기 중인 사용자 목록 조회 (관리자 권한 필요)

**Request Body**: 없음

**성공 응답 (200 OK)**:
```json
[
  {
    "id": 2,
    "loginId": "newuser",
    "name": "신규사용자",
    "email": "new@example.com",
    "status": "pending_approval",
    "createdAt": "2025-09-17T00:00:00.000Z",
    "role": {
      "id": 2,
      "name": "member"
    }
  }
]
```

### PATCH /api/admin/users/{userId}/approve
**설명**: 사용자 가입 승인 또는 거절 (관리자 권한 필요)

**Path Parameter**:
- `userId`: 승인/거절할 사용자 ID (숫자)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| approve | boolean | ✅ | true: 승인, false: 거절 |

**예제 요청**:
```json
{
  "approve": true
}
```

**성공 응답 (200 OK)**:
```json
{
  "message": "User approved successfully",
  "user": {
    "id": 2,
    "loginId": "newuser",
    "name": "신규사용자",
    "email": "new@example.com",
    "status": "active"
  }
}
```

### GET /api/admin/users
**설명**: 전체 사용자 목록 조회 (관리자 권한 필요)

**Query Parameters** (선택적):
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| status | string | 상태별 필터링 (pending_approval, active, inactive, withdrawn) |
| role | string | 역할별 필터링 |

**예제 요청**: `/api/admin/users?status=active`

**성공 응답**: 사용자 목록 배열

### PATCH /api/admin/users/{userId}
**설명**: 사용자 정보 수정 (관리자 권한 필요)

**Path Parameter**:
- `userId`: 수정할 사용자 ID (숫자)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| status | string | ❌ | enum: pending_approval, active, inactive, withdrawn | 사용자 상태 |
| roleId | number | ❌ | 양의 정수 | 역할 ID |

**예제 요청**:
```json
{
  "status": "inactive",
  "roleId": 3
}
```

**성공 응답 (200 OK)**:
```json
{
  "id": 2,
  "loginId": "user123",
  "name": "홍길동",
  "email": "user@example.com",
  "status": "inactive",
  "roleId": 3
}
```

### DELETE /api/admin/users/{userId}
**설명**: 사용자 삭제 (관리자 권한 필요)

**Path Parameter**:
- `userId`: 삭제할 사용자 ID (숫자)

**Request Body**: 없음

**성공 응답**: 204 No Content

### GET /api/admin/roles
**설명**: 모든 역할 목록 조회 (관리자 권한 필요)

**Request Body**: 없음

**성공 응답 (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "admin",
    "description": "Administrator role",
    "userCount": 1,
    "permissions": [
      {
        "id": 1,
        "action": "manage_users",
        "description": "Can manage users"
      }
    ]
  }
]
```

### POST /api/admin/roles
**설명**: 새 역할 생성 (관리자 권한 필요)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✅ | 역할 이름 (고유해야 함) |
| description | string | ❌ | 역할 설명 |
| permissions | number[] | ❌ | 권한 ID 배열 |

**예제 요청**:
```json
{
  "name": "moderator",
  "description": "Content moderator role",
  "permissions": [2, 3, 4]
}
```

**성공 응답 (201 Created)**:
```json
{
  "id": 4,
  "name": "moderator",
  "description": "Content moderator role",
  "permissions": [
    {
      "id": 2,
      "action": "delete_posts",
      "description": "Can delete posts"
    }
  ]
}
```

### POST /api/admin/roles/transfer
**설명**: 역할 양도 (관리자 권한 필요)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| fromUserId | number | ✅ | 양의 정수 | 양도하는 사용자 ID |
| toUserId | number | ✅ | 양의 정수 | 양도받는 사용자 ID |
| roleId | number | ✅ | 양의 정수 | 양도할 역할 ID |

**예제 요청**:
```json
{
  "fromUserId": 1,
  "toUserId": 2,
  "roleId": 1
}
```

**성공 응답 (200 OK)**:
```json
{
  "message": "Role transferred successfully",
  "fromUser": {
    "id": 1,
    "name": "이전관리자",
    "roleId": 2
  },
  "toUser": {
    "id": 2,
    "name": "새관리자",
    "roleId": 1
  }
}
```

---

## 게시물 (Posts)

### GET /api/posts
**설명**: 게시물 목록 조회

**Query Parameters** (선택적):
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| page | number | 페이지 번호 (기본값: 1) |
| limit | number | 페이지당 게시물 수 (기본값: 10) |
| category | number | 카테고리 ID로 필터링 |

**예제 요청**: `/api/posts?page=1&limit=10&category=2`

**성공 응답**: 게시물 목록 배열

### POST /api/posts
**설명**: 새 게시물 작성 (로그인 필요)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| title | string | ✅ | 최소 1자, 최대 255자 | 게시물 제목 |
| content | string | ✅ | 최소 1자 | 게시물 내용 |
| categoryId | number | ✅ | 양의 정수 | 카테고리 ID |

**예제 요청**:
```json
{
  "title": "게시물 제목입니다",
  "content": "게시물 내용입니다. 여러 줄의 텍스트를 포함할 수 있습니다.",
  "categoryId": 1
}
```

**성공 응답 (201 Created)**:
```json
{
  "id": 10,
  "title": "게시물 제목입니다",
  "content": "게시물 내용입니다. 여러 줄의 텍스트를 포함할 수 있습니다.",
  "authorId": 1,
  "categoryId": 1,
  "createdAt": "2025-09-17T00:00:00.000Z"
}
```

### GET /api/posts/{postId}
**설명**: 게시물 상세 조회

**Path Parameter**:
- `postId`: 조회할 게시물 ID (숫자)

**Request Body**: 없음

**성공 응답**: 게시물 상세 정보

### PATCH /api/posts/{postId}
**설명**: 게시물 수정 (작성자 또는 관리자만 가능)

**Path Parameter**:
- `postId`: 수정할 게시물 ID (숫자)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| title | string | ❌ | 최소 1자, 최대 255자 | 게시물 제목 |
| content | string | ❌ | 최소 1자 | 게시물 내용 |
| categoryId | number | ❌ | 양의 정수 | 카테고리 ID |

**예제 요청**:
```json
{
  "title": "수정된 제목",
  "content": "수정된 내용입니다."
}
```

**성공 응답 (200 OK)**:
```json
{
  "id": 10,
  "title": "수정된 제목",
  "content": "수정된 내용입니다.",
  "authorId": 1,
  "categoryId": 1,
  "createdAt": "2025-09-17T00:00:00.000Z"
}
```

### DELETE /api/posts/{postId}
**설명**: 게시물 삭제 (작성자 또는 관리자만 가능)

**Path Parameter**:
- `postId`: 삭제할 게시물 ID (숫자)

**Request Body**: 없음

**성공 응답**: 204 No Content

---

## 댓글 (Comments)

### GET /api/posts/{postId}/comments
**설명**: 특정 게시물의 댓글 목록 조회

**Path Parameter**:
- `postId`: 게시물 ID (숫자)

**Request Body**: 없음

**성공 응답 (200 OK)**:
```json
[
  {
    "id": 1,
    "content": "좋은 글이네요!",
    "authorId": 2,
    "postId": 10,
    "createdAt": "2025-09-17T00:00:00.000Z",
    "author": {
      "id": 2,
      "name": "댓글작성자"
    }
  }
]
```

### POST /api/posts/{postId}/comments
**설명**: 댓글 작성 (로그인 필요)

**Path Parameter**:
- `postId`: 게시물 ID (숫자)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| content | string | ✅ | 최소 1자 | 댓글 내용 |

**예제 요청**:
```json
{
  "content": "좋은 글 감사합니다!"
}
```

**성공 응답 (201 Created)**:
```json
{
  "id": 15,
  "content": "좋은 글 감사합니다!",
  "authorId": 1,
  "postId": 10,
  "createdAt": "2025-09-17T00:00:00.000Z"
}
```

---

## 카테고리 (Categories)

### GET /api/categories
**설명**: 카테고리 목록 조회

**Request Body**: 없음

**성공 응답 (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "공지사항",
    "description": "동아리 공지사항",
    "postCount": 5
  },
  {
    "id": 2,
    "name": "자유게시판",
    "description": "자유로운 글 작성",
    "postCount": 23
  }
]
```

### POST /api/categories
**설명**: 카테고리 생성 (관리자 권한 필요)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| name | string | ✅ | 최소 1자, 최대 50자 | 카테고리 이름 |
| description | string | ❌ | - | 카테고리 설명 |

**예제 요청**:
```json
{
  "name": "스터디",
  "description": "스터디 관련 게시판"
}
```

**성공 응답 (201 Created)**:
```json
{
  "id": 3,
  "name": "스터디",
  "description": "스터디 관련 게시판"
}
```

---

## 일정 관리 (Events)

### GET /api/events
**설명**: 일정 목록 조회

**Query Parameters** (선택적):
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| page | number | 페이지 번호 (기본값: 1) |
| limit | number | 페이지당 항목 수 (기본값: 20) |
| eventType | string | 이벤트 타입으로 필터링 |
| startDate | string | 시작일자 이후 이벤트 (ISO 8601 형식) |
| endDate | string | 종료일자 이전 이벤트 (ISO 8601 형식) |

**예제 요청**: `/api/events?page=1&limit=10&eventType=meeting`

**성공 응답 (200 OK)**:
```json
{
  "events": [
    {
      "id": 1,
      "title": "정기 회의",
      "description": "월간 정기 회의",
      "startDate": "2025-09-20T14:00:00.000Z",
      "endDate": "2025-09-20T16:00:00.000Z",
      "location": "회의실 A",
      "eventType": "meeting",
      "createdAt": "2025-09-17T00:00:00.000Z",
      "_count": {
        "attendance": 15
      }
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### POST /api/events
**설명**: 새 일정 생성 (manage_events 권한 필요)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| title | string | ✅ | 최소 1자, 최대 255자 | 일정 제목 |
| description | string | ❌ | - | 일정 설명 |
| startDate | string | ✅ | ISO 8601 datetime | 시작 일시 |
| endDate | string | ✅ | ISO 8601 datetime | 종료 일시 |
| location | string | ❌ | 최대 255자 | 장소 |
| eventType | string | ✅ | 최소 1자, 최대 50자 | 이벤트 타입 |

**예제 요청**:
```json
{
  "title": "스터디 모임",
  "description": "알고리즘 스터디",
  "startDate": "2025-09-25T19:00:00.000Z",
  "endDate": "2025-09-25T21:00:00.000Z",
  "location": "스터디룸 B",
  "eventType": "study"
}
```

**성공 응답 (201 Created)**: 생성된 일정 정보

### GET /api/events/{eventId}
**설명**: 일정 상세 조회

**Path Parameter**:
- `eventId`: 일정 ID (숫자)

**성공 응답 (200 OK)**:
```json
{
  "id": 1,
  "title": "정기 회의",
  "description": "월간 정기 회의",
  "startDate": "2025-09-20T14:00:00.000Z",
  "endDate": "2025-09-20T16:00:00.000Z",
  "location": "회의실 A",
  "eventType": "meeting",
  "attendance": [
    {
      "id": 1,
      "status": "present",
      "checkInAt": "2025-09-20T13:55:00.000Z",
      "user": {
        "id": 2,
        "name": "홍길동",
        "email": "hong@example.com"
      }
    }
  ]
}
```

### PATCH /api/events/{eventId}
**설명**: 일정 수정 (manage_events 권한 필요)

**Path Parameter**:
- `eventId`: 일정 ID (숫자)

**Request Body**: POST와 동일 (모든 필드 선택적)

### DELETE /api/events/{eventId}
**설명**: 일정 삭제 (manage_events 권한 필요)

**Path Parameter**:
- `eventId`: 일정 ID (숫자)

**성공 응답**: 204 No Content

---

## 출석 관리 (Attendance)

### GET /api/events/{eventId}/attendance
**설명**: 이벤트별 출석 현황 조회 (view_attendance 권한 필요)

**Path Parameter**:
- `eventId`: 이벤트 ID (숫자)

**성공 응답 (200 OK)**:
```json
{
  "event": {
    "id": 1,
    "title": "정기 회의",
    "startDate": "2025-09-20T14:00:00.000Z",
    "endDate": "2025-09-20T16:00:00.000Z"
  },
  "attendance": [
    {
      "id": 1,
      "status": "present",
      "checkInAt": "2025-09-20T13:55:00.000Z",
      "user": {
        "id": 2,
        "name": "홍길동",
        "email": "hong@example.com",
        "role": {
          "name": "member"
        }
      }
    }
  ],
  "stats": {
    "total": 20,
    "present": 15,
    "absent": 3,
    "late": 2,
    "excused": 0
  }
}
```

### POST /api/events/{eventId}/attendance
**설명**: 출석 체크인 (check_in 권한 필요)

**Path Parameter**:
- `eventId`: 이벤트 ID (숫자)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| status | string | ✅ | enum: present, absent, late, excused | 출석 상태 |

**예제 요청**:
```json
{
  "status": "present"
}
```

**성공 응답 (201 Created)**: 출석 기록 정보

### GET /api/users/me/attendance
**설명**: 내 출석 현황 조회 (view_own_attendance 권한 필요)

**Query Parameters** (선택적):
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| page | number | 페이지 번호 (기본값: 1) |
| limit | number | 페이지당 항목 수 (기본값: 20) |
| year | number | 연도별 필터링 |
| semester | string | 학기별 필터링 |

**성공 응답 (200 OK)**:
```json
{
  "attendance": [...],
  "statistics": {
    "total": 30,
    "present": 25,
    "absent": 2,
    "late": 3,
    "excused": 0,
    "attendanceRate": 93
  },
  "pagination": {...}
}
```

---

## 도서 관리 (Books)

### GET /api/books
**설명**: 도서 목록 조회

**Query Parameters** (선택적):
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| page | number | 페이지 번호 (기본값: 1) |
| limit | number | 페이지당 항목 수 (기본값: 20) |
| status | string | 상태별 필터링 (available, borrowed, lost) |
| search | string | 제목, 저자, 출판사, ISBN 검색 |

**성공 응답 (200 OK)**:
```json
{
  "books": [
    {
      "id": 1,
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "publisher": "Prentice Hall",
      "isbn": "9780132350884",
      "location": "A-1",
      "status": "available",
      "borrowerId": null,
      "borrowedAt": null,
      "returnDate": null,
      "borrower": null
    }
  ],
  "pagination": {...}
}
```

### POST /api/books
**설명**: 도서 추가 (manage_books 권한 필요)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| title | string | ✅ | 최소 1자, 최대 255자 | 도서 제목 |
| author | string | ✅ | 최소 1자, 최대 100자 | 저자 |
| publisher | string | ✅ | 최소 1자, 최대 100자 | 출판사 |
| isbn | string | ❌ | 최대 20자 | ISBN (고유값) |
| location | string | ❌ | 최대 50자 | 보관 위치 |

**예제 요청**:
```json
{
  "title": "Effective Java",
  "author": "Joshua Bloch",
  "publisher": "Addison-Wesley",
  "isbn": "9780134685991",
  "location": "B-3"
}
```

### GET /api/books/{bookId}
**설명**: 도서 상세 조회

**Path Parameter**:
- `bookId`: 도서 ID (숫자)

**성공 응답**: 도서 상세 정보 (대출자 정보 포함)

### PATCH /api/books/{bookId}
**설명**: 도서 정보 수정 (manage_books 권한 필요)

**Request Body**: POST와 동일 + status 필드 (선택적)

### DELETE /api/books/{bookId}
**설명**: 도서 삭제 (manage_books 권한 필요)

**Note**: 대출 중인 도서는 삭제 불가

**성공 응답**: 204 No Content

### POST /api/books/{bookId}/borrow
**설명**: 도서 대출 (borrow_book 권한 필요)

**Path Parameter**:
- `bookId`: 도서 ID (숫자)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| returnDate | string | ✅ | ISO 8601 datetime | 반납 예정일 |

**예제 요청**:
```json
{
  "returnDate": "2025-10-01T00:00:00.000Z"
}
```

**성공 응답 (200 OK)**: 대출 정보

### POST /api/books/{bookId}/return
**설명**: 도서 반납 (return_book 권한 필요)

**Path Parameter**:
- `bookId`: 도서 ID (숫자)

**성공 응답 (200 OK)**:
```json
{
  "message": "Book returned successfully",
  "book": {...},
  "wasOverdue": false
}
```

---

## 회비 관리 (Fees)

### GET /api/fees
**설명**: 회비 목록 조회 (view_fees 권한 필요)

**Query Parameters** (선택적):
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| page | number | 페이지 번호 (기본값: 1) |
| limit | number | 페이지당 항목 수 (기본값: 20) |
| status | string | 상태별 필터링 (unpaid, paid, overdue) |
| year | number | 연도별 필터링 |
| semester | string | 학기별 필터링 |
| userId | number | 특정 사용자 필터링 |

**성공 응답 (200 OK)**:
```json
{
  "fees": [
    {
      "id": 1,
      "amount": "50000",
      "semester": "spring",
      "year": 2025,
      "status": "paid",
      "paidAt": "2025-03-05T00:00:00.000Z",
      "user": {
        "id": 2,
        "name": "홍길동",
        "email": "hong@example.com"
      }
    }
  ],
  "statistics": {
    "totalAmount": 1000000,
    "paidAmount": 750000,
    "unpaidAmount": 250000,
    "totalCount": 20,
    "paidCount": 15,
    "unpaidCount": 5
  },
  "pagination": {...}
}
```

### POST /api/fees
**설명**: 회비 청구 생성 (manage_fees 권한 필요)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| userId | number | ✅ | 양의 정수 | 사용자 ID |
| amount | number | ✅ | 양수 | 금액 |
| semester | string | ✅ | 최소 1자, 최대 20자 | 학기 |
| year | number | ✅ | 2000-2100 | 연도 |

**예제 요청**:
```json
{
  "userId": 2,
  "amount": 50000,
  "semester": "spring",
  "year": 2025
}
```

### GET /api/fees/{feeId}
**설명**: 회비 상세 조회

**Path Parameter**:
- `feeId`: 회비 ID (숫자)

### PATCH /api/fees/{feeId}
**설명**: 회비 상태 수정 (manage_fees 권한 필요)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| amount | number | ❌ | 양수 | 금액 |
| status | string | ❌ | enum: unpaid, paid, overdue | 상태 |
| paidAt | string | ❌ | ISO 8601 datetime | 납부일시 |

### GET /api/users/me/fees
**설명**: 내 회비 현황 조회 (view_own_fees 권한 필요)

**Query Parameters**: GET /api/fees와 동일 (userId 제외)

**성공 응답**: 본인 회비 정보 및 통계

---

## 평가 관리 (Evaluations)

### GET /api/evaluations
**설명**: 평가 목록 조회 (view_evaluations 권한 필요)

**Query Parameters** (선택적):
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| page | number | 페이지 번호 (기본값: 1) |
| limit | number | 페이지당 항목 수 (기본값: 20) |
| year | number | 연도별 필터링 |
| semester | string | 학기별 필터링 |
| userId | number | 피평가자 ID |
| evaluatorId | number | 평가자 ID |

**성공 응답 (200 OK)**:
```json
{
  "evaluations": [
    {
      "id": 1,
      "semester": "spring",
      "year": 2025,
      "score": "4.5",
      "comments": "우수한 활동 참여",
      "user": {
        "id": 2,
        "name": "홍길동"
      },
      "evaluator": {
        "id": 1,
        "name": "관리자"
      }
    }
  ],
  "statistics": {
    "averageScore": 4.2,
    "minScore": 3.0,
    "maxScore": 5.0,
    "totalCount": 50
  },
  "pagination": {...}
}
```

### POST /api/evaluations
**설명**: 평가 생성 (manage_evaluations 권한 필요)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| userId | number | ✅ | 양의 정수 | 피평가자 ID |
| semester | string | ✅ | 최소 1자, 최대 20자 | 학기 |
| year | number | ✅ | 2000-2100 | 연도 |
| score | number | ✅ | 0-5 | 평가 점수 |
| comments | string | ❌ | - | 평가 코멘트 |

**예제 요청**:
```json
{
  "userId": 2,
  "semester": "spring",
  "year": 2025,
  "score": 4.5,
  "comments": "적극적인 참여와 우수한 성과"
}
```

### GET /api/evaluations/{evaluationId}
**설명**: 평가 상세 조회

**Path Parameter**:
- `evaluationId`: 평가 ID (숫자)

### PATCH /api/evaluations/{evaluationId}
**설명**: 평가 수정 (manage_evaluations 권한 필요, 작성자만 가능)

**Request Body (JSON)**:
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| score | number | ❌ | 0-5 | 평가 점수 |
| comments | string | ❌ | - | 평가 코멘트 |

### GET /api/users/me/evaluations
**설명**: 내 평가 조회 (view_own_evaluations 권한 필요)

**Query Parameters**: GET /api/evaluations와 동일 (userId 제외)

**성공 응답 (200 OK)**:
```json
{
  "evaluations": [...],
  "statistics": {
    "averageScore": 4.3,
    "minScore": 3.5,
    "maxScore": 5.0,
    "totalCount": 6
  },
  "trend": {
    "direction": "up",
    "difference": 0.5
  },
  "pagination": {...}
}
```

---

## 파일 관리 (Files)

### POST /api/files/upload
**설명**: 파일 업로드 (upload_file 권한 필요)

**Request**: multipart/form-data
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| file | File | ✅ | 최대 10MB (환경변수 설정 가능) | 업로드할 파일 |
| purpose | string | ✅ | enum: profile, document, attachment, other | 파일 용도 |
| description | string | ❌ | - | 파일 설명 |

**예제 요청**: FormData 사용
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('purpose', 'document');
formData.append('description', '회의록 문서');
```

**성공 응답 (201 Created)**:
```json
{
  "id": 1,
  "filename": "550e8400-e29b-41d4-a716-446655440000.pdf",
  "originalName": "meeting_notes.pdf",
  "mimetype": "application/pdf",
  "size": 204800,
  "purpose": "document",
  "uploadedAt": "2025-09-17T10:30:00.000Z",
  "uploader": {
    "id": 1,
    "name": "홍길동"
  }
}
```

### GET /api/files
**설명**: 파일 목록 조회 (view_files 또는 view_own_files 권한 필요)

**Query Parameters** (선택적):
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| page | number | 페이지 번호 (기본값: 1) |
| limit | number | 페이지당 항목 수 (기본값: 10) |
| purpose | string | 파일 용도로 필터링 |
| uploaderId | number | 업로더 ID로 필터링 |

**Note**:
- view_files 권한이 있으면 모든 파일 조회 가능
- view_own_files 권한만 있으면 본인이 업로드한 파일만 조회 가능

**예제 요청**: `/api/files?page=1&limit=10&purpose=document`

**성공 응답 (200 OK)**:
```json
{
  "files": [
    {
      "id": 1,
      "filename": "550e8400-e29b-41d4-a716-446655440000.pdf",
      "originalName": "meeting_notes.pdf",
      "mimetype": "application/pdf",
      "size": 204800,
      "purpose": "document",
      "uploadedAt": "2025-09-17T10:30:00.000Z",
      "uploader": {
        "id": 1,
        "name": "홍길동",
        "email": "hong@example.com"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### GET /api/files/{fileId}
**설명**: 파일 정보 조회 (view_files 또는 view_own_files 권한 필요)

**Path Parameter**:
- `fileId`: 파일 ID (숫자)

**성공 응답 (200 OK)**:
```json
{
  "id": 1,
  "filename": "550e8400-e29b-41d4-a716-446655440000.pdf",
  "originalName": "meeting_notes.pdf",
  "mimetype": "application/pdf",
  "size": 204800,
  "purpose": "document",
  "uploadedAt": "2025-09-17T10:30:00.000Z",
  "uploader": {
    "id": 1,
    "name": "홍길동",
    "email": "hong@example.com"
  }
}
```

### GET /api/files/{fileId}/download
**설명**: 파일 다운로드 (download_file 권한 필요)

**Path Parameter**:
- `fileId`: 파일 ID (숫자)

**성공 응답 (200 OK)**:
- Content-Type: 파일의 MIME 타입
- Content-Disposition: attachment; filename="원본파일명"
- 바이너리 파일 데이터

### DELETE /api/files/{fileId}
**설명**: 파일 삭제 (delete_own_file 또는 delete_any_file 권한 필요)

**Path Parameter**:
- `fileId`: 파일 ID (숫자)

**Note**:
- delete_any_file 권한이 있으면 모든 파일 삭제 가능
- delete_own_file 권한만 있으면 본인이 업로드한 파일만 삭제 가능

**성공 응답 (200 OK)**:
```json
{
  "message": "File deleted successfully"
}
```

---

## 공통 에러 응답

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## 인증 방식

모든 인증이 필요한 API는 HttpOnly 쿠키에 저장된 JWT 토큰을 사용합니다. 로그인 시 자동으로 쿠키가 설정되며, 이후 모든 요청에 자동으로 포함됩니다.

### 권한 레벨
- **Public**: 인증 불필요
- **User**: 로그인 필요
- **Admin**: 관리자 권한 필요

---

## 참고사항

1. **날짜 형식**: 모든 날짜는 ISO 8601 형식 (예: `2025-09-17T00:00:00.000Z`)
2. **ID 타입**: 모든 ID는 정수형 (number)
3. **문자열 인코딩**: UTF-8
4. **Content-Type**: 모든 요청/응답은 `application/json`
5. **HTTP 메서드**: RESTful 원칙 준수
   - GET: 조회
   - POST: 생성
   - PATCH: 부분 수정
   - DELETE: 삭제