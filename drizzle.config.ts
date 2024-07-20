import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://admin:password@localhost:5432/damai-local',
  },
  verbose: true,
  strict: true,
});
