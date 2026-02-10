import dotenv from "dotenv";
import type { Config } from "./types.js";

dotenv.config();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

export const config: Config = {
  API_URL: getEnv("API_URL", "http://localhost:3000"),
  API_SERVICE_KEY: getEnv("API_SERVICE_KEY"),
  PORT: getEnvNumber("PORT", 3001),
  LOG_LEVEL: getEnv("LOG_LEVEL", "info"),
  RETRY_ATTEMPTS: getEnvNumber("RETRY_ATTEMPTS", 3),
  RETRY_DELAY_MS: getEnvNumber("RETRY_DELAY_MS", 5000),
};