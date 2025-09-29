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
