import { CanvasFolder } from "@/services/canvas/schema";

/**
 * Parses the link header into a record of links.
 *
 * @example
 * ```ts
 * const link = parseLinkHeaders('<https://canvas.instructure.com/api/v1/courses/1/assignments?page=1&per_page=10>; rel="current", <https://canvas.instructure.com/api/v1/courses/1/assignments?page=2&per_page=10>; rel="next", <https://canvas.instructure.com/api/v1/courses/1/assignments?page=1&per_page=10>; rel="first", <https://canvas.instructure.com/api/v1/courses/1/assignments?page=2&per_page=10>; rel="last"')
 * ```
 */
export function parseLinkHeaders(linkHeader?: string): Record<string, string> {
    if (!linkHeader) {
        return {};
    }

    const parts = linkHeader.split(",");
    if (parts.length === 0) {
        return {};
    }

    const links: Record<string, string> = {};
    for (const part of parts) {
        const section = part.split(";");
        if (section.length !== 2) {
            throw new Error('Section could not be split on ";"');
        }
        const url = section[0].replace(/<(.*)>/, "$1").trim();
        const name = section[1].replace(/rel="(.*)"/, "$1").trim();
        links[name] = url;
    }

    return links;
}

/**
 * Returns an adajacency list representing the parent to child relationship of the folders.
 * @param folders a list of Canvas folders
 * @returns an object with the root folder and the adjacency list
 */
export function folderArrayToAdjacencyList(folders: CanvasFolder[]): {
    root: CanvasFolder;
    list: Record<
        number,
        {
            folder: CanvasFolder;
            children: CanvasFolder[];
        }
    >;
} {
    const root = folders.find((folder) => !folder.parent_folder_id);
    if (!root) {
        throw new Error("No root folder found");
    }

    const adjacencyList: Record<
        number,
        {
            folder: CanvasFolder;
            children: CanvasFolder[];
        }
    > = {};
    for (const folder of folders) {
        adjacencyList[folder.id] = {
            folder,
            children: [],
        };
    }

    for (const folder of folders) {
        if (!folder.parent_folder_id) {
            continue;
        }

        const parentId = folder.parent_folder_id;
        const entry = adjacencyList[parentId];
        if (!entry) {
            throw new Error(`Parent folder with ID ${parentId} not found`);
        }

        entry.children.push(folder);
    }

    return {
        root,
        list: adjacencyList,
    };
}
