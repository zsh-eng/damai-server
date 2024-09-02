import { CanvasClient } from "@/services/canvas/client";
import { downloadFilesForCourse } from "@/services/canvas/download";
import {
    CanvasCourse,
    CanvasFile,
    CanvasFolder,
} from "@/services/canvas/schema";
import path from "node:path";
import { vol } from "memfs";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { access, readFile } from "node:fs/promises";
import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

// tell vitest to use fs mock from __mocks__ folder
// this can be done in a setup file if fs should always be mocked
vi.mock("node:fs");
vi.mock("node:fs/promises");
vi.mock("@/services/canvas/client", async (importOriginal) => {
    const mod = await importOriginal<
        typeof import("@/services/canvas/client")
    >();
    const getFolders = vi.fn(async () => testFolders);
    const getFiles = vi.fn(async () => []);
    const CanvasClient = vi.fn(() => ({
        getFoldersForCourse: getFolders,
        getFilesForFolder: getFiles,
    }));
    // CanvasClient.prototype.getFoldersForCourse = getFolders;
    // CanvasClient.prototype.getFilesForFolder = getFiles;
    return {
        ...mod,
        CanvasClient,
    };
});
const mockCanvasClientClass = vi.mocked(CanvasClient);
const mockClient = new mockCanvasClientClass("");
const mockedFolders = vi.mocked(mockClient.getFoldersForCourse);
const mockedFiles = vi.mocked(mockClient.getFilesForFolder);

beforeEach(() => {
    // reset the state of in-memory fs
    vol.reset();
});

const mockCourse: CanvasCourse = {
    id: 63977,
    name: "NST2055 Comprehending Sound Around Us [2410]",
    course_code: "NST2055",
};

const testFolders: CanvasFolder[] = [
    {
        id: 1070454,
        parent_folder_id: 979411,
        name: "Course Notes",
        full_name: "course files/Course Notes",
        context_id: 63977,
        created_at: "2024-08-01T08:55:16Z",
        updated_at: "2024-08-01T08:55:16Z",
        folders_url: "https://canvas.nus.edu.sg/api/v1/folders/1070454/folders",
        files_url: "https://canvas.nus.edu.sg/api/v1/folders/1070454/files",
    },
    {
        id: 1070455,
        parent_folder_id: 979411,
        name: "Homework",
        full_name: "course files/Homework",
        context_id: 63977,
        created_at: "2024-08-01T08:55:23Z",
        updated_at: "2024-08-01T08:55:23Z",
        folders_url: "https://canvas.nus.edu.sg/api/v1/folders/1070455/folders",
        files_url: "https://canvas.nus.edu.sg/api/v1/folders/1070455/files",
    },
    {
        id: 1126677,
        parent_folder_id: 979411,
        name: "In-Class Activities",
        full_name: "course files/In-Class Activities",
        context_id: 63977,
        created_at: "2024-08-14T07:23:24Z",
        updated_at: "2024-08-14T07:23:24Z",
        folders_url: "https://canvas.nus.edu.sg/api/v1/folders/1126677/folders",
        files_url: "https://canvas.nus.edu.sg/api/v1/folders/1126677/files",
    },
    {
        id: 979411,
        parent_folder_id: null,
        name: "course files",
        full_name: "course files",
        context_id: 63977,
        created_at: "2024-04-24T22:32:02Z",
        updated_at: "2024-04-24T22:32:02Z",
        folders_url: "https://canvas.nus.edu.sg/api/v1/folders/979411/folders",
        files_url: "https://canvas.nus.edu.sg/api/v1/folders/979411/files",
    },
];

const files1: CanvasFile[] = [
    {
        id: 4569205,
        folder_id: 1070454,
        display_name: "NST2055 Chapter 0 - Course Information_v2.pdf",
        filename: "NST2055+Chapter+0+-+Course+Information_v2.pdf",
        "content-type": "application/pdf",
        url: "https://canvas.nus.edu.sg/files/4569205/download?download_frd=1&verifier=o8NV5OGMBOmV1LMaFlrNaZNfFNIUNljjYxi0mFpr",
        size: 618594,
        created_at: "2024-08-14T05:13:26Z",
        updated_at: "2024-08-14T05:27:32Z",
    },
    {
        id: 4580525,
        folder_id: 1070454,
        display_name: "NST2055 Chapter 1 - Basics_v2.pdf",
        filename: "NST2055+Chapter+1+-+Basics_v1.pdf",
        "content-type": "application/pdf",
        url: "https://canvas.nus.edu.sg/files/4580525/download?download_frd=1&verifier=AUCKftoKm0lQJ7DL2YWxkgNVUAIhQz7rT4A8wbt7",
        size: 2053651,
        created_at: "2024-08-15T10:45:01Z",
        updated_at: "2024-08-15T10:45:19Z",
    },
    {
        id: 4509063,
        folder_id: 1070454,
        display_name: "NST2055 Chapter 2 - Physical Phenomenon in Sound.pdf",
        filename: "NST2055+Chapter+2+-+Physical+Phenomenon+in+Sound.pdf",
        "content-type": "application/pdf",
        url: "https://canvas.nus.edu.sg/files/4509063/download?download_frd=1&verifier=ltFuPHwAmqRoMAkt08ueZRA4NuovsQGTtpk4QQ5h",
        size: 1334114,
        created_at: "2024-08-04T08:25:21Z",
        updated_at: "2024-08-06T03:00:34Z",
    },
];

const files2: CanvasFile[] = [
    {
        id: 4509040,
        folder_id: 1070455,
        display_name: "NST2055 - Homework.pdf",
        filename: "NST2055+-+Homework.pdf",
        "content-type": "application/pdf",
        url: "https://canvas.nus.edu.sg/files/4509040/download?download_frd=1&verifier=KaQCWOnZk6lxn76IJJTMxXkUudom2zNd0kI4oDeD",
        size: 150506,
        created_at: "2024-08-04T08:10:28Z",
        updated_at: "2024-08-14T05:29:45Z",
    },
];

const files3: CanvasFile[] = [
    {
        id: 4577263,
        folder_id: 1126677,
        display_name: "Standing Waves of Strings.pdf",
        filename: "Standing+Waves+of+Strings.pdf",
        "content-type": "application/pdf",
        url: "https://canvas.nus.edu.sg/files/4577263/download?download_frd=1&verifier=uim0SYqk7QoWZNAXnpr9aoIdm23UkWXpLAcQcZQ4",
        size: 157109,
        created_at: "2024-08-15T05:23:40Z",
        updated_at: "2024-08-15T05:23:45Z",
    },
];

const allFiles = [...files1, ...files2, ...files3];
const folderToFiles: Map<
    number,
    {
        folder: CanvasFolder;
        files: CanvasFile[];
    }
> = new Map(
    testFolders.map((folder) => [
        folder.id,
        {
            folder,
            files: [],
        },
    ])
);
allFiles.forEach((file) => {
    folderToFiles.get(file.folder_id)!.files.push(file);
});

const folderToFilesArr = Array.from(folderToFiles.values());

const fileHandlers = allFiles.map((file) => {
    return http.get(file.url, () => {
        const text = `This is the content of ${file.display_name}`;
        return HttpResponse.text(text, {
            headers: {
                "Content-Disposition": `attachment; filename="${file.display_name}"`,
            },
        });
    });
});

// Setting up the mock service worker to return a response
const restHandlers = [
    http.get("https://canvas.nus.edu.sg/api/v1/courses/63977/folders", () => {
        return HttpResponse.json({ hello: "world" });
    }),
];
const server = setupServer(...fileHandlers, ...restHandlers);
beforeAll(() => {
    server.listen();
});
afterAll(() => {
    server.close();
});
afterEach(() => {
    server.resetHandlers();
});

describe("downloadFilesForCourse", () => {
    it("should pass", () => {
        expect(true).toBe(true);
    });

    it("mock fs should work", async () => {
        vol.fromJSON(
            {
                "./dir1/hw.txt": "hello dir1",
                "./dir2/hw.txt": "hello dir2",
            },
            // default cwd
            "/tmp"
        );

        await expect(readFile("/tmp/dir1/hw.txt", "utf8")).resolves.toBe(
            "hello dir1"
        );
        await expect(readFile("/tmp/dir2/hw.txt", "utf8")).resolves.toBe(
            "hello dir2"
        );
    });

    it("should call CanvasClient", () => {
        new CanvasClient("");
        expect(mockCanvasClientClass).toHaveBeenCalled();
    });

    it("it should pass if there are just empty folders", async () => {
        await expect(
            downloadFilesForCourse(mockCourse, "/tmp", mockClient)
        ).resolves.toBe(undefined);

        expect(mockedFolders).toHaveBeenCalled();
        expect(mockedFiles).toHaveBeenCalledTimes(4);

        // check if the directories are created
        await expect(access("/tmp/NST2055/Course Notes")).resolves.toBe(
            undefined
        );
        await expect(access("/tmp/NST2055/Homework")).resolves.toBe(undefined);
        await expect(access("/tmp/NST2055/In-Class Activities")).resolves.toBe(
            undefined
        );
        await expect(access("/tmp/NST2055/course files")).rejects.toBeTruthy();
    });

    it("should fetch the file", async () => {
        const res = await fetch(files1[0].url);
        const text = await res.text();
        expect(text).toBe(`This is the content of ${files1[0].display_name}`);
    });

    it("should download files", async () => {
        console.log(vol.toJSON());
        mockedFiles.mockImplementationOnce(async (id) => {
            if (testFolders[0].id === id) {
                return files1;
            }
            return [];
        });

        await expect(
            downloadFilesForCourse(mockCourse, "/tmp", mockClient)
        ).resolves.toBe(undefined);

        for (const file of files1) {
            console.log(file.display_name);
            await expect(
                readFile(
                    `/tmp/NST2055/Course Notes/${file.display_name}`,
                    "utf8"
                )
            ).resolves.toBe(`This is the content of ${file.display_name}`);
        }
    });

    describe("Metadata file", () => {
        beforeAll(() => {
            mockedFiles.mockImplementation(async (id) => {
                if (testFolders[0].id === id) {
                    return files1;
                }
                return [];
            });
        });

        afterAll(() => {
            mockedFiles.mockImplementation(async () => []);
        });

        it("should create metadata.json file after", async () => {
            await expect(
                downloadFilesForCourse(mockCourse, "/tmp", mockClient)
            ).resolves.toBe(undefined);

            await expect(access("/tmp/NST2055/metadata.json")).resolves.toBe(
                undefined
            );
            const metadata = JSON.parse(
                await readFile("/tmp/NST2055/metadata.json", "utf-8")
            );
            expect(Object.entries(metadata).length).toBe(files1.length);
        });

        it("should create new metadata.json file if corrupted", async () => {
            vol.fromJSON(
                {
                    "./NST2055/metadata.json": "corrupted",
                },
                // default cwd
                "/tmp"
            );

            await expect(
                downloadFilesForCourse(mockCourse, "/tmp", mockClient)
            ).resolves.toBe(undefined);

            await expect(access("/tmp/NST2055/metadata.json")).resolves.toBe(
                undefined
            );
            const metadata = JSON.parse(
                await readFile("/tmp/NST2055/metadata.json", "utf-8")
            );
            expect(Object.entries(metadata).length).toBe(files1.length);
        });

        it("should not download file if already up to date", async () => {
            const metadata = Object.fromEntries(
                files1.map((file) => [file.id, file])
            );
            vol.fromJSON(
                {
                    "./NST2055/metadata.json": JSON.stringify(metadata),
                },
                // default cwd
                "/tmp"
            );

            const spy = vi.spyOn(global, "fetch");
            await expect(
                downloadFilesForCourse(mockCourse, "/tmp", mockClient)
            ).resolves.toBe(undefined);
            expect(spy).toHaveBeenCalledTimes(0);
        });

        it("should download file again if not exist", async () => {
            const metadata = Object.fromEntries(
                files1.map((file) => [file.id, file]).slice(1)
            );
            vol.fromJSON(
                {
                    "./NST2055/metadata.json": JSON.stringify(metadata),
                },
                // default cwd
                "/tmp"
            );

            const spy = vi.spyOn(global, "fetch");
            await expect(
                downloadFilesForCourse(mockCourse, "/tmp", mockClient)
            ).resolves.toBe(undefined);
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it("should download file again if not up-to-date", async () => {
            const oldDate = "2000-01-01T05:13:26Z";
            const firstFile = {
                ...files1[0],
            };
            firstFile.updated_at = oldDate;
            firstFile.created_at = oldDate;

            const metadata = Object.fromEntries(
                [firstFile, ...files1.slice(1)].map((file) => [file.id, file])
            );

            const firstFilePath = `/tmp/NST2055/Course Notes/${firstFile.display_name}`;
            vol.fromJSON(
                {
                    "./NST2055/metadata.json": JSON.stringify(metadata),
                    [firstFilePath]: `This is the old content`,
                },
                // default cwd
                "/tmp"
            );

            const spy = vi.spyOn(global, "fetch");
            await expect(
                downloadFilesForCourse(mockCourse, "/tmp", mockClient)
            ).resolves.toBe(undefined);

            expect(spy).toHaveBeenCalledTimes(1);
            const newMetadata = JSON.parse(
                await readFile("/tmp/NST2055/metadata.json", "utf-8")
            );
            expect(newMetadata[firstFile.id.toString()].updated_at).not.toBe(
                oldDate
            );
            expect(newMetadata[firstFile.id.toString()].updated_at).toBe(
                files1[0].updated_at
            );

            expect(
                await readFile(
                    "/tmp/NST2055/Course Notes/NST2055 Chapter 0 - Course Information_v3.pdf",
                    "utf-8"
                )
            ).toBe(`This is the content of ${firstFile.display_name}`);
        });

        it("should strip away version 1 in the filename");

        it("should throw error if hit retry limit", async () => {
            const limit = 10;
            const baseFilename =  "NST2055 Chapter 0 - Course Information"

            const fileNames = Array.from({ length: limit }, (_, i) => {
                if (i === 0) {
                    return `${baseFilename}.pdf`;
                }
                return `${baseFilename}_v${i+1}.pdf`;
            });
            const volJson = Object.fromEntries(
                fileNames.map((name) => [`./NST2055/Course Notes/${name}`, ""])
            );

            vol.fromJSON(
                volJson,
                // default cwd
                "/tmp"
            );

            const spy = vi.spyOn(global, "fetch");
            await expect(
                downloadFilesForCourse(mockCourse, "/tmp", mockClient)
            ).rejects.toThrowError(/Failed to write file after 10 retries/);
            expect(spy).toHaveBeenCalledTimes(1); // only single fetch
        });
    });

    // TODO: check if nested directory structures are handled correctly
});
