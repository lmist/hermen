import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from './generated/prisma/client.js'
import { getDatabaseUrl } from './database-url.js'

/**
 * Workers cannot reuse I/O objects across requests, so open a client per call
 * and disconnect when done.
 */
export async function withDb<T>(
  fn: (db: PrismaClient) => Promise<T>,
): Promise<T> {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() })
  const db = new PrismaClient({ adapter })
  try {
    return await fn(db)
  } finally {
    await db.$disconnect()
  }
}
