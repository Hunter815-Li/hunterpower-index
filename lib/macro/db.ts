import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as typeof globalThis & { macroPrisma?: PrismaClient };

export function getMacroDb(): PrismaClient | null {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString || !/^postgres(ql)?:\/\//.test(connectionString) || connectionString.includes("USER:PASSWORD")) return null;
  if (!globalForPrisma.macroPrisma) globalForPrisma.macroPrisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  return globalForPrisma.macroPrisma;
}
