# Tech Stack - NodeWave Backend Assessment

## Ringkasan Teknologi

| Kategori | Teknologi | Versi | Kegunaan |
|----------|-----------|-------|----------|
| **Language** | TypeScript | ^5.x | Type-safe JavaScript |
| **Runtime** | Node.js | ^20.x | JavaScript runtime |
| **Framework** | Express.js | ^4.x | Web framework |
| **Database** | MySQL | ^8.x | Relational database |
| **ORM** | Prisma | ^5.x | Database ORM |
| **Queue** | Bull + Redis | ^4.x | Background job queue |
| **Auth** | JWT (jsonwebtoken) | ^9.x | Authentication |
| **Validation** | Zod | ^3.x | Schema validation |
| **Excel** | xlsx (SheetJS) | ^0.18.x | Excel parsing |
| **Upload** | Multer | ^1.x | File upload handling |
| **Storage** | Local File System | - | Local file storage within project directory |

## Detail Teknologi

### 1. Backend Core

#### TypeScript + Node.js + Express
```typescript
// Contoh setup Express dengan TypeScript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

**Mengapa dipilih:**
- TypeScript: Type safety, better IDE support, easier refactoring
- Express: Lightweight, mature ecosystem, banyak middleware

### 2. Database & ORM

#### MySQL + Prisma
```typescript
// Prisma Schema example
// schema.prisma
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
}

model FileUpload {
  id          String   @id @default(uuid())
  filename    String
  url         String?
  status      Status   @default(PENDING)
  data        Json?
  error       String?
  retryCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Status {
  PENDING
  IN_PROGRESS
  SUCCESS
  FAILED
}
```

**Mengapa dipilih:**
- MySQL: Reliable, widely supported, good performance
- Prisma: Type-safe queries, automatic migrations, great DX

### 3. Background Processing

#### Bull + Redis
```typescript
// Queue setup
import Queue from 'bull';

const fileProcessingQueue = new Queue('file-processing', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Job processor
fileProcessingQueue.process(async (job) => {
  const { fileId, fileUrl } = job.data;
  // Process Excel file
  return await processExcelFile(fileId, fileUrl);
});
```

**Fitur Bull:**
- ✅ Job persistence
- ✅ Retry mechanism dengan backoff
- ✅ Job progress tracking
- ✅ Concurrency control
- ✅ Rate limiting

**Mengapa dipilih:**
- Bull: Robust, well-documented, Redis-backed
- Redis: Fast, reliable, widely used

### 4. Authentication

#### JWT (JSON Web Token)
```typescript
import jwt from 'jsonwebtoken';

// Generate token
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: '24h' }
);

// Verify middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  req.user = decoded;
  next();
};
```

**Mengapa dipilih:**
- Stateless authentication
- Industry standard
- Easy to implement
- Works well with SPAs

### 5. Validation

#### Zod
```typescript
import { z } from 'zod';

// Schema definition
const uploadSchema = z.object({
  filename: z.string().min(1),
  url: z.string().url().optional(),
});

// Type inference
type UploadInput = z.infer<typeof uploadSchema>;

// Validation
const result = uploadSchema.safeParse(data);
```

**Mengapa dipilih:**
- TypeScript-first
- Excellent error messages
- Composable schemas
- Runtime type checking

### 6. Excel Processing

#### xlsx (SheetJS)
```typescript
import * as XLSX from 'xlsx';

// Parse Excel from buffer
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);
```

**Mengapa dipilih:**
- Supports many Excel formats
- Can work with buffers (no file system needed)
- Fast parsing
- Large community

### 7. File Upload

#### Multer
```typescript
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for processing
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files allowed'));
    }
  },
});
```

**Mengapa dipilih:**
- Industry standard for Express
- Memory/disk storage options
- File filtering
- Size limiting

### 8. Additional Libraries

| Library | Kegunaan |
|---------|----------|
| `dotenv` | Environment variable management |
| `winston` | Logging |
| `cors` | CORS handling |
| `helmet` | Security headers |
| `compression` | Response compression |
| `express-rate-limit` | Rate limiting |

## Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3000

# Database (MySQL)
DATABASE_URL="mysql://user:password@localhost:3306/nodewave_db"

# Redis (for Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# File Storage (Local)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

## Development Tools

| Tool | Kegunaan |
|------|----------|
| `nodemon` | Auto-restart saat development |
| `ts-node` | Run TypeScript directly |
| `eslint` | Linting |
| `prettier` | Code formatting |
| `jest` | Testing framework |
| `prisma` | Database ORM CLI |

## Scripts (package.json)

```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "tsx prisma/seed.ts",
    "test": "jest",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

## Diagram Arsitektur Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Web/Mobile)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                         EXPRESS SERVER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Routes    │  │ Middleware  │  │    Controllers          │  │
│  │   (Express) │  │ (Auth/Error)│  │    (Request Handler)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌─────────────────┐    ┌──────────────┐
│     PRISMA    │    │   BULL QUEUE    │    │    JWT       │
│     (ORM)     │    │   + REDIS       │    │  (Auth)      │
└───────┬───────┘    └────────┬────────┘    └──────────────┘
        │                     │
        ▼                     ▼
┌───────────────┐    ┌─────────────────┐
│     MYSQL     │    │  BACKGROUND     │
│   (Database)  │    │  WORKER PROCESS │
└───────────────┘    │                 │
                     │  ┌───────────┐  │
                     │  │  Excel    │  │
                     │  │  Parser   │  │
                     │  └───────────┘  │
                     └─────────────────┘
```
