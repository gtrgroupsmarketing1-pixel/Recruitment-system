/**
 * Minimal PII-safe logger. One JSON object per line on stdout.
 * Redacts by key name only — no value scanning.
 * Convention: never interpolate values into msg; put them in fields.
 */
import { isSensitiveLogKey } from "@/lib/logger.denylist";

export type LogFields = Record<string, unknown>;

type Level = "info" | "warn" | "error";

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = isSensitiveLogKey(k) ? "[redacted]" : redact(v);
    }
    return out;
  }
  return value;
}

function emit(level: Level, bindings: LogFields, fields: LogFields, msg: string): void {
  const line = {
    level,
    time: new Date().toISOString(),
    msg,
    ...(redact({ ...bindings, ...fields }) as LogFields),
  };
  // Single JSON line. This is the only console.log allowed in the app.
  console.log(JSON.stringify(line));
}

function createLogger(bindings: LogFields) {
  return {
    info(fields: LogFields, msg: string): void {
      emit("info", bindings, fields, msg);
    },
    warn(fields: LogFields, msg: string): void {
      emit("warn", bindings, fields, msg);
    },
    error(fields: LogFields, msg: string): void {
      emit("error", bindings, fields, msg);
    },
    child(extra: LogFields) {
      return createLogger({ ...bindings, ...extra });
    },
    /** Redacted copy of fields. Does not emit. Used by tests and preview paths. */
    format(fields: LogFields): LogFields {
      return redact({ ...bindings, ...fields }) as LogFields;
    },
  };
}

export const logger = createLogger({});
export type Logger = typeof logger;
