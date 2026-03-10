import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://gallery_admin:gallery_password@127.0.0.1:5432/gallery_db';

// Disable prefetch as it is not supported for "Transaction" pool mode if true
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
