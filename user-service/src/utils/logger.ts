import pino from "pino";

const logger = pino({
//   level: process.env.LOG_LEVEL || "info",
  level: "info",
  base: { service: process.env.SERVICE_NAME || "user-service" },
  transport: process.env.NODE_ENV === "development"
    ? {
        target: "pino-pretty",
        options: { colorize: true }
      }
    : undefined
});

export default logger;
