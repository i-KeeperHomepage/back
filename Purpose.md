물론입니다. 지정해주신 데이터베이스와 서버 환경을 반영하여 i-Keeper 홈페이지 백엔드 시스템 기획서 최종본을 작성했습니다.

-----

## i-Keeper 홈페이지 백엔드 시스템 기획서 (최종본)

  - **프로젝트명**: i-Keeper 동아리 홈페이지 시스템
  - **문서 버전**: v1.1
  - **작성일**: 2025년 9월 17일

### 1\. 개요

본 문서는 i-Keeper 동아리 홈페이지의 서버(백엔드) 기능 구현을 위한 최종 명세서입니다. 안정적인 서비스 운영을 위해 데이터 모델링, API 설계, 비즈니스 로직, 권한 제어 및 지정된 인프라 환경에서의 운영 방안을 정의합니다.

### 2\. 기술 스택 및 환경 (Technology Stack & Environment)

  - **서버 환경**: NAS(Network Attached Storage) 기반 로컬 서버
      - Docker 컨테이너를 활용하여 애플리케이션 및 데이터베이스 환경 구성 권장
  - **데이터베이스**: **MySQL (v8.0 이상)**
  - **백엔드 프레임워크**: Next.js (API Routes, Server Actions)
  - **언어**: TypeScript
  - **인증 방식**: JWT (JSON Web Token) 기반 인증

### 3\. 데이터베이스 모델링 (ERD - MySQL 기준)

MySQL 환경에 최적화된 테이블 스키마입니다. 각 테이블은 InnoDB 엔진 사용을 전제로 합니다.

```sql
-- 사용자 계정 정보
CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- bcrypt 해시 저장
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('pending_approval', 'active', 'inactive', 'withdrawn') NOT NULL DEFAULT 'pending_approval', -- 계정 상태
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES Role(id)
);

-- 사용자 권한 그룹
CREATE TABLE Role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- 세부 기능 권한
CREATE TABLE Permission (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL UNIQUE, -- 예: 'delete_any_post', 'manage_users'
    description TEXT
);

-- 권한 그룹과 세부 기능 매핑 (다대다 관계)
CREATE TABLE RolePermission (
    role_id INT,
    permission_id INT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES Role(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES Permission(id) ON DELETE CASCADE
);

-- 게시글
CREATE TABLE Post (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES User(id),
    FOREIGN KEY (category_id) REFERENCES Category(id)
);

-- 댓글
CREATE TABLE Comment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES User(id),
    FOREIGN KEY (post_id) REFERENCES Post(id) ON DELETE CASCADE
);

-- 기타 테이블 (Category, Book, Fee, Attendance, Evaluation, CalendarEvent 등)은 이전 명세와 유사하게 INT, VARCHAR, TEXT, TIMESTAMP, ENUM 등의 MySQL 데이터 타입으로 정의합니다.
```

-----

### 4\. API 명세 (API Specification)

#### 4.1 인증 (Authentication)

| 기능         | Endpoint                    | Method | 권한   | 요청(Body) / 응답(Response)                               |
| :----------- | :-------------------------- | :----- | :----- | :-------------------------------------------------------- |
| **회원가입** | `/api/auth/register`        | POST   | Public | **요청**: `{ login_id, password, name, email }`\<br\>**응답**: `201 Created` |
| **로그인** | `/api/auth/login`           | POST   | Public | **요청**: `{ login_id, password }`\<br\>**응답**: `{ accessToken }` |
| **로그아웃** | `/api/auth/logout`          | POST   | User   | **응답**: `200 OK`                                        |
| **내 정보** | `/api/users/me`             | GET    | User   | **응답**: `{ id, name, email, role }`                     |
| **비번 변경**| `/api/users/me/password`    | PATCH  | User   | **요청**: `{ current_password, new_password }`\<br\>**응답**: `200 OK` |

#### 4.2 관리자 기능 (Admin)

| 기능           | Endpoint                                 | Method | 권한    | 요청(Body) / 응답(Response)                                      |
| :------------- | :--------------------------------------- | :----- | :------ | :--------------------------------------------------------------- |
| **가입 신청 목록** | `/api/admin/pending-users`               | GET    | Admin   | **응답**: `[User List]`                                          |
| **가입 승인/거절** | `/api/admin/users/{userId}/approve`      | PATCH  | Admin   | **요청**: `{ approve: true/false }`\<br\>**응답**: `200 OK`         |
| **전체 회원 조회** | `/api/admin/users`                       | GET    | Admin   | **응답**: `[User List]`                                          |
| **회원 정보 수정** | `/api/admin/users/{userId}`              | PATCH  | Admin   | **요청**: `{ status, role_id }`\<br\>**응답**: `200 OK`             |
| **회원 삭제** | `/api/admin/users/{userId}`              | DELETE | Admin   | **응답**: `204 No Content`                                       |
| **권한 생성** | `/api/admin/roles`                       | POST   | Admin   | **요청**: `{ name, description, permissions: [id] }`\<br\>**응답**: `201 Created` |
| **권한 양도** | `/api/admin/roles/transfer`              | POST   | Admin   | **요청**: `{ from_user_id, to_user_id, role_id }`\<br\>**응답**: `200 OK` |
| **콘텐츠 관리** | `/api/admin/posts/{postId}` 등           | PATCH, DELETE | Admin | (게시글, 댓글, 도서, 회비, 일정 등 콘텐츠 관리 API) |
| **카테고리 관리**| `/api/admin/categories`                  | POST, PATCH, DELETE | Admin | (카테고리 CRUD API)                                             |

-----

### 5\. 핵심 로직 및 보안 정책

1.  **인증 (Authentication)**

      - JWT 토큰은 `HttpOnly` 쿠키에 저장하여 XSS(Cross-Site Scripting) 공격으로부터 보호합니다.
      - 토큰에는 만료 시간을 설정하고, 필요시 리프레시 토큰(Refresh Token) 전략을 도입합니다.

2.  **인가 (Authorization)**

      - 모든 API 요청에 대해 미들웨어(Middleware)를 통해 JWT 토큰을 검증하고 사용자의 `role_id`를 확인합니다.
      - `RolePermission` 테이블을 참조하여 해당 Role이 요청된 작업을 수행할 `Permission`을 가지고 있는지 검증하는 로직을 구현합니다.

3.  **비밀번호 관리**

      - `bcrypt` 라이브러리를 사용하며, Salt Round는 10 이상으로 설정하여 비밀번호를 안전하게 해싱합니다.

4.  **트랜잭션 관리 (Transaction Management)**

      - **권한 승계**, **회원가입 승인** 등 여러 데이터베이스 작업을 동시에 처리해야 하는 경우, 반드시 **DB 트랜잭션**을 적용하여 데이터의 일관성과 무결성을 보장합니다. 하나라도 실패하면 모든 작업을 롤백(Rollback)합니다.

5.  **데이터 유효성 검사 (Data Validation)**

      - 모든 API 요청의 Body, Parameter, Query에 대해 `zod` 또는 `joi`와 같은 라이브러리를 사용하여 타입, 형식, 길이를 철저히 검증합니다.

-----

### 6\. 배포 및 운영 고려사항 (NAS 환경)

1.  **실행 환경**:

      - **Docker & Docker Compose**를 사용하여 Next.js 애플리케이션과 MySQL 데이터베이스를 각각의 컨테이너로 구성합니다. 이는 환경 격리 및 배포 편의성을 크게 향상시킵니다.
      - `docker-compose.yml` 파일을 통해 서비스 실행을 자동화합니다.

2.  **환경 변수 관리**:

      - 데이터베이스 접속 정보, JWT 시크릿 키 등 민감한 정보는 `.env` 파일에 저장합니다.
      - 이 파일은 **절대로 Git 리포지토리에 포함시키지 않도록** `.gitignore`에 등록합니다.

3.  **데이터베이스 백업**:

      - NAS의 자동화 기능 또는 `cron` 작업을 활용하여 **정기적으로 MySQL 데이터베이스를 백업**하는 스크립트(`mysqldump` 명령어 사용)를 설정합니다. 이는 데이터 유실 시 복구를 위한 필수 절차입니다.

4.  **로깅 (Logging)**:

      - 운영 중 발생하는 에러나 주요 이벤트를 파일로 기록하도록 로깅 시스템(예: Winston.js)을 설정합니다. Docker 환경에서는 컨테이너 로그를 수집하여 관리합니다.

5.  **HTTPS 적용**:

      - 가능하다면 NAS에서 제공하는 리버스 프록시(Reverse Proxy) 기능과 Let's Encrypt를 통해 HTTPS를 적용하여 통신을 암호화합니다.