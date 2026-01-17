import { PrismaClient } from './generated/client';
import path from 'path';

// Путь к базе данных относительно папки dist (после компиляции)
const dbPath = path.resolve(__dirname, '../dev.db');

export const prisma = new PrismaClient({
    datasourceUrl: `file:${dbPath}`
});
