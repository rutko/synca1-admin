import { drizzle } from 'drizzle-orm/d1';

export interface Env {
    DB: D1Database;
  }

export function createClient(db: D1Database) {
  return drizzle(db);
}