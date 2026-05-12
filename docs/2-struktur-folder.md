# Struktur Folder - Modular Architecture

## Konsep Modular

Proyek ini menggunakan **Modular Architecture** di mana setiap fitur/module memiliki struktur folder yang independen dan self-contained. Pendekatan ini memudahkan:
- Maintenance kode
- Testing per module
- Scalability
- Code reusability

## Struktur Folder Utama

```
backend-test/
├── apps/
│   ├── api/                          # Backend API Application
│   │   ├── src/
│   │   │   ├── modules/              # Business Logic Modules
│   │   │   │   ├── auth/             # Autentikasi Module
│   │   │   │   │   ├── controllers/
│   │   │   │   │   ├── services/
│   │   │   │   │   ├── repositories/
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   ├── types/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── upload/           # File Upload Module
│   │   │   │   │   ├── controllers/
│   │   │   │   │   ├── services/
│   │   │   │   │   ├── repositories/
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── workers/      # Background job handlers
│   │   │   │   │   ├── types/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── excel/            # Excel Processing Module
│   │   │   │   │   ├── controllers/
│   │   │   │   │   ├── services/
│   │   │   │   │   ├── parsers/      # Excel parsing logic
│   │   │   │   │   ├── types/
│   │   │   │   │   └── index.ts
│   │   │   │   └── file-list/        # File Listing Module
│   │   │   │       ├── controllers/
│   │   │   │       ├── services/
│   │   │   │       ├── repositories/
│   │   │   │       ├── routes/
│   │   │   │       └── index.ts
│   │   │   ├── common/               # Shared resources
│   │   │   │   ├── middlewares/      # Express middlewares
│   │   │   │   ├── utils/            # Utility functions
│   │   │   │   ├── config/           # Configuration files
│   │   │   │   ├── database/         # DB connection & migrations
│   │   │   │   ├── queue/            # Job queue setup
│   │   │   │   └── types/            # Global types
│   │   │   ├── app.ts                # Express app setup
│   │   │   └── server.ts             # Server entry point
│   │   ├── tests/
│   │   ├── prisma/                   # Prisma ORM files
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── uploads/                  # Temporary upload storage
│   │   ├── logs/                     # Application logs
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                          # Frontend (Future)
│       ├── src/
│       ├── package.json
│       └── ...
│
├── packages/
│   └── shared/                       # Shared packages
│       ├── src/
│       │   ├── types/              # Shared TypeScript types
│       │   ├── constants/          # Shared constants
│       │   └── utils/              # Shared utilities
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                             # Documentation
│   ├── 1-overview.md
│   ├── 2-struktur-folder.md
│   ├── 3-tech-stack.md
│   ├── 4-alur-sistem.md
│   ├── 5-instalasi.md
│   └── api/                          # API Documentation
│       └── postman-collection.json
│
├── docker-compose.yml                # Docker services
├── .gitignore
├── turbo.json                        # Turbo repo config
└── README.md
```

## Penjelasan Per Folder

### `apps/api/src/modules/`

Setiap module mengikuti pola **Controller-Service-Repository**:

```
modules/[nama-module]/
├── controllers/       # Handle HTTP requests/responses
├── services/          # Business logic
├── repositories/      # Database operations
├── routes/            # Route definitions
├── validators/        # Input validation (Zod/Joi)
├── workers/           # Background job handlers (jika perlu)
├── types/             # Module-specific TypeScript types
└── index.ts           # Module exports
```

### `apps/api/src/common/`

Resources yang dibagi antar module:

| Folder | Kegunaan |
|--------|----------|
| `middlewares/` | Express middleware (auth, error handler, dll) |
| `utils/` | Helper functions (response formatter, logger, dll) |
| `config/` | Environment configuration |
| `database/` | Database connection & Prisma client |
| `queue/` | Job queue configuration (Bull/Agenda) |
| `types/` | Global TypeScript interfaces |

### `apps/api/prisma/`

```
prisma/
├── schema.prisma        # Database schema definition
└── migrations/          # Database migrations
    ├── 20240101000000_init/
    └── ...
```

### `packages/shared/`

Package untuk kode yang dibagi antara backend dan frontend:

```
shared/
├── src/
│   ├── types/           # Shared interfaces
│   ├── constants/       # Shared constants
│   └── utils/           # Shared utilities
```

## Monorepo dengan Turbo

Proyek ini menggunakan **Turborepo** untuk mengelola monorepo:

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
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

## Keuntungan Struktur Ini

1. **Separation of Concerns** - Setiap module independen
2. **Scalable** - Mudah menambah fitur baru
3. **Testable** - Setiap module bisa di-test terpisah
4. **Maintainable** - Code terorganisir dengan baik
5. **Team Collaboration** - Developer bisa kerja di module berbeda tanpa konflik

## Aturan Pengembangan

1. **Jangan cross-import** antar module (gunakan dependency injection)
2. **Semua business logic** di `services/`
3. **Semua DB operations** di `repositories/`
4. **Gunakan types** dari `shared/` untuk konsistensi
5. **Tulis test** di folder `tests/` per module
