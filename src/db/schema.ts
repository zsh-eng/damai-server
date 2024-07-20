import {
	boolean,
	pgTable,
	serial,
	timestamp,
	varchar,
} from 'drizzle-orm/pg-core';

export const files = pgTable('files', {
  id: serial('id').notNull(),
  filename: varchar('filename').notNull(),
  content: varchar('content').notNull(),
  is_deleted: boolean('is_deleted').default(false),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow(),
});
