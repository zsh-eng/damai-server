import db from '@/db';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as schema from '@/db/schema';
import { asc, eq } from 'drizzle-orm';

const app = new Hono();
app.use(cors());

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.get('/files', async (c) => {
  const files = await db.query.files.findMany({
    orderBy: asc(schema.files.created_at),
  });
  return c.json(files);
});

const updateFileSchema = z.object({
  content: z.string().optional(),
  filename: z.string().optional(),
});

app.patch('/files/:id', zValidator('json', updateFileSchema), async (c) => {
  const idString = c.req.param('id');
  const id = Number(idString);
  if (isNaN(id)) {
    return c.json({ error: 'Invalid id' }, 400);
  }

  const body = c.req.valid('json');
  await db
    .update(schema.files)
    .set({ content: body.content, filename: body.filename })
    .where(eq(schema.files.id, id));

  return c.json({ success: true });
});

const newFileSchema = z.object({
  filename: z.string(),
});

app.post('/files', zValidator('json', newFileSchema), async (c) => {
  const body = c.req.valid('json');
  const { filename } = body;
  const [file] = await db
    .insert(schema.files)
    .values({
      filename,
      content: '',
    })
    .returning();

  return c.json({ success: true, file });
});

export default app;
