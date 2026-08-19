import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

/**
 * Satu instans Prisma dipakai bersama; di mode pengembangan Next me-reload
 * modul berkali-kali, jadi instansnya disimpan di globalThis.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buatClient() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? buatClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
