import db from '@/db';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as schema from '@/db/schema';
import { asc, desc, eq, sql } from 'drizzle-orm';

const app = new Hono();
app.use(cors());

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.get('/files', async (c) => {
  const files = await db.query.files.findMany({
    orderBy: [asc(schema.files.created_at), asc(schema.files.id)],
    where: eq(schema.files.is_deleted, false),
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

app.delete('/files/:id', async (c) => {
  const idString = c.req.param('id');
  const id = Number(idString);
  if (isNaN(id)) {
    return c.json({ error: 'Invalid id' }, 400);
  }

  await db
    .update(schema.files)
    .set({ is_deleted: true })
    .where(eq(schema.files.id, id));

  return c.json({ success: true });
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

app.get(
  'search',
  zValidator(
    'query',
    z.object({
      query: z.string(),
    })
  ),
  async (c) => {
    const { query } = c.req.valid('query');
    const files = await db
      .select({
        id: schema.files.id,
        content: schema.files.content,
        rank: sql`ts_rank_cd(to_tsvector(${schema.files.content}), to_tsquery(${query})) AS rank`,
      })
      .from(schema.files)
      .orderBy(desc(sql`rank`))
      .where(sql`to_tsvector(${schema.files.content}) @@ to_tsquery(${query})`);

    return c.json(files);
  }
);

export default app;
