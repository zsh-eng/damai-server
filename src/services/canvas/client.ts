
/**
 * A client for accessing the Canvas API.
 */
class CanvasClient {
    static readonly BASE_URL = 'https://canvas.nus.edu.sg/api/v1';
    private readonly token: string;

    constructor(token: string) {
        this.token = token;
    }

    /**
     * A helper method to make a GET request to the Canvas API.
     * @param path the relative path to the endpoint
     * @param options additional options to pass to the fetch function
     * @returns the response from the API
     */
    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${CanvasClient.BASE_URL}/${path}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.token}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        return response.json();
    }
}