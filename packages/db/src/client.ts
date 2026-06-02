import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://cortex:cortex@localhost:5432/cortexos',
});

export const db = drizzle(pool, { schema });
export { pool };
