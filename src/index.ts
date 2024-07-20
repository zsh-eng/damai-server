import db from '@/db';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use(cors());

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.get('/files', async (c) => {
  const files = await db.query.files.findMany();
  return c.json(files);
});

export default app;
