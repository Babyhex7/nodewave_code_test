# Panduan Instalasi & Setup

## Prerequisites

Sebelum memulai, pastikan sudah terinstall:

| Software | Versi | Download |
|----------|-------|----------|
| Node.js | ^20.x | [nodejs.org](https://nodejs.org/) |
| MySQL | ^8.x | [mysql.com](https://mysql.com/) |
| Redis | ^7.x | [redis.io](https://redis.io/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

Verifikasi instalasi:
```bash
node --version    # v20.x.x
npm --version     # 10.x.x
mysql --version   # 8.x.x
redis-cli ping    # PONG
```

## 1. Clone Repository

```bash
# Clone base repository dari Nodewave
git clone <repository-url> backend-test
cd backend-test

# Atau jika membuat dari awal:
mkdir backend-test
cd backend-test
```

## 2. Setup Monorepo Structure

```bash
# Inisialisasi root project
npm init -y

# Install Turborepo globally
npm install -g turbo

# Install dependencies untuk workspace management
npm install --save-dev turbo
```

### Buat Folder Structure

```bash
# Buat struktur folder
mkdir -p apps/api apps/web packages/shared docs/api
```

## 3. Setup Backend API

```bash
cd apps/api

# Inisialisasi project
npm init -y

# Install dependencies
npm install express cors helmet compression dotenv
npm install prisma @prisma/client
npm install bull redis
npm install jsonwebtoken bcryptjs
npm install zod
npm install xlsx multer
npm install winston express-rate-limit

# Install dev dependencies
npm install -D typescript @types/express @types/node @types/cors
npm install -D @types/jsonwebtoken @types/bcryptjs @types/multer
npm install -D nodemon ts-node tsx jest @types/jest
npm install -D eslint prettier @typescript-eslint/parser

# Generate tsconfig.json
npx tsc --init
```

### Konfigurasi TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## 4. Setup Database

### 4.1. Buat Database MySQL

```bash
# Login ke MySQL
mysql -u root -p

# Buat database
CREATE DATABASE nodewave_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nodewave_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON nodewave_db.* TO 'nodewave_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4.2. Setup Prisma

```bash
cd apps/api

# Inisialisasi Prisma
npx prisma init
```

Edit `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  files     FileUpload[]
}

model FileUpload {
  id           String   @id @default(uuid())
  filename     String
  url          String?
  status       FileStatus @default(PENDING)
  data         Json?
  error        String?  @db.Text
  retryCount   Int      @default(0)
  processedAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  userId       Int
  user         User     @relation(fields: [userId], references: [id])
}

enum FileStatus {
  PENDING
  IN_PROGRESS
  SUCCESS
  FAILED
}
```

### 4.3. Generate Prisma Client & Migration

```bash
# Generate Prisma Client
npx prisma generate

# Buat migration pertama
npx prisma migrate dev --name init

# (Opsional) Jalankan Prisma Studio untuk GUI
npx prisma studio
```

## 5. Setup Environment Variables

Buat file `.env` di `apps/api`:

```bash
cd apps/api
cp .env.example .env
```

Isi `apps/api/.env`:

```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
NODE_ENV=development
PORT=3000
API_PREFIX=/api

# ===========================================
# DATABASE (MySQL)
# ===========================================
DATABASE_URL="mysql://nodewave_user:your_password@localhost:3306/nodewave_db"

# ===========================================
# REDIS (Bull Queue)
# ===========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ===========================================
# JWT AUTHENTICATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key

# ===========================================
# FILE UPLOAD (Local Storage)
# ===========================================
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# ===========================================
# LOGGING
# ===========================================
LOG_LEVEL=debug
LOG_DIR=./logs
```

Buat juga `.env.example` (tanpa nilai sensitif):

```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api

DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/nodewave_db"

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=

MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

LOG_LEVEL=debug
LOG_DIR=./logs
```

## 6. Setup Redis

### Windows (WSL atau Native)

```bash
# Install Redis via Docker (recommended)
docker run -d --name redis -p 6379:6379 redis:latest

# Atau install Redis for Windows
# Download dari: https://github.com/tporadowski/redis/releases

# Jalankan Redis
redis-server

# Test connection
redis-cli ping
```

## 7. Struktur Folder Lengkap

```bash
cd apps/api
mkdir -p src/{modules/{auth,upload,excel,file-list}/{controllers,services,repositories,routes,types,validators,workers},common/{middlewares,utils,config,database,queue,types}}
mkdir -p prisma/migrations tests uploads logs
```

## 8. Setup Package.json Scripts

Edit `apps/api/package.json`:

```json
{
  "name": "@nodewave/api",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

## 9. Root Package.json & Turbo

Edit root `package.json`:

```json
{
  "name": "nodewave-assessment",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:migrate": "turbo run db:migrate",
    "db:generate": "turbo run db:generate"
  },
  "devDependencies": {
    "turbo": "^1.10.0"
  }
}
```

Buat `turbo.json` di root:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

## 10. Menjalankan Aplikasi

### Development Mode

```bash
# Dari root directory
npm run dev

# Atau langsung ke API
npm run dev --workspace=@nodewave/api

# Atau cd ke api
```

### Production Mode

```bash
# Build
npm run build

# Start
npm run start
```

### Jalankan Worker (Background Processing)

```bash
# Terminal 1: Jalankan API server
cd apps/api
npm run dev

# Terminal 2: Jalankan Worker
cd apps/api
npx ts-node src/common/queue/worker.ts
```

## 11. Testing Setup

### Install & Konfigurasi Jest

```bash
cd apps/api
npm install -D jest ts-jest @types/jest supertest @types/supertest
```

Buat `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

### Jalankan Test

```bash
npm test
npm run test:watch
```

## 12. Troubleshooting

### Error: Cannot find module

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

### Error: Database connection failed

```bash
# Cek MySQL running
docker ps
# atau
mysql -u root -p

# Cek DATABASE_URL di .env
```

### Error: Redis connection failed

```bash
# Cek Redis running
redis-cli ping

# Jalankan Redis jika belum
redis-server
```

### Error: Prisma Client not generated

```bash
npx prisma generate
```

## 13. Postman Collection Setup

1. Buka Postman
2. Create new Collection: `NodeWave Assessment API`
3. Buat Environment:
   - `baseUrl`: `http://localhost:3000`
   - `token`: (kosong, diisi setelah login)

### Contoh Request Structure

```json
{
  "info": {
    "name": "NodeWave Assessment API",
    "description": "Backend API for Excel Processing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [],
            "url": "{{baseUrl}}/api/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\"}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "url": "{{baseUrl}}/api/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
            }
          }
        }
      ]
    },
    {
      "name": "Files",
      "item": [
        {
          "name": "Upload Excel",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": "{{baseUrl}}/api/files/upload",
            "body": {
              "mode": "formdata",
              "formdata": [
                {
                  "key": "file",
                  "type": "file",
                  "src": "example.xlsx"
                }
              ]
            }
          }
        },
        {
          "name": "Get Files List",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": "{{baseUrl}}/api/files?page=1&limit=10&status=SUCCESS"
          }
        },
        {
          "name": "Check Status",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": "{{baseUrl}}/api/files/:id/status"
          }
        }
      ]
    }
  ]
}
```

## 14. Docker Setup (Opsional)

Buat `docker-compose.yml` di root:

```yaml
version: '3.8'

services:
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://root:password@mysql:3306/nodewave_db
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
    volumes:
      - ./apps/api/uploads:/app/uploads
      - ./apps/api/logs:/app/logs

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: nodewave_db
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mysql_data:
```

Jalankan dengan Docker:

```bash
docker-compose up -d
```

---

## Ringkasan Command

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Setup database | `npx prisma migrate dev` |
| Generate Prisma client | `npx prisma generate` |
| Jalankan development | `npm run dev` |
| Build production | `npm run build` |
| Jalankan production | `npm start` |
| Jalankan test | `npm test` |
| Format code | `npm run format` |
| Lint code | `npm run lint` |
| Open Prisma Studio | `npx prisma studio` |
