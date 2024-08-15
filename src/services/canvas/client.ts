import { parseLinkHeaders } from "@/services/canvas/utils";

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
        console.log(`Making request to ${url}`);
        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.token}`,
                ...options.headers,
            },
        });

        console.log(`Request to ${url} completed`);
        if (!response.ok) {
            console.log(
                `Request to ${url} failed with status ${response.status}`
            );
            throw new Error(`Request failed with status ${response.status}`);
        }

        console.log(`Request to ${url} successful, parsing JSON`);
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
        console.log(`Making initial request to ${url}`);
        const response = await fetch(`${CanvasClient.BASE_URL}${path}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.token}`,
                ...options.headers,
            },
        });

        const linkHeader = response.headers.get("Link");
        if (!linkHeader) {
            console.error(`Link header not found in response from ${url}`);
            throw new Error(
                "Link header not found. This method should only be used for paginated requests."
            );
        }

        const links = parseLinkHeaders(linkHeader);
        const first = new URL(links.first);
        if (!first) {
            console.error(`First link not found in response from ${url}`);
            throw new Error(
                "First link not found. This method should only be used for paginated requests."
            );
        }

        console.log(
            `Request to ${url} completed. Starting pagination to first: ${first}`
        );
        url = first;
        let pageNumber = 1;
        while (url) {
            console.log(`Making paginated request to page ${[pageNumber]}: ${url}`);
            const response = await fetch(url, {
                ...options,
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    ...options.headers,
                },
            });

            if (!response.ok) {
                console.error(
                    `Paginated request to ${url} failed with status ${response.status}`
                );
                throw new Error(
                    `Paginated request failed with status ${response.status}`
                );
            }

            const data = await response.json();
            console.log(
                `Paginated request to ${url} successful. Adding data from page ${pageNumber} to result`
            );
            result.push(...data);

            const linkHeader = response.headers.get("Link");
            if (!linkHeader) {
                console.error(`Link header not found in response from ${url}`);
                throw new Error("Link header not found.");
            }

            const links = parseLinkHeaders(linkHeader);
            if (!links.next) {
                console.log(
                    `No next link found in response from ${url}, stopping pagination`
                );
                return result
            }

            const next = new URL(links.next);
            console.log(`Next link found in response from ${url}: ${next}`);
            url = next;
            pageNumber += 1;
        }

        return result;
    }
}
