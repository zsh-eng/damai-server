import db from '@/db';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();
app.use(cors());

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.get('/files', async (c) => {
  const files = await db.query.files.findMany();
  return c.json(files);
});

const updateFileSchema = z.object({
  content: z.string(),
});

app.put('/files/:id', zValidator('json', updateFileSchema), async (c) => {
  const idString = c.req.param('id');
  const id = Number(idString);
  if (isNaN(id)) {
    return c.json({ error: 'Invalid id' }, 400);
  }

  const body = c.req.valid('json');
  await db
    .update(schema.files)
    .set({ content: body.content })
    .where(eq(schema.files.id, id));
  
  return c.json({ success: true });
});

export default app;
