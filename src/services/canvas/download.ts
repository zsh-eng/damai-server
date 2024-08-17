import { logger } from "@/log";
import {
    CanvasClient,
    ForbiddenCanvasClientError,
} from "@/services/canvas/client";
import { CanvasCourse, fileSchema } from "@/services/canvas/schema";
import { generateFolderPath } from "@/services/canvas/utils";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

/**
 * Downloads a file from a given URL to the file system.
 * If the file already exists, it will append a version number to the filename
 * up till the retry limit.
 *
 * @param url
 * @param initialFilepath
 * @returns
 */
async function downloadFile(
    url: string,
    initialFilepath: string,
    retryLimit = 10
) {
    logger.info(`Downloading ${url} to ${initialFilepath}`);
    const res = await fetch(url);
    // We don't use `Bun.write` here because Bun APIs don't work properly
    // in Vitest at the moment.
    const arrayBuffer = await res.arrayBuffer();
    let filepath = initialFilepath;
    let count = 1;

    for (let i = 0; i < retryLimit; i++) {
        try {
            await writeFile(filepath, Buffer.from(arrayBuffer), {
                flag: "wx",
            });
            logger.info(`Successfully downloaded ${url} to ${filepath}`);
            return;
        } catch (err) {
            const error = err as { code?: string };
            if (error?.code !== "EEXIST") {
                throw err;
            }

            logger.info(`File already exists at ${filepath}, skipping...`);
            count += 1;
            filepath = `${initialFilepath}_v${count}`;
        }
    }

    throw new Error(
        `Failed to write file after ${retryLimit} retries. Final filename: ${filepath}`
    );
}

// Coerce to number because JSON keys are always strings
const metadataSchema = z.record(z.coerce.number(), fileSchema);
type DownloadedFilesMetadata = z.infer<typeof metadataSchema>;

const METADATA_FILENAME = "metadata.json";

/**
 * Reads the metadata file from the root folder.
 *
 * @param rootFolder the root folder to read the metadata file from
 * @returns the metadata file as a record of file id (number) to file
 */
async function readMetadataFile(rootFolder: string) {
    let existingFiles: z.infer<typeof metadataSchema> = {};
    logger.info(`Attempting to read metadata from root folder ${rootFolder}`);
    try {
        const metadataString = await readFile(
            path.join(rootFolder, METADATA_FILENAME),
            "utf-8"
        );
        const metadata = metadataSchema.parse(JSON.parse(metadataString));
        existingFiles = metadata;
    } catch (err) {
        const error = err as { code?: string };
        if (error?.code === "ENOENT") {
            logger.info(
                `${METADATA_FILENAME} file not found, defaulting to {}...`
            );
        } else {
            logger.error("Error in reading metadata, defaulting to {}...", err);
        }
    }
    return existingFiles;
}

/**
 * Downloads all files for a given canvas course to the file system.
 *
 * Saves a metadata file with the list of the most updated files.
 *
 * @param course the canvas course to download files for
 * @param basePath the base path to download the files to
 */
export async function downloadFilesForCourse(
    course: CanvasCourse,
    basePath: string,
    client: CanvasClient
): Promise<void> {
    logger.info("Downloading files for course", course.name);
    try {
        const folders = await client.getFoldersForCourse(course.id);
        const rootFolder = path.join(basePath, course.course_code);
        const existingFiles = await readMetadataFile(rootFolder);

        let count = 0;
        for (const folder of folders) {
            const directory = generateFolderPath(folder, rootFolder);

            logger.info(
                `Creating directory ${directory} if it doesn't exist...`
            );
            await mkdir(directory, { recursive: true });

            logger.info(`Retrieving file information for ${directory}`);
            const files = await client.getFilesForFolder(folder.id);
            const newFiles = files.filter(
                (file) =>
                    !existingFiles[file.id] ||
                    file.updated_at > existingFiles[file.id].updated_at
            );
            logger.info(`${newFiles.length} out of ${files.length} are new`);
            logger.info(
                `Downloading ${newFiles.length} files for ${directory}`
            );

            // Download sequentially as there are some non-terminating requests
            // when downloading files concurrently. E.g. CS1231S
            for (const file of newFiles) {
                logger.info(
                    `Downloading ${file.url} to ${path.join(
                        directory,
                        file.display_name
                    )}`
                );
                await downloadFile(
                    file.url,
                    path.join(directory, file.display_name)
                );
                existingFiles[file.id] = file;
                logger.info(
                    `Successfully downloaded ${file.url} to ${path.join(
                        directory,
                        file.display_name
                    )}`
                );
            }
            logger.info(
                `Finished downloading ${newFiles.length} files for ${directory}`
            );
            count += newFiles.length;
        }

        await writeFile(
            path.join(rootFolder, METADATA_FILENAME),
            JSON.stringify(existingFiles, null, 2)
        );

        logger.info("Finished downloading all files for course", course.name);
        // console.log(
        //     `Downloaded \x1b[32m${count} files\x1b[0m for ${course.course_code}.`
        // );
    } catch (error) {
        if (error instanceof ForbiddenCanvasClientError) {
            logger.error(
                "Failed to download files for course",
                course.name,
                "due to insufficient permissions"
            );
            return;
        }
        throw error;
    }
}
