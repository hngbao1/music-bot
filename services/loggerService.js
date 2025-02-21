const winston = require("winston");
const path = require("path");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "DD-MM-YYYY HH:mm:ss",
    }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/error.log"),
      level: "error",
      format: winston.format.combine(
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          return `[${timestamp}] ${level.toUpperCase()}: ${message} ${
            Object.keys(metadata).length
              ? JSON.stringify(metadata, null, 2)
              : ""
          }`;
        })
      ),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/combined.log"),
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          return `[${timestamp}] ${level}: ${message} ${
            Object.keys(metadata).length
              ? JSON.stringify(metadata, null, 2)
              : ""
          }`;
        })
      ),
    })
  );
}

module.exports = logger;
