import { PrismaClient } from '@prisma/client';

// Inisialisasi Prisma Client (Singleton)
const prisma = new PrismaClient();

export default prisma;
