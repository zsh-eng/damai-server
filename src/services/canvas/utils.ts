
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
        return {}
    }

    const parts = linkHeader.split(',')
    if (parts.length === 0) {
        return {}
    }

    const links: Record<string, string> = {}
    for (const part of parts) {
        const section = part.split(';')
        if (section.length !== 2) {
            throw new Error('Section could not be split on ";"')
        }
        const url = section[0].replace(/<(.*)>/, '$1').trim();
        const name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;

    }

    return links 
}