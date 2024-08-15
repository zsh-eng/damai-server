import { CanvasFolder } from "@/services/canvas/schema";
import {
    folderArrayToAdjacencyList,
    parseLinkHeaders,
} from "@/services/canvas/utils";
import { describe, expect, it } from "vitest";

const SAMPLE_CANVAS_LINK_HEADER = `<https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10>; rel="current",<https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10>; rel="first",<https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10>; rel="last"`;
const CORRUPTED_CANVAS_LINK_HEADER = `<https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10>; rel="current",<https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10>; rel="first",<https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10> rel="last"`;

describe("parseLinkHeaders", () => {
    it("should return empty object if linkHeader is undefined", () => {
        const linkHeader = undefined;
        const result = parseLinkHeaders(linkHeader);
        expect(result).toEqual({});
    });

    it("should return empty object if linkHeader is empty", () => {
        const linkHeader = "";
        const result = parseLinkHeaders(linkHeader);
        expect(result).toEqual({});
    });

    it("should return object with links", () => {
        const result = parseLinkHeaders(SAMPLE_CANVAS_LINK_HEADER);
        expect(result).toEqual({
            current:
                "https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10",
            first: "https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10",
            last: "https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10",
        });
    });

    it("should throw error if linkHeader is corrupted", () => {
        expect(() =>
            parseLinkHeaders(CORRUPTED_CANVAS_LINK_HEADER)
        ).toThrowError('Section could not be split on ";"');
    });
});

describe("folderArrayToAdjacencyList", () => {
    const mockFolder = {
        id: 1,
        parent_folder_id: null,
    } as CanvasFolder;
    const mockFolder2 = {
        id: 2,
        parent_folder_id: 1,
    } as CanvasFolder;
    const mockFolder3 = {
        id: 3,
        parent_folder_id: 2,
    } as CanvasFolder;
    const mockFolder4 = {
        id: 4,
        parent_folder_id: 1,
    } as CanvasFolder;

    it("should return the root folder if given 1 folder", () => {
        expect(folderArrayToAdjacencyList([mockFolder])).toEqual({
            root: mockFolder,
            list: {
                1: {
                    folder: mockFolder,
                    children: [],
                },
            },
        });
    });

    it("should throw an error if no root folder is found", () => {
        expect(() => folderArrayToAdjacencyList([mockFolder2])).toThrowError(
            "No root folder found"
        );
    });

    it("should return the root folder and the adjacency list", () => {
        const result = folderArrayToAdjacencyList([
            mockFolder,
            mockFolder2,
            mockFolder3,
            mockFolder4,
        ]);
        expect(result).toEqual({
            root: mockFolder,
            list: {
                1: {
                    folder: mockFolder,
                    children: [mockFolder2, mockFolder4],
                },
                2: {
                    folder: mockFolder2,
                    children: [mockFolder3],
                },
                3: {
                    folder: mockFolder3,
                    children: [],
                },
                4: {
                    folder: mockFolder4,
                    children: [],
                },
            },
        });
    });

    it("should throw an error if parent folder is not found", () => {
        const mockFolder5 = {
            id: 5,
            parent_folder_id: 6,
        } as CanvasFolder;

        expect(() =>
            folderArrayToAdjacencyList([
                mockFolder,
                mockFolder2,
                mockFolder3,
                mockFolder4,
                mockFolder5,
            ])
        ).toThrowError("Parent folder with ID 6 not found");
    });
});
