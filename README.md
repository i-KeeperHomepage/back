# i-Keeper Backend System

i-Keeper 동아리 홈페이지 백엔드 시스템

## 기술 스택

- **Framework**: Next.js 15.5.3 (App Router)
- **Language**: TypeScript
- **Database**: MySQL 8.0 with Prisma ORM
- **Authentication**: JWT with HttpOnly cookies
- **Validation**: Zod
- **Security**: bcrypt for password hashing

## 시작하기

### 1. 환경 설정

```bash
# .env 파일 생성 (.env.example 참고)
cp .env.example .env
# .env 파일에서 데이터베이스 연결 정보 수정
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션
npm run prisma:migrate

# 초기 데이터 시드
npm run prisma:seed
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 접속 가능

## API 엔드포인트

### 인증 (Authentication)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃

### 사용자 (User)
- `GET /api/users/me` - 내 정보 조회
- `PATCH /api/users/me` - 내 정보 수정
- `PATCH /api/users/me/password` - 비밀번호 변경

### 관리자 (Admin)
- `GET /api/admin/pending-users` - 가입 승인 대기 목록
- `PATCH /api/admin/users/{userId}/approve` - 가입 승인/거절
- `GET /api/admin/users` - 전체 회원 목록
- `PATCH /api/admin/users/{userId}` - 회원 정보 수정
- `DELETE /api/admin/users/{userId}` - 회원 삭제
- `GET /api/admin/roles` - 권한 목록 조회
- `POST /api/admin/roles` - 권한 생성
- `POST /api/admin/roles/transfer` - 권한 양도

### 게시물 (Posts)
- `GET /api/posts` - 게시물 목록
- `POST /api/posts` - 게시물 작성
- `GET /api/posts/{postId}` - 게시물 상세
- `PATCH /api/posts/{postId}` - 게시물 수정
- `DELETE /api/posts/{postId}` - 게시물 삭제

### 댓글 (Comments)
- `GET /api/posts/{postId}/comments` - 댓글 목록
- `POST /api/posts/{postId}/comments` - 댓글 작성

### 카테고리 (Categories)
- `GET /api/categories` - 카테고리 목록
- `POST /api/categories` - 카테고리 생성 (관리자만)

## Docker 배포

### Docker Compose로 실행

```bash
# .env.docker 파일 수정
cp .env.docker .env

# 컨테이너 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 데이터베이스 백업

```bash
# 백업 스크립트 실행
docker exec ikeeper-mysql /backup/backup.sh
```

## 기본 계정

시드 스크립트 실행 후:
- **관리자 계정**
  - Login ID: `admin`
  - Password: `admin123`

## 개발 명령어

```bash
# Prisma Studio (데이터베이스 GUI)
npm run prisma:studio

# 린트 실행
npm run lint

# 프로덕션 빌드
npm run build
```

## 보안 고려사항

1. **환경 변수**: 프로덕션 환경에서는 반드시 강력한 JWT_SECRET 사용
2. **HTTPS**: 프로덕션 환경에서는 반드시 HTTPS 적용
3. **CORS**: 필요시 CORS 설정 추가
4. **Rate Limiting**: DDoS 공격 방지를 위한 rate limiting 추가 권장

## 라이선스

Private