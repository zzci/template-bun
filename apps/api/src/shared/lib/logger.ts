import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createConsola } from "consola";
import pino from "pino";

const VALID_LEVELS = new Set(["debug", "info", "warn", "error"]);
const CONSOLA_LEVEL_MAP: Record<string, number> = { debug: 4, info: 3, warn: 2, error: 1, fatal: 0 };

interface LoggerConfig {
  readonly LOG_LEVEL: string;
  readonly LOG_FILE: string;
}

function createMethod(
  consola: ReturnType<typeof createConsola>,
  file: pino.Logger,
  name: "debug" | "info" | "warn" | "error" | "fatal",
) {
  return (objOrMsg: unknown, msg?: string) => {
    if (typeof objOrMsg === "string") {
      consola[name](objOrMsg);
      file[name](objOrMsg);
    }
    else {
      consola[name](msg ?? "", objOrMsg);
      file[name](objOrMsg as object, msg ?? "");
    }
  };
}

export function createLogger(config: LoggerConfig) {
  const level = VALID_LEVELS.has(config.LOG_LEVEL) ? config.LOG_LEVEL : "info";

  const consola = createConsola({
    level: CONSOLA_LEVEL_MAP[level] ?? 3,
    formatOptions: { date: true, colors: true },
  });

  mkdirSync(dirname(config.LOG_FILE), { recursive: true });
  const dest = pino.destination(config.LOG_FILE);
  const fileLogger = pino(
    {
      level,
      redact: {
        paths: ["req.headers.authorization", "*.password", "*.token", "*.secret"],
        censor: "[REDACTED]",
      },
    },
    dest,
  );

  return {
    debug: createMethod(consola, fileLogger, "debug"),
    info: createMethod(consola, fileLogger, "info"),
    warn: createMethod(consola, fileLogger, "warn"),
    error: createMethod(consola, fileLogger, "error"),
    fatal: createMethod(consola, fileLogger, "fatal"),
    // Backend logger flush; unrelated to React DOM's flushSync API.
    // eslint-disable-next-line react-dom/no-flush-sync
    flush: () => dest.flushSync(),
  };
}

export type Logger = ReturnType<typeof createLogger>;
