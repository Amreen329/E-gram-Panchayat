import { logToFirebase } from "./firebase.js";

const LOG_LEVELS = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
};

class Logger {
  constructor(context = "APP") {
    this.context = context;
    this.enabled = true;
  }

  setEnabled(isEnabled) {
    this.enabled = isEnabled;
  }

  async log(level, message, meta = {}) {
    if (!this.enabled) return;

    const payload = {
      timestamp: new Date().toISOString(),
      context: this.context,
      level,
      message,
      ...meta,
    };

    // Console logging for local debugging
    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error("[GP]", payload);
        break;
      case LOG_LEVELS.WARN:
        console.warn("[GP]", payload);
        break;
      case LOG_LEVELS.DEBUG:
        console.debug("[GP]", payload);
        break;
      default:
        console.info("[GP]", payload);
    }

    // Persist log to Firebase (FireBaseLogging requirement)
    await logToFirebase(payload);
  }

  debug(message, meta) {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }

  info(message, meta) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  warn(message, meta) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  error(message, meta) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }
}

// Export a singleton app logger
export const appLogger = new Logger("FRONTEND");
export { LOG_LEVELS, Logger };