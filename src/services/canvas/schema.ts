import { z } from "zod";

export const courseSchema = z.object({
    id: z.number(),
    name: z.string(),
    course_code: z.string(),
})

export type Course = z.infer<typeof courseSchema>;