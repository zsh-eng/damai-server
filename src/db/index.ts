import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// for migrations
// const migrationClient = postgres("postgres://postgres:adminadmin@0.0.0.0:5432/db", { max: 1 });
// migrate(drizzle(migrationClient), ...)

// for query purposes
const queryClient = postgres(
  'postgresql://admin:password@localhost:5432/damai-local'
);
const db = drizzle(queryClient, { schema: schema });

export default db
