import os from "os";
import path from "path";
import winston from "winston";

const BASE_DIRECTORY =
    process.env.NODE_ENV === "production"
        ? path.join(os.homedir(), ".canvas-sync")
        : ".";

const transports = [
    new winston.transports.File({
        filename: path.join(BASE_DIRECTORY, "error.log"),
        level: "error",
    }),
    new winston.transports.File({
        filename: path.join(BASE_DIRECTORY, "combined.log"),
    }),
];

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    defaultMeta: { service: "user-service" },
    transports,
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    );
}
