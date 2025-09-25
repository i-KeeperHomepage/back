# i-Keeper API 사용 가이드

## 목차
- [개요](#개요)
- [인증 API](#인증-api)
- [사용자 관리 API](#사용자-관리-api)
- [관리자 API](#관리자-api)
- [게시물 API](#게시물-api)
- [댓글 API](#댓글-api)
- [파일 관리 API](#파일-관리-api)
- [회비 관리 API](#회비-관리-api)
- [도서 관리 API](#도서-관리-api)
- [행사 관리 API](#행사-관리-api)
- [출석 관리 API](#출석-관리-api)
- [평가 관리 API](#평가-관리-api)
- [수상 경력 API](#수상-경력-api)
- [교육 이력 API](#교육-이력-api)
- [카테고리 API](#카테고리-api)
- [청소 관리 API](#청소-관리-api)

## 개요

### 인증 방식
- **JWT 토큰 기반 인증**
- 토큰은 HttpOnly 쿠키로 저장
- 로그인 성공 시 토큰 자동 발급
- 모든 인증이 필요한 API는 자동으로 쿠키의 토큰 검증

### 요청 형식
- **Content-Type**: `application/json` (파일 업로드 제외)
- **Base URL**: `http://localhost:3000/api`

### 응답 형식
```json
// 성공 응답
{
  "data": { ... },
  "message": "Success"
}

// 에러 응답
{
  "error": "Error message",
  "details": { ... }  // 선택적
}
```

### HTTP 상태 코드
- `200`: 성공
- `201`: 리소스 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 오류

---

## 인증 API

### 1. 회원가입
**POST** `/api/auth/register`

**요청 본문:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "major": "컴퓨터공학과",
  "class": "3/2"  // 학년/학기 형식
}
```

**응답:** `201 Created`
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "홍길동",
  "status": "pending_approval"
}
```

**참고:**
- 가입 후 상태는 `pending_approval` (승인 대기)
- 관리자 승인 후 로그인 가능

### 2. 로그인
**POST** `/api/auth/login`

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
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "role": {
      "id": 2,
      "name": "member"
    }
  },
  "message": "Login successful"
}
```

### 3. 로그아웃
**POST** `/api/auth/logout`

**응답:** `200 OK`
```json
{
  "message": "Logout successful"
}
```

---

## 사용자 관리 API

### 1. 내 정보 조회
**GET** `/api/users/me`

**응답:** `200 OK`
```json
{
  "id": 1,
  "name": "홍길동",
  "email": "user@example.com",
  "major": "컴퓨터공학과",
  "class": "3/2",
  "status": "active",
  "profileImage": {
    "id": 5,
    "filename": "profile.jpg",
    "path": "/uploads/profile.jpg"
  },
  "signatureImage": {
    "id": 3,
    "filename": "signature.png",
    "path": "/uploads/signature.png"
  },
  "role": {
    "id": 2,
    "name": "member",
    "permissions": [...]
  }
}
```

### 2. 내 정보 수정
**PATCH** `/api/users/me`

**요청 본문:**
```json
{
  "name": "홍길동",
  "email": "newemail@example.com",
  "major": "소프트웨어학과",
  "class": "4/1",
  "profileImageId": 10  // 프로필 이미지 파일 ID
}
```

**응답:** `200 OK`

### 3. 비밀번호 변경
**PATCH** `/api/users/me/password`

**요청 본문:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**응답:** `200 OK`

### 4. 내 출석 기록 조회
**GET** `/api/users/me/attendance`

**쿼리 파라미터:**
- `eventId`: 특정 행사의 출석 기록만 조회

**응답:** `200 OK`
```json
[
  {
    "id": 1,
    "status": "present",
    "checkInAt": "2024-01-15T10:30:00Z",
    "event": {
      "id": 1,
      "title": "정기 회의",
      "startDate": "2024-01-15T10:00:00Z"
    }
  }
]
```

### 5. 내 회비 납부 내역
**GET** `/api/users/me/fees`

**응답:** `200 OK`
```json
[
  {
    "id": 1,
    "amount": 50000,
    "date": "2024-01-01",
    "status": "paid",
    "paidAt": "2024-01-05T09:00:00Z"
  }
]
```

### 6. 내 평가 기록
**GET** `/api/users/me/evaluations`

**응답:** `200 OK`
```json
[
  {
    "id": 1,
    "semester": "1학기",
    "year": 2024,
    "score": 4.5,
    "comments": "우수한 참여도"
  }
]
```

### 7. 내 수상 경력
**GET** `/api/users/me/awards`

**응답:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "우수 프로젝트상",
    "description": "2024년 봄학기 우수 프로젝트",
    "evidenceFile": {
      "id": 15,
      "filename": "award.pdf",
      "path": "/uploads/award.pdf"
    }
  }
]
```

### 8. 내 교육 이력
**GET** `/api/users/me/education`

**응답:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "웹 개발 부트캠프",
    "description": "React와 Node.js를 활용한 풀스택 개발",
    "evidenceFile": {
      "id": 20,
      "filename": "certificate.pdf",
      "path": "/uploads/certificate.pdf"
    }
  }
]
```

---

## 관리자 API

### 1. 가입 승인 대기 목록
**GET** `/api/admin/pending-users`

**필요 권한:** `view_pending_users`

**응답:** `200 OK`
```json
[
  {
    "id": 5,
    "email": "newuser@example.com",
    "name": "김철수",
    "major": "컴퓨터공학과",
    "class": "2/1",
    "status": "pending_approval",
    "createdAt": "2024-01-10T09:00:00Z"
  }
]
```

### 2. 사용자 승인/거절
**PATCH** `/api/admin/users/{userId}/approve`

**필요 권한:** `approve_users`

**요청 본문:**
```json
{
  "approve": true  // true: 승인, false: 거절
}
```

**응답:** `200 OK`

### 3. 전체 사용자 목록
**GET** `/api/admin/users`

**필요 권한:** `view_all_users`

**쿼리 파라미터:**
- `status`: 사용자 상태 필터 (active, inactive, pending_approval, withdrawn)
- `roleId`: 역할 ID로 필터
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)

**응답:** `200 OK`
```json
{
  "users": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 4. 사용자 정보 수정
**PATCH** `/api/admin/users/{userId}`

**필요 권한:** `update_user`

**요청 본문:**
```json
{
  "status": "active",
  "roleId": 2
}
```

**응답:** `200 OK`

### 5. 사용자 삭제
**DELETE** `/api/admin/users/{userId}`

**필요 권한:** `delete_user`

**응답:** `200 OK`

### 6. 역할 목록 조회
**GET** `/api/admin/roles`

**필요 권한:** `view_roles`

**응답:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "admin",
    "description": "시스템 관리자",
    "_count": {
      "users": 2
    }
  }
]
```

### 7. 역할 생성
**POST** `/api/admin/roles`

**필요 권한:** `create_role`

**요청 본문:**
```json
{
  "name": "moderator",
  "description": "중간 관리자",
  "permissionIds": [1, 2, 3, 4]
}
```

**응답:** `201 Created`

### 8. 역할 양도
**POST** `/api/admin/roles/transfer`

**필요 권한:** `transfer_role`

**요청 본문:**
```json
{
  "fromUserId": 1,
  "toUserId": 2,
  "roleId": 1
}
```

**응답:** `200 OK`

---

## 게시물 API

### 1. 게시물 목록 조회
**GET** `/api/posts`

**쿼리 파라미터:**
- `categoryId`: 카테고리 ID로 필터
- `authorId`: 작성자 ID로 필터
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)

**응답:** `200 OK`
```json
{
  "posts": [
    {
      "id": 1,
      "title": "공지사항",
      "content": "내용...",
      "createdAt": "2024-01-15T10:00:00Z",
      "author": {
        "id": 1,
        "name": "관리자"
      },
      "category": {
        "id": 1,
        "name": "공지"
      },
      "files": [
        {
          "file": {
            "id": 10,
            "filename": "document.pdf",
            "originalName": "회의록.pdf",
            "mimetype": "application/pdf",
            "size": 2048576,
            "path": "/uploads/document.pdf"
          }
        }
      ],
      "_count": {
        "comments": 5
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### 2. 게시물 생성
**POST** `/api/posts`

**필요 권한:** `create_post`

**요청 본문:**
```json
{
  "title": "새 게시물",
  "content": "게시물 내용입니다.",
  "categoryId": 1,
  "fileIds": [10, 11, 12]  // 첨부 파일 ID 배열 (선택적)
}
```

**응답:** `201 Created`

### 3. 게시물 상세 조회
**GET** `/api/posts/{postId}`

**응답:** `200 OK`
```json
{
  "id": 1,
  "title": "게시물 제목",
  "content": "상세 내용...",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z",
  "author": {
    "id": 1,
    "name": "작성자",
    "email": "author@example.com"
  },
  "category": {
    "id": 1,
    "name": "공지"
  },
  "files": [
    {
      "file": {
        "id": 10,
        "filename": "attachment.pdf",
        "originalName": "자료.pdf",
        "mimetype": "application/pdf",
        "size": 1048576,
        "path": "/uploads/attachment.pdf"
      }
    }
  ],
  "comments": [...]
}
```

### 4. 게시물 수정
**PATCH** `/api/posts/{postId}`

**필요 권한:** `edit_own_post` (본인 게시물) 또는 `edit_any_post`

**요청 본문:**
```json
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "categoryId": 2,
  "fileIds": [13, 14]  // 파일 교체 (선택적)
}
```

**응답:** `200 OK`

### 5. 게시물 삭제
**DELETE** `/api/posts/{postId}`

**필요 권한:** `delete_own_post` (본인 게시물) 또는 `delete_any_post`

**응답:** `200 OK`

---

## 댓글 API

### 1. 댓글 목록 조회
**GET** `/api/posts/{postId}/comments`

**응답:** `200 OK`
```json
[
  {
    "id": 1,
    "content": "댓글 내용",
    "createdAt": "2024-01-15T11:00:00Z",
    "author": {
      "id": 2,
      "name": "댓글 작성자"
    }
  }
]
```

### 2. 댓글 작성
**POST** `/api/posts/{postId}/comments`

**필요 권한:** `create_comment`

**요청 본문:**
```json
{
  "content": "새 댓글 내용"
}
```

**응답:** `201 Created`

---

## 파일 관리 API

### 1. 파일 업로드
**POST** `/api/files/upload`

**필요 권한:** `upload_file`

**요청 형식:** `multipart/form-data`

**Form 필드:**
- `file`: 업로드할 파일
- `purpose`: 파일 용도 (profile, document, attachment, other)

**응답:** `201 Created`
```json
{
  "id": 15,
  "filename": "uuid-generated.pdf",
  "originalName": "원본파일명.pdf",
  "mimetype": "application/pdf",
  "size": 2048576,
  "path": "/uploads/uuid-generated.pdf"
}
```

**제한사항:**
- 최대 파일 크기: 10MB
- 허용 파일 형식: jpeg, png, gif, pdf, doc, docx, xls, xlsx, txt

### 2. 파일 목록 조회
**GET** `/api/files`

**필요 권한:** `view_files` (전체) 또는 `view_own_files` (본인 파일만)

**쿼리 파라미터:**
- `purpose`: 파일 용도로 필터
- `uploaderId`: 업로더 ID로 필터
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수

**응답:** `200 OK`

### 3. 파일 정보 조회
**GET** `/api/files/{fileId}`

**필요 권한:** `view_files` 또는 `view_own_files`

**응답:** `200 OK`

### 4. 파일 다운로드
**GET** `/api/files/{fileId}/download`

**필요 권한:** `download_file`

**응답:** 파일 스트림

### 5. 파일 삭제
**DELETE** `/api/files/{fileId}`

**필요 권한:** `delete_own_file` (본인 파일) 또는 `delete_any_file`

**응답:** `200 OK`

---

## 회비 관리 API

### 1. 회비 목록 조회
**GET** `/api/fees`

**필요 권한:** `view_fees`

**쿼리 파라미터:**
- `status`: 납부 상태 (paid, unpaid)
- `userId`: 사용자 ID로 필터
- `dateFrom`: 시작 날짜 (ISO 8601)
- `dateTo`: 종료 날짜 (ISO 8601)
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수

**응답:** `200 OK`

### 2. 회비 생성
**POST** `/api/fees`

**필요 권한:** `manage_fees`

**요청 본문:**
```json
{
  "userId": 5,
  "amount": 50000,
  "date": "2024-03-01"
}
```

**응답:** `201 Created`

### 3. 회비 정보 수정
**PATCH** `/api/fees/{feeId}`

**필요 권한:** `manage_fees` 또는 `pay_fee` (납부 처리만)

**요청 본문:**
```json
{
  "amount": 60000,
  "status": "paid",
  "paidAt": "2024-03-05T10:00:00Z"
}
```

**응답:** `200 OK`

### 4. 회비 삭제
**DELETE** `/api/fees/{feeId}`

**필요 권한:** `manage_fees`

**응답:** `200 OK`

---

## 도서 관리 API

### 1. 도서 목록 조회
**GET** `/api/books`

**필요 권한:** `view_books`

**쿼리 파라미터:**
- `status`: 대출 상태 (available, borrowed)
- `search`: 제목/저자/출판사 검색
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수

**응답:** `200 OK`
```json
{
  "books": [
    {
      "id": 1,
      "title": "클린 코드",
      "author": "로버트 마틴",
      "publisher": "인사이트",
      "isbn": "9788966260959",
      "location": "A-1-3",
      "status": "available"
    }
  ],
  "pagination": {...}
}
```

### 2. 도서 추가
**POST** `/api/books`

**필요 권한:** `manage_books`

**요청 본문:**
```json
{
  "title": "리팩토링",
  "author": "마틴 파울러",
  "publisher": "한빛미디어",
  "isbn": "9788968480850",
  "location": "A-2-1"
}
```

**응답:** `201 Created`

### 3. 도서 정보 조회
**GET** `/api/books/{bookId}`

**필요 권한:** `view_books`

**응답:** `200 OK`

### 4. 도서 정보 수정
**PATCH** `/api/books/{bookId}`

**필요 권한:** `manage_books`

**응답:** `200 OK`

### 5. 도서 대출
**POST** `/api/books/{bookId}/borrow`

**필요 권한:** `borrow_book`

**요청 본문:**
```json
{
  "returnDate": "2024-02-01"  // 반납 예정일
}
```

**응답:** `200 OK`

### 6. 도서 반납
**POST** `/api/books/{bookId}/return`

**필요 권한:** `return_book`

**응답:** `200 OK`

### 7. 도서 삭제
**DELETE** `/api/books/{bookId}`

**필요 권한:** `manage_books`

**응답:** `200 OK`

---

## 행사 관리 API

### 1. 행사 목록 조회
**GET** `/api/events`

**필요 권한:** `view_events`

**쿼리 파라미터:**
- `eventType`: 행사 유형
- `from`: 시작 날짜
- `to`: 종료 날짜
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수

**응답:** `200 OK`
```json
{
  "events": [
    {
      "id": 1,
      "title": "정기 회의",
      "description": "월간 정기 회의",
      "startDate": "2024-02-01T14:00:00Z",
      "endDate": "2024-02-01T16:00:00Z",
      "location": "회의실 A",
      "eventType": "meeting"
    }
  ],
  "pagination": {...}
}
```

### 2. 행사 생성
**POST** `/api/events`

**필요 권한:** `manage_events`

**요청 본문:**
```json
{
  "title": "워크샵",
  "description": "봄학기 워크샵",
  "startDate": "2024-03-15T09:00:00Z",
  "endDate": "2024-03-15T18:00:00Z",
  "location": "강당",
  "eventType": "workshop"
}
```

**응답:** `201 Created`

### 3. 행사 상세 조회
**GET** `/api/events/{eventId}`

**필요 권한:** `view_events`

**응답:** `200 OK`

### 4. 행사 정보 수정
**PATCH** `/api/events/{eventId}`

**필요 권한:** `manage_events`

**응답:** `200 OK`

### 5. 행사 삭제
**DELETE** `/api/events/{eventId}`

**필요 권한:** `manage_events`

**응답:** `200 OK`

---

## 출석 관리 API

### 1. 행사 출석 명단 조회
**GET** `/api/events/{eventId}/attendance`

**필요 권한:** `view_attendance`

**응답:** `200 OK`
```json
[
  {
    "id": 1,
    "status": "present",
    "checkInAt": "2024-02-01T14:05:00Z",
    "user": {
      "id": 5,
      "name": "홍길동",
      "email": "hong@example.com"
    }
  }
]
```

### 2. 출석 체크
**POST** `/api/events/{eventId}/attendance`

**필요 권한:** `check_in` (본인) 또는 `manage_attendance`

**요청 본문:**
```json
{
  "userId": 5,  // 관리자만 다른 사용자 지정 가능
  "status": "present"  // present, late, absent, excused
}
```

**응답:** `201 Created`

---

## 평가 관리 API

### 1. 평가 목록 조회
**GET** `/api/evaluations`

**필요 권한:** `view_evaluations`

**쿼리 파라미터:**
- `userId`: 사용자 ID로 필터
- `semester`: 학기 필터
- `year`: 연도 필터

**응답:** `200 OK`
```json
[
  {
    "id": 1,
    "userId": 5,
    "semester": "1학기",
    "year": 2024,
    "score": 4.5,
    "comments": "우수한 활동",
    "user": {
      "id": 5,
      "name": "홍길동"
    }
  }
]
```

### 2. 평가 생성
**POST** `/api/evaluations`

**필요 권한:** `manage_evaluations`

**요청 본문:**
```json
{
  "userId": 5,
  "semester": "1학기",
  "year": 2024,
  "score": 4.5,
  "comments": "적극적인 참여"
}
```

**응답:** `201 Created`

### 3. 평가 수정
**PATCH** `/api/evaluations/{evaluationId}`

**필요 권한:** `manage_evaluations`

**응답:** `200 OK`

### 4. 평가 삭제
**DELETE** `/api/evaluations/{evaluationId}`

**필요 권한:** `manage_evaluations`

**응답:** `200 OK`

---

## 수상 경력 API

### 1. 수상 경력 목록 조회
**GET** `/api/awards`

**필요 권한:** `view_all_awards` (전체) 또는 `view_own_awards` (본인)

**응답:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "최우수상",
    "description": "2024년 프로젝트 경진대회",
    "evidenceFile": {
      "id": 20,
      "filename": "award.pdf",
      "originalName": "상장.pdf"
    },
    "user": {
      "id": 5,
      "name": "홍길동"
    }
  }
]
```

### 2. 수상 경력 추가
**POST** `/api/awards`

**필요 권한:** `create_own_award` (본인) 또는 `create_any_award`

**요청 본문:**
```json
{
  "userId": 5,  // 관리자만 다른 사용자 지정 가능
  "title": "우수상",
  "description": "해커톤 대회",
  "evidenceFileId": 25  // 증빙 파일 ID (선택적)
}
```

**응답:** `201 Created`

### 3. 수상 경력 상세 조회
**GET** `/api/awards/{awardId}`

**필요 권한:** `view_awards`

**응답:** `200 OK`

### 4. 수상 경력 수정
**PATCH** `/api/awards/{awardId}`

**필요 권한:** `update_own_award` (본인) 또는 `update_any_award`

**응답:** `200 OK`

### 5. 수상 경력 삭제
**DELETE** `/api/awards/{awardId}`

**필요 권한:** `delete_own_award` (본인) 또는 `delete_any_award`

**응답:** `200 OK`

---

## 교육 이력 API

### 1. 교육 이력 목록 조회
**GET** `/api/education`

**필요 권한:** `view_all_education` (전체) 또는 `view_own_education` (본인)

**응답:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "AWS 클라우드 교육",
    "description": "AWS 공인 교육 과정",
    "evidenceFile": {
      "id": 30,
      "filename": "certificate.pdf",
      "originalName": "수료증.pdf"
    },
    "user": {
      "id": 5,
      "name": "홍길동"
    }
  }
]
```

### 2. 교육 이력 추가
**POST** `/api/education`

**필요 권한:** `create_own_education` (본인) 또는 `create_any_education`

**요청 본문:**
```json
{
  "userId": 5,  // 관리자만 다른 사용자 지정 가능
  "title": "Docker 실무 교육",
  "description": "컨테이너 기술 심화 과정",
  "evidenceFileId": 35  // 증빙 파일 ID (선택적)
}
```

**응답:** `201 Created`

### 3. 교육 이력 상세 조회
**GET** `/api/education/{educationId}`

**필요 권한:** `view_education`

**응답:** `200 OK`

### 4. 교육 이력 수정
**PATCH** `/api/education/{educationId}`

**필요 권한:** `update_own_education` (본인) 또는 `update_any_education`

**응답:** `200 OK`

### 5. 교육 이력 삭제
**DELETE** `/api/education/{educationId}`

**필요 권한:** `delete_own_education` (본인) 또는 `delete_any_education`

**응답:** `200 OK`

---

## 카테고리 API

### 1. 카테고리 목록 조회
**GET** `/api/categories`

**필요 권한:** `view_categories`

**응답:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "공지사항",
    "description": "중요 공지사항",
    "_count": {
      "posts": 25
    }
  },
  {
    "id": 2,
    "name": "자유게시판",
    "description": "자유로운 소통 공간",
    "_count": {
      "posts": 150
    }
  }
]
```

### 2. 카테고리 생성
**POST** `/api/categories`

**필요 권한:** `create_category`

**요청 본문:**
```json
{
  "name": "기술 블로그",
  "description": "기술 관련 글 공유"
}
```

**응답:** `201 Created`

---

## 청소 관리 API

### 1. 청소 일정 목록 조회
**GET** `/api/cleanings`

**필요 권한:** `view_cleanings`

**쿼리 파라미터:**
- `dateFrom`: 시작 날짜 (ISO 8601)
- `dateTo`: 종료 날짜 (ISO 8601)
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)

**응답:** `200 OK`
```json
{
  "cleanings": [
    {
      "id": 1,
      "date": "2024-03-01",
      "description": "정기 청소",
      "createdAt": "2024-02-25T10:00:00Z",
      "updatedAt": "2024-02-25T10:00:00Z",
      "cleaners": [
        {
          "cleaningId": 1,
          "userId": 5,
          "user": {
            "id": 5,
            "name": "홍길동",
            "email": "hong@example.com",
            "major": "컴퓨터공학과",
            "class": "3/2"
          }
        }
      ]
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 2. 청소 일정 생성
**POST** `/api/cleanings`

**필요 권한:** `create_cleaning`

**요청 본문:**
```json
{
  "date": "2024-03-01T00:00:00Z",
  "description": "3월 정기 청소",
  "userIds": [5, 6, 7]
}
```

**응답:** `201 Created`
```json
{
  "id": 1,
  "date": "2024-03-01",
  "description": "3월 정기 청소",
  "cleaners": [
    {
      "user": {
        "id": 5,
        "name": "홍길동"
      }
    }
  ]
}
```

### 3. 청소 일정 상세 조회
**GET** `/api/cleanings/{cleaningId}`

**필요 권한:** `view_cleanings`

**응답:** `200 OK`
```json
{
  "id": 1,
  "date": "2024-03-01",
  "description": "3월 정기 청소",
  "createdAt": "2024-02-25T10:00:00Z",
  "updatedAt": "2024-02-25T10:00:00Z",
  "cleaners": [
    {
      "cleaningId": 1,
      "userId": 5,
      "user": {
        "id": 5,
        "name": "홍길동",
        "email": "hong@example.com",
        "major": "컴퓨터공학과",
        "class": "3/2"
      }
    }
  ]
}
```

### 4. 청소 일정 수정
**PATCH** `/api/cleanings/{cleaningId}`

**필요 권한:** `update_cleaning`

**요청 본문:**
```json
{
  "date": "2024-03-02T00:00:00Z",  // 선택적
  "description": "변경된 설명",     // 선택적
  "userIds": [5, 8, 9]             // 선택적, 청소 인원 변경
}
```

**응답:** `200 OK`

### 5. 청소 일정 삭제
**DELETE** `/api/cleanings/{cleaningId}`

**필요 권한:** `delete_cleaning`

**응답:** `200 OK`
```json
{
  "message": "Cleaning schedule deleted successfully"
}
```

---

## 권한 목록

시스템의 모든 권한은 역할(Role) 기반으로 관리됩니다.

### 사용자 관리 권한
- `view_pending_users`: 가입 대기 사용자 조회
- `approve_users`: 사용자 가입 승인/거절
- `view_all_users`: 전체 사용자 목록 조회
- `view_user_details`: 사용자 상세 정보 조회
- `update_user`: 사용자 정보 수정
- `delete_user`: 사용자 삭제

### 역할 관리 권한
- `view_roles`: 역할 목록 조회
- `create_role`: 역할 생성
- `transfer_role`: 역할 양도

### 게시물 권한
- `create_post`: 게시물 작성
- `edit_own_post`: 본인 게시물 수정
- `edit_any_post`: 모든 게시물 수정
- `delete_own_post`: 본인 게시물 삭제
- `delete_any_post`: 모든 게시물 삭제
- `view_posts`: 게시물 조회

### 댓글 권한
- `create_comment`: 댓글 작성
- `view_comments`: 댓글 조회

### 카테고리 권한
- `view_categories`: 카테고리 조회
- `create_category`: 카테고리 생성
- `update_category`: 카테고리 수정
- `delete_category`: 카테고리 삭제

### 도서 권한
- `view_books`: 도서 목록 조회
- `manage_books`: 도서 관리 (추가/수정/삭제)
- `borrow_book`: 도서 대출
- `return_book`: 도서 반납

### 회비 권한
- `view_fees`: 회비 목록 조회
- `manage_fees`: 회비 관리
- `view_own_fees`: 본인 회비 조회
- `pay_fee`: 회비 납부 처리

### 행사 권한
- `view_events`: 행사 목록 조회
- `manage_events`: 행사 관리

### 출석 권한
- `view_attendance`: 출석 기록 조회
- `manage_attendance`: 출석 관리
- `check_in`: 출석 체크
- `view_own_attendance`: 본인 출석 기록 조회

### 평가 권한
- `view_evaluations`: 평가 기록 조회
- `manage_evaluations`: 평가 관리
- `view_own_evaluations`: 본인 평가 조회

### 파일 권한
- `upload_file`: 파일 업로드
- `view_files`: 모든 파일 조회
- `view_own_files`: 본인 파일 조회
- `delete_own_file`: 본인 파일 삭제
- `delete_any_file`: 모든 파일 삭제
- `download_file`: 파일 다운로드

### 수상 경력 권한
- `view_all_awards`: 모든 수상 경력 조회
- `view_awards`: 수상 경력 조회
- `view_own_awards`: 본인 수상 경력 조회
- `create_own_award`: 본인 수상 경력 추가
- `update_own_award`: 본인 수상 경력 수정
- `delete_own_award`: 본인 수상 경력 삭제
- `create_any_award`: 모든 사용자 수상 경력 추가
- `update_any_award`: 모든 수상 경력 수정
- `delete_any_award`: 모든 수상 경력 삭제

### 교육 이력 권한
- `view_all_education`: 모든 교육 이력 조회
- `view_education`: 교육 이력 조회
- `view_own_education`: 본인 교육 이력 조회
- `create_own_education`: 본인 교육 이력 추가
- `update_own_education`: 본인 교육 이력 수정
- `delete_own_education`: 본인 교육 이력 삭제
- `create_any_education`: 모든 사용자 교육 이력 추가
- `update_any_education`: 모든 교육 이력 수정
- `delete_any_education`: 모든 교육 이력 삭제

### 청소 관리 권한
- `view_cleanings`: 청소 일정 조회
- `create_cleaning`: 청소 일정 생성
- `update_cleaning`: 청소 일정 수정
- `delete_cleaning`: 청소 일정 삭제

---

## 기본 역할

### 1. admin (관리자)
- 모든 권한 보유
- 시스템 전체 관리

### 2. member (정회원)
- 기본적인 읽기/쓰기 권한
- 본인 정보 관리
- 게시물/댓글 작성
- 도서 대출
- 행사 참여

### 3. non-member (준회원)
- 제한적인 읽기 권한
- 가입 승인 대기 상태의 기본 역할

---

## 에러 처리

모든 API는 일관된 에러 응답 형식을 사용합니다.

### 에러 응답 형식
```json
{
  "error": "에러 메시지",
  "details": {
    // 추가 정보 (선택적)
  }
}
```

### 주요 에러 코드
- **400 Bad Request**: 잘못된 요청 (유효성 검사 실패 등)
- **401 Unauthorized**: 인증되지 않은 사용자
- **403 Forbidden**: 권한 없음
- **404 Not Found**: 리소스를 찾을 수 없음
- **409 Conflict**: 중복된 리소스 (이메일 중복 등)
- **500 Internal Server Error**: 서버 내부 오류

### 유효성 검사 에러 예시
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## 페이지네이션

목록 조회 API는 페이지네이션을 지원합니다.

### 요청 파라미터
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: API마다 다름)

### 응답 형식
```json
{
  "data": [...],
  "pagination": {
    "total": 100,      // 전체 항목 수
    "page": 1,         // 현재 페이지
    "limit": 20,       // 페이지당 항목 수
    "totalPages": 5    // 전체 페이지 수
  }
}
```

---

## 파일 업로드 가이드

### 1. 파일 업로드 프로세스
1. `/api/files/upload`로 파일 업로드
2. 응답으로 받은 파일 ID 저장
3. 해당 파일 ID를 다른 API에서 참조

### 2. 파일 업로드 예시 (JavaScript)
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('purpose', 'document');

const response = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include'  // 쿠키 포함
});

const fileData = await response.json();
// fileData.id를 사용하여 다른 API에서 참조
```

### 3. 파일 첨부 예시 (게시물 작성)
```javascript
// 1. 파일 업로드
const file1 = await uploadFile(file);

// 2. 게시물 작성 시 파일 ID 포함
const post = await fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '제목',
    content: '내용',
    categoryId: 1,
    fileIds: [file1.id]  // 업로드한 파일 ID
  }),
  credentials: 'include'
});
```

---

## 날짜/시간 형식

- 모든 날짜/시간은 **ISO 8601** 형식 사용
- 예시: `2024-01-15T10:30:00Z`
- 타임존: UTC (Z로 표시)

---

## 보안 고려사항

1. **HTTPS 사용**: 프로덕션 환경에서는 반드시 HTTPS 사용
2. **CORS 설정**: 필요한 도메인만 허용
3. **Rate Limiting**: API 호출 제한 적용 권장
4. **입력 검증**: 모든 입력값은 서버에서 검증
5. **SQL Injection 방지**: Prisma ORM 사용으로 자동 방지
6. **XSS 방지**: 사용자 입력값 이스케이프 처리

---

## API 클라이언트 예시

### JavaScript (Fetch API)
```javascript
// 로그인
async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include'  // 쿠키 포함 필수
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// 인증이 필요한 API 호출
async function getMyInfo() {
  const response = await fetch('/api/users/me', {
    credentials: 'include'  // 쿠키 포함 필수
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}
```

### cURL 예시
```bash
# 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c cookie.txt

# 인증이 필요한 API 호출
curl -X GET http://localhost:3000/api/users/me \
  -b cookie.txt
```

---

## 문의 및 지원

API 관련 문의사항이나 버그 리포트는 시스템 관리자에게 연락하시기 바랍니다.

- **버전**: v1.0
- **최종 업데이트**: 2024년 1월
- **작성자**: i-Keeper 개발팀