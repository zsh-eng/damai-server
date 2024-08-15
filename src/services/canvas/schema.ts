import { z } from "zod";

export const courseSchema = z.object({
    id: z.number(),
    name: z.string(),
    course_code: z.string(),
})
export type CanvasCourse = z.infer<typeof courseSchema>;

export const folderSchema = z.object({
    id: z.number(),
    parent_folder_id: z.number().nullable(),
    name: z.string(),
    full_name: z.string(),
    /**
     * The course ID for the folder.
     */
    context_id: z.number(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    folders_url: z.string().url(),
    files_url: z.string().url(),
})
export type CanvasFolder = z.infer<typeof folderSchema>;

export const fileSchema = z.object({
    id: z.number(),
    folder_id: z.number(),
    display_name: z.string(),
    filename: z.string(),
    "content-type": z.string(),
    /**
     * The url includess a verification token that allows us to download the file
     * without providing any additional authentication.
     */
    url: z.string().url(),
    size: z.number(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
})
export type CanvasFile = z.infer<typeof fileSchema>;
