import {
    CanvasClient,
    ForbiddenCanvasClientError,
} from "@/services/canvas/client";
import { CanvasCourse } from "@/services/canvas/schema";
import { generateFolderPath } from "@/services/canvas/utils";
import { write } from "bun";
import { mkdir } from "node:fs/promises";
import path from "node:path";

async function downloadFile(url: string, filepath: string) {
    console.log(`Downloading ${url} to ${filepath}`);
    const res = await fetch(url);
    await write(filepath, res);
    console.log(`Successfully downloaded ${url} to ${filepath}`);
}

/**
 * Downloads all files for a given canvas course to the file system.
 *
 * @param course the canvas course to download files for
 * @param basePath the base path to download the files to
 */
export async function downloadFilesForCourse(
    course: CanvasCourse,
    basePath: string,
    client: CanvasClient
): Promise<void> {
    console.log("Downloading files for course", course.name);
    try {
        const folders = await client.getFoldersForCourse(course.id);

        const rootFolder = path.join(basePath, course.course_code);
        for (const folder of folders) {
            const directory = generateFolderPath(folder, rootFolder);

            console.log(
                `Creating directory ${directory} if it doesn't exist...`
            );
            await mkdir(directory, { recursive: true });

            console.log(`Retrieving file information for ${directory}`);
            const files = await client.getFilesForFolder(folder.id);
            console.log(`Downloading ${files.length} files for ${directory}`);

            // Download sequentially as there are some non-terminating requests
            // when downloading files concurrently. E.g. CS1231S
            for (const file of files) {
                console.log(
                    `Downloading ${file.url} to ${path.join(
                        directory,
                        file.display_name
                    )}`
                );
                await downloadFile(
                    file.url,
                    path.join(directory, file.display_name)
                );
                console.log(
                    `Successfully downloaded ${file.url} to ${path.join(
                        directory,
                        file.display_name
                    )}`
                );
            }

            console.log(
                `Finished downloading ${files.length} files for ${directory}`
            );
        }

        console.log("Finished downloading all files for course", course.name);
    } catch (error) {
        if (error instanceof ForbiddenCanvasClientError) {
            console.error(
                "Failed to download files for course",
                course.name,
                "due to insufficient permissions"
            );
            return;
        }
        throw error;
    }
}
