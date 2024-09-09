import { info, warning, error } from "@actions/core";

export const logger = {
  info: (message: string): void => info(`INFO: ${message}`),
  warn: (message: string): void => warning(`WARNING: ${message}`),
  error: (message: string): void => error(`ERROR: ${message}`),
};
