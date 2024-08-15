import { CanvasClient } from "@/services/canvas/client";
import { downloadFilesForCourse } from "@/services/canvas/download";

const client = new CanvasClient(process.env.CANVAS_TOKEN!);

const BASE_PATH = "src/scripts/files";
async function main() {
    const courses = await client.getAllCourses();
    console.log(courses);
    for (const course of courses) {
        await downloadFilesForCourse(course, BASE_PATH, client);
    }
}

main();
