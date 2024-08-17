import { logger } from "@/log";
import { ENDPOINTS } from "@/services/canvas/constants";
import {
    CanvasCourse,
    CanvasFile,
    CanvasFolder,
    courseSchema,
    fileSchema,
    folderSchema,
} from "@/services/canvas/schema";
import { parseLinkHeaders } from "@/services/canvas/utils";

export class ForbiddenCanvasClientError extends Error {
    constructor() {
        super("UnauthorizedCanvasClientError");
    }
}
const FORBIDDEN_STATUS = 403;

/**
 * A client for accessing the Canvas API.
 */
export class CanvasClient {
    static readonly BASE_URL = "https://canvas.nus.edu.sg/api/v1";
    private readonly token: string;

    constructor(token: string) {
        if (!token) {
            throw new Error("Token is required to create a CanvasClient");
        }
        this.token = token;
    }

    private makeUrl(path: string): URL {
        const url = new URL(CanvasClient.BASE_URL);
        url.pathname += path;
        return url;
    }

    /**
     * A helper method to make a GET request to the Canvas API.
     * @param path the relative path to the endpoint
     * @param options additional options to pass to the fetch function
     * @returns the response from the API
     */
    private async request<T>(
        path: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = this.makeUrl(path);
        logger.info(`Making request to ${url}`);
        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.token}`,
                ...options.headers,
            },
        });

        logger.info(`Request to ${url} completed`);
        if (!response.ok) {
            logger.info(
                `Request to ${url} failed with status ${response.status}`
            );
            throw new Error(`Request failed with status ${response.status}`);
        }

        logger.info(`Request to ${url} successful, parsing JSON`);
        return response.json();
    }

    /**
     * A helper method to make a Paginated GET request to the Canvas API.
     * Canvas uses Link headers to provide pagination information.
     *
     * Note, we can only use this method if we are sure the API returns an array.
     *
     * @param path the relative path to the endpoint
     * @param options additional options to pass to the fetch function
     * @returns the response from the API
     */
    async paginatedRequest<T>(
        path: string,
        options: RequestInit = {}
    ): Promise<T[]> {
        const result: T[] = [];

        let url = this.makeUrl(path);
        logger.info(`Making initial request to ${url}`);
        const response = await fetch(`${CanvasClient.BASE_URL}${path}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.token}`,
                ...options.headers,
            },
        });

        if (response.status === FORBIDDEN_STATUS) {
            throw new ForbiddenCanvasClientError();
        }

        const linkHeader = response.headers.get("Link");
        if (!linkHeader) {
            logger.error(`Link header not found in response from ${url}`);
            throw new Error(
                "Link header not found. This method should only be used for paginated requests."
            );
        }

        const links = parseLinkHeaders(linkHeader);
        const first = new URL(links.first);
        if (!first) {
            logger.error(`First link not found in response from ${url}`);
            throw new Error(
                "First link not found. This method should only be used for paginated requests."
            );
        }

        logger.info(
            `Request to ${url} completed. Starting pagination to first: ${first}`
        );
        url = first;
        let pageNumber = 1;
        while (url) {
            logger.info(
                `Making paginated request to page ${[pageNumber]}: ${url}`
            );
            const response = await fetch(url, {
                ...options,
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    ...options.headers,
                },
            });

            if (!response.ok) {
                logger.error(
                    `Paginated request to ${url} failed with status ${response.status}`
                );
                throw new Error(
                    `Paginated request failed with status ${response.status}`
                );
            }

            const data = await response.json();
            logger.info(
                `Paginated request to ${url} successful. Adding ${data.length} data from page ${pageNumber} to result`
            );
            result.push(...data);

            const linkHeader = response.headers.get("Link");
            if (!linkHeader) {
                logger.error(`Link header not found in response from ${url}`);
                throw new Error("Link header not found.");
            }

            const links = parseLinkHeaders(linkHeader);
            if (!links.next) {
                logger.info(
                    `No next link found in response from ${url}, stopping pagination`
                );
                return result;
            }

            const next = new URL(links.next);
            logger.info(`Next link found in response from ${url}: ${next}`);
            url = next;
            pageNumber += 1;
        }

        return result;
    }

    /**
     *
     * @returns the list of active courses for the user
     */
    async getAllCourses(): Promise<CanvasCourse[]> {
        const res = await this.paginatedRequest<unknown>(ENDPOINTS.ALL_COURSES);
        const courses = res
            .filter(
                (course): course is CanvasCourse =>
                    courseSchema.safeParse(course).success
            )
            .map((course) => courseSchema.parse(course));

        return courses;
    }

    /**
     * Returns the list of folders for a course.
     * @param id the course ID
     * @returns the list of folders for the course
     */
    async getFoldersForCourse(id: number): Promise<CanvasFolder[]> {
        const res = await this.paginatedRequest<unknown>(
            ENDPOINTS.COURSE_FOLDER(id)
        );
        const folders = res
            .filter(
                (folder): folder is CanvasFolder =>
                    folderSchema.safeParse(folder).success
            )
            .map((folder) => folderSchema.parse(folder));

        return folders;
    }

    /**
     * Returns the list of files for a folder.
     * @param id the folder ID
     * @returns the list of files for the folder
     */
    async getFilesForFolder(id: number): Promise<CanvasFile[]> {
        const res = await this.paginatedRequest<unknown>(
            ENDPOINTS.FOLDER_FILES(id)
        );
        const files = res
            .filter(
                (file): file is CanvasFile => fileSchema.safeParse(file).success
            )
            .map((file) => fileSchema.parse(file));

        return files;
    }
}
