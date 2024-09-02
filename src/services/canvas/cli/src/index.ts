#!/usr/bin/env node
import { logger } from "@/log";
import { CanvasClient } from "@/services/canvas/client";
import { downloadFilesForCourse } from "@/services/canvas/download";
import { program } from "commander";
import { readFile, writeFile } from "node:fs/promises";
import os from "os";
import path from "path";
import prompts from "prompts";

const BASE_PATH = ".";
const CONFIG_PATH = path.join(os.homedir(), ".canvas-sync/config.json");

async function readToken(): Promise<string | null> {
    try {
        const data = await readFile(CONFIG_PATH, "utf-8");
        const config = JSON.parse(data);
        if (!config.token || typeof config.token !== "string") {
            return null;
        }
        return config.token;
    } catch (err) {
        const error = err as { code?: string };
        if (error.code === "ENOENT") {
            return null;
        }
        throw err;
    }
}

async function writeToken(token: string) {
    await writeFile(CONFIG_PATH, JSON.stringify({ token }));
}

async function listCourses(client: CanvasClient) {
    // Dynamic import as ora is ESM only
    const ora = (await import("ora")).default;
    let spinner = ora("Fetching courses").start();
    const courses = await client.getAllCourses();
    spinner.stop();

    const answer = await prompts({
        type: "autocomplete",
        name: "value",
        message: "Choose a course to download files from",
        choices: [
            {
                title: "All",
                value: "all",
                selected: true,
            },
            ...courses.map((course) => ({
                title: course.name,
                value: course.id,
            })),
        ],
    });

    if (answer.value === "all") {
        spinner = ora("Syncing files for all courses").start();
        for (const course of courses) {
            spinner.text = `Syncing files for ${course.name}`;
            await downloadFilesForCourse(course, BASE_PATH, client);
            spinner.text = `Synced files for ${course.name}`;
        }
        spinner.succeed("Synced files for all courses");
        return;
    }

    const course = courses.find((course) => course.id === answer.value);
    if (!course) {
        logger.error("Course not found");
        return;
    }
    spinner = ora(`Syncing files for ${course.name}`).start();
    await downloadFilesForCourse(course, BASE_PATH, client);
    spinner.succeed(`Synced files for ${course.name}`);
}

program
    .name("canvas-sync")
    .description("Sync files from NUS Canvas to your local file system")
    .version("0.1.2");

program
    .command("sync")
    .description("Sync files from your Canvas courses.")
    .option("-t, --token <token>", "your Canvas API token")
    .option("-p, --path <path>", "the path to save files to (default is .)")
    .action(async (options) => {
        let { token, path } = options;

        const existingToken = await readToken();
        token = token || existingToken;

        if (!token || typeof token !== "string") {
            const response = await prompts({
                type: "password",
                name: "token",
                message: "Enter your Canvas API token",
            });
            if (!response.token) {
                console.error("You must provide a token!");
                return;
            }
            token = response.token.trim();
        }

        if (existingToken !== token) {
            await writeToken(token);
            console.log(`Token saved to ${CONFIG_PATH}`);
        }

        if (!path || typeof path !== "string") {
            const response = await prompts({
                type: "text",
                name: "path",
                message: "Enter the path to save files to",
                initial: BASE_PATH,
            });
            path = response.path;
        }

        const client = new CanvasClient(token);
        await listCourses(client);
    });

program.parse();
