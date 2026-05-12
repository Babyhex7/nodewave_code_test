# Alur dan Mekanisme Sistem

## Diagram Alur Keseluruhan

```
┌─────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  USER   │───▶│   UPLOAD    │───▶│    QUEUE     │───▶│   PROCESS    │
│         │    │   FILE      │    │   JOB        │    │   EXCEL      │
└─────────┘    └─────────────┘    └──────────────┘    └──────┬───────┘
     │              │                    │                    │
     │              ▼                    ▼                    ▼
     │        ┌─────────────┐      ┌──────────┐      ┌─────────────┐
     │        │   RETURN    │      │ WORKER   │      │    SAVE     │
     │        │   PENDING   │      │ PICKUP   │      │    TO DB    │
     │        │   STATUS    │      │ JOB      │      │             │
     │        └─────────────┘      └──────────┘      └─────────────┘
     │                                                        │
     │              ┌─────────────────────────────────────────┘
     │              │
     ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CHECK STATUS ENDPOINT                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐ │
│  │   PENDING    │───▶│ IN_PROGRESS  │───▶│   SUCCESS / FAILED   │ │
│  └──────────────┘    └──────────────┘    └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 1. Alur Upload File

### Step-by-Step Flow

```
┌─────────┐                              ┌─────────────────┐
│  Client │ ──(1) POST /api/files/upload──▶ │   API Server    │
└─────────┘     Bearer <JWT_TOKEN>          └─────────────────┘
    │                                              │
    │                                              ▼ (2)
    │                                       ┌─────────────────┐
    │                                       │  Auth Middleware │
    │                                       │  Validate JWT   │
    │                                       └─────────────────┘
    │                                              │
    │                                              ▼ (3)
    │                                       ┌─────────────────┐
    │                                       │  Multer Upload  │
    │                                       │  - Save to disk (uploads/) │
    │                                       └─────────────────┘
    │                                              │
    │                                              ▼ (4)
    │                                       ┌─────────────────┐
    │                                       │  Create DB Row  │
    │                                       │  status=PENDING │
    │                                       └─────────────────┘
    │                                              │
    │                                              ▼ (5)
    │                                       ┌─────────────────┐
    │                                       │  Add to Queue   │
    │                                       │  Bull Queue     │
    │                                       └─────────────────┘
    │                                              │
    │◀─────────(6) Response───────────────│  Return JSON    │
    │              { id, status,           │  {              │
    │                message }             │    fileId,      │
    │                                      │    status,      │
    │                                      │    message      │
    │                                      │  }              │
    │                                      └─────────────────┘
```

### Detail Mekanisme

| Step | Proses | Keterangan |
|------|--------|------------|
| 1 | Client kirim request | POST ke `/api/files/upload` dengan Bearer token |
| 2 | Validasi JWT | Middleware cek token, extract user info |
| 3 | Handle file | Multer simpan file ke local storage (`uploads/`) |
| 4 | Simpan metadata | Insert ke table `FileUpload` dengan status `PENDING` |
| 5 | Tambah ke queue | Bull queue dengan data `{ fileId, filePath/url }` |
| 6 | Response ke client | Return immediately tanpa menunggu process |

### Contoh Response

```json
{
  "success": true,
  "data": {
    "fileId": "uuid-1234-5678",
    "status": "PENDING",
    "message": "File queued for processing",
    "checkStatusUrl": "/api/files/uuid-1234-5678/status"
  }
}
```

## 2. Alur Background Processing

### Job Queue Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      REDIS (Job Queue Storage)                       │
├─────────────────────────────────────────────────────────────────────┤
│  Queue: "excel-processing"                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │
│  │  Job #1     │  │  Job #2     │  │  Job #3     │  ...              │
│  │  {          │  │  {          │  │  {          │                   │
│  │    id,      │  │    id,      │  │    id,      │                   │
│  │    fileUrl, │  │    fileUrl, │  │    fileUrl, │                   │
│  │    retries  │  │    retries  │  │    retries  │                   │
│  │  }          │  │  }          │  │  }          │                   │
│  └─────────────┘  └─────────────┘  └─────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Worker pickup
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       WORKER PROCESS                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  1. UPDATE STATUS: PENDING → IN_PROGRESS                    │    │
│  │     UPDATE FileUpload SET status='IN_PROGRESS' WHERE id=?   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  2. FETCH FILE                                              │    │
│  │     - Read from local storage (`uploads/`)                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  3. PARSE EXCEL                                             │    │
│  │     - xlsx.read()                                           │    │
│  │     - Convert to JSON                                       │    │
│  │     - Validate data structure                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  4. BATCH INSERT TO DATABASE                                 │    │
│  │     - Gunakan Prisma createMany                             │    │
│  │     - Atau chunked insert untuk data besar                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  5. UPDATE STATUS: IN_PROGRESS → SUCCESS                    │    │
│  │     UPDATE FileUpload                                        │    │
│  │     SET status='SUCCESS',                                   │    │
│  │         data={count: N, rows: [...]},                      │    │
│  │         processedAt=NOW()                                    │    │
│  │     WHERE id=?                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Worker Code Structure

```typescript
// workers/excelProcessor.ts
import Queue from 'bull';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const fileQueue = new Queue('excel-processing', {
  redis: { host: 'localhost', port: 6379 }
});

// Processor function
fileQueue.process(async (job) => {
  const { fileId, fileUrl } = job.data;
  
  try {
    // 1. Update status to IN_PROGRESS
    await prisma.fileUpload.update({
      where: { id: fileId },
      data: { status: 'IN_PROGRESS' }
    });
    
    // 2. Fetch file (read local)
    const fileBuffer = await fetchFile(fileUrl);
    
    // 3. Parse Excel
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    // 4. Save to DB (batch insert)
    await prisma.product.createMany({
      data: data.map(row => ({
        name: row.name,
        price: row.price,
        // ... mapping fields
      })),
      skipDuplicates: true
    });
    
    // 5. Update status to SUCCESS
    await prisma.fileUpload.update({
      where: { id: fileId },
      data: { 
        status: 'SUCCESS',
        data: { count: data.length },
        processedAt: new Date()
      }
    });
    
    return { success: true, count: data.length };
    
  } catch (error) {
    // Update status to FAILED
    await prisma.fileUpload.update({
      where: { id: fileId },
      data: { 
        status: 'FAILED',
        error: error.message,
        retryCount: { increment: 1 }
      }
    });
    throw error; // Trigger Bull retry
  }
});

// Retry configuration
fileQueue.on('failed', async (job, err) => {
  if (job.attemptsMade < 3) {
    await job.retry();
  }
});
```

## 3. Alur Retry Mechanism

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RETRY FLOW                                   │
└─────────────────────────────────────────────────────────────────────┘

Job Failed
    │
    ▼
┌─────────────────┐
│  Bull Auto-     │────Yes────▶┌─────────────────────┐
│  matic Retry?   │            │  Retry dengan       │
│  (attempts<3)   │            │  exponential        │
└─────────────────┘            │  backoff            │
    │ No                       └─────────────────────┘
    ▼                                    │
┌─────────────────┐                        │
│  Max Retry      │◀───────────────────────┘
│  Reached        │
└─────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  MANUAL RETRY via API                                                │
│                                                                      │
│  Client ──POST /api/files/:id/retry──▶ Server                       │
│                                              │                       │
│                                              ▼                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  1. Check current status (must be FAILED)                   │    │
│  │  2. Reset retryCount to 0                                   │    │
│  │  3. Update status to PENDING                                │    │
│  │  4. Re-add to queue                                         │    │
│  │  5. Return success response                                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Retry Configuration

```typescript
// Queue dengan retry config
const fileQueue = new Queue('excel-processing', {
  redis: { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    attempts: 3,                    // Max 3 retries
    backoff: {
      type: 'exponential',          // Exponential backoff
      delay: 2000                   // 2s, 4s, 8s
    },
    removeOnComplete: 10,           // Keep last 10 completed
    removeOnFail: 5                 // Keep last 5 failed
  }
});
```

## 4. Alur Check Status

```
Client ──GET /api/files/:id/status──▶ Server
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │  Auth Middleware │
                                    └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │  Fetch from DB  │
                                    │  FileUpload     │
                                    │  WHERE id=:id   │
                                    └─────────────────┘
                                              │
                          ┌───────────────────┼───────────────────┐
                          │                   │                   │
                          ▼                   ▼                   ▼
                    ┌──────────┐      ┌──────────┐      ┌──────────┐
                    │ PENDING  │      │ IN_PROG  │      │ SUCCESS │
                    │          │      │ RESS     │      │         │
                    └────┬─────┘      └────┬─────┘      └────┬─────┘
                         │                 │                 │
                         ▼                 ▼                 ▼
                    ┌──────────┐      ┌──────────┐      ┌──────────┐
                    │{         │      │{         │      │{         │
                    │ status   │      │ status   │      │ status   │
                    │ progress │      │ progress │      │ data     │
                    │ 0%       │      │ 50%      │      │ count    │
                    │}         │      │}         │      │}         │
                    └──────────┘      └──────────┘      └──────────┘
                         │                 │                 │
                         └─────────────────┴─────────────────┘
                                           │
                                           ▼
                                    ┌─────────────────┐
                                    │  Return JSON    │
                                    │  Response       │
                                    └─────────────────┘
                                           │
                                           ▼
                                         Client
```

### Status Response Examples

```json
// PENDING
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "filename": "products.xlsx",
    "status": "PENDING",
    "progress": 0,
    "createdAt": "2024-01-01T10:00:00Z"
  }
}

// IN_PROGRESS
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "filename": "products.xlsx",
    "status": "IN_PROGRESS",
    "progress": 50,
    "processedRows": 500,
    "totalRows": 1000,
    "updatedAt": "2024-01-01T10:05:00Z"
  }
}

// SUCCESS
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "filename": "products.xlsx",
    "status": "SUCCESS",
    "progress": 100,
    "result": {
      "totalRows": 1000,
      "insertedRows": 1000,
      "skippedRows": 0
    },
    "processedAt": "2024-01-01T10:10:00Z"
  }
}

// FAILED
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "filename": "products.xlsx",
    "status": "FAILED",
    "error": "Invalid file format at row 500",
    "retryCount": 2,
    "canRetry": true,
    "updatedAt": "2024-01-01T10:10:00Z"
  }
}
```

## 5. Alur List Files (Pagination & Filter)

```
Client ──GET /api/files?page=1&limit=10&status=SUCCESS──▶ Server
                                                                  │
                                                                  ▼
                                                        ┌─────────────────┐
                                                        │  Parse Query    │
                                                        │  Params         │
                                                        └─────────────────┘
                                                                  │
                                                                  ▼
                                                        ┌─────────────────┐
                                                        │  Build Prisma   │
                                                        │  Query          │
                                                        │                 │
                                                        │  where: {       │
                                                        │    status,      │
                                                        │    userId,      │
                                                        │    createdAt    │
                                                        │  }              │
                                                        │  skip, take     │
                                                        │  orderBy        │
                                                        └─────────────────┘
                                                                  │
                                                                  ▼
                                                        ┌─────────────────┐
                                                        │  Execute Query  │
                                                        │  (Promise.all)  │
                                                        │                 │
                                                        │  - Get data     │
                                                        │  - Get total    │
                                                        │  - Calculate    │
                                                        │    pagination   │
                                                        └─────────────────┘
                                                                  │
                                                                  ▼
                                                        ┌─────────────────┐
                                                        │  Return JSON    │
                                                        │                 │
                                                        │  {              │
                                                        │    data: [],    │
                                                        │    meta: {      │
                                                        │      page,     │
                                                        │      limit,    │
                                                        │      total,    │
                                                        │      totalPage │
                                                        │    }           │
                                                        │  }              │
                                                        └─────────────────┘
```

### API Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1234",
      "filename": "products.xlsx",
      "status": "SUCCESS",
      "createdAt": "2024-01-01T10:00:00Z",
      "processedAt": "2024-01-01T10:10:00Z"
    },
    {
      "id": "uuid-5678",
      "filename": "users.xlsx",
      "status": "FAILED",
      "createdAt": "2024-01-01T09:00:00Z",
      "error": "Invalid format"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## 6. State Machine File Processing

```
                    ┌──────────┐
         ┌─────────│  PENDING │◀────────────────┐
         │         └────┬─────┘                 │
         │              │ Upload Complete        │
         │              ▼                        │
         │    ┌──────────────────┐               │
         │    │   IN_PROGRESS    │               │
         │    │                  │               │
         │    │  Worker pickup   │               │
         │    │  job from queue  │               │
         │    └────────┬─────────┘               │
         │             │                          │
         │     ┌──────┴──────┐                   │
         │     │             │                     │
         ▼     ▼             ▼                     │
    ┌────────┐        ┌──────────┐                │
    │ SUCCESS│        │  FAILED  │────────────────┘
    │        │        │          │   Retry
    │ Process│        │  Max     │   (manual/auto)
    │ Complete│       │  retry   │
    └────────┘        │  reached │
                      └──────────┘
```

## 7. Sequence Diagram Lengkap

```
┌────────┐          ┌────────┐          ┌────────┐          ┌────────┐          ┌────────┐
│ Client │          │ Server │          │ Queue  │          │ Worker │          │  DB    │
└───┬────┘          └───┬────┘          └───┬────┘          └───┬────┘          └───┬────┘
    │                   │                   │                   │                   │
    │ 1. POST /upload   │                   │                   │                   │
    │  + Bearer Token   │                   │                   │                   │
    │──────────────────▶│                   │                   │                   │
    │                   │                   │                   │                   │
    │                   │ 2. Validate JWT   │                   │                   │
    │                   │──────────────────▶│                   │                   │
    │                   │◀─────────────────│                   │                   │
    │                   │                   │                   │                   │
    │                   │ 3. Handle File    │                   │                   │
    │                   │  (Multer Local)   │                   │                   │
    │                   │                   │                   │                   │
    │                   │ 4. INSERT File    │                   │                   │
    │                   │    status=PENDING │                   │                   │
    │                   │────────────────────────────────────────▶│                   │
    │                   │◀────────────────────────────────────────│                   │
    │                   │                   │                   │                   │
    │                   │ 5. Add Job to     │                   │                   │
    │                   │    Queue          │                   │                   │
    │                   │──────────────────▶│                   │                   │
    │                   │◀─────────────────│                   │                   │
    │                   │                   │                   │                   │
    │ 6. Response:      │                   │                   │
    │    {fileId,       │                   │                   │                   │
    │     status,       │                   │                   │
    │     message}      │                   │                   │                   │
    │◀──────────────────│                   │                   │                   │
    │                   │                   │                   │                   │
    │                   │                   │ 7. Worker pickup  │                   │
    │                   │                   │    job            │                   │
    │                   │                   │──────────────────▶│                   │
    │                   │                   │                   │                   │
    │                   │                   │                   │ 8. UPDATE         │
    │                   │                   │                   │    status=        │
    │                   │                   │                   │    IN_PROGRESS    │
    │                   │                   │                   │──────────────────▶│
    │                   │                   │                   │◀─────────────────│
    │                   │                   │                   │                   │
    │                   │                   │                   │ 9. Parse Excel   │
    │                   │                   │                   │    (xlsx)         │
    │                   │                   │                   │                   │
    │                   │                   │                   │ 10. INSERT data   │
    │                   │                   │                   │     to DB         │
    │                   │                   │                   │──────────────────▶│
    │                   │                   │                   │◀─────────────────│
    │                   │                   │                   │                   │
    │                   │                   │                   │ 11. UPDATE        │
    │                   │                   │                   │     status=       │
    │                   │                   │                   │     SUCCESS       │
    │                   │                   │                   │──────────────────▶│
    │                   │                   │                   │◀─────────────────│
    │                   │                   │                   │                   │
    │                   │                   │◀──────────────────│                   │
    │                   │                   │                   │                   │
    │ 12. GET /status   │                   │                   │                   │
    │    (polling)      │                   │                   │                   │
    │──────────────────▶│                   │                   │                   │
    │                   │ 13. SELECT        │                   │                   │
    │                   │     status        │                   │                   │
    │                   │────────────────────────────────────────▶│                   │
    │                   │◀────────────────────────────────────────│                   │
    │                   │                   │                   │                   │
    │ 14. Response      │                   │                   │                   │
    │     {status,      │                   │                   │                   │
    │      result}      │                   │                   │                   │
    │◀──────────────────│                   │                   │                   │
    │                   │                   │                   │                   │
```

## Ringkasan Endpoint

| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| POST | `/api/auth/login` | No | Login, return JWT |
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/files/upload` | Yes | Upload file Excel |
| POST | `/api/files/url` | Yes | Submit URL file |
| GET | `/api/files` | Yes | List files (pagination & filter) |
| GET | `/api/files/:id` | Yes | Detail file |
| GET | `/api/files/:id/status` | Yes | Check processing status |
| POST | `/api/files/:id/retry` | Yes | Retry failed job |
| DELETE | `/api/files/:id` | Yes | Delete file record |
