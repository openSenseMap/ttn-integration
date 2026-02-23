import { logger } from "../logger.js";
import { TtnIntegration } from "../schema/index.js";
import type { DecodedMeasurement } from "../types.js";

/**
 * Decode pre-decoded JSON payload (from TTN payload function)
 * Expected format: { sensor_id: value, ... } or array of measurements
 */
export async function decodeJson(
  payload: Record<string, any>,
  integration: TtnIntegration,
  timestamp: Date
): Promise<DecodedMeasurement[]> {
  const measurements: DecodedMeasurement[] = [];

  // Handle array format
  if (Array.isArray(payload)) {
    for (const item of payload) {
      if (item.sensor_id || item.sensor) {
        measurements.push({
          sensor_id: item.sensor_id || item.sensor,
          value: parseFloat(item.value),
          createdAt: item.createdAt ? new Date(item.createdAt) : timestamp,
          location: item.location,
        });
      }
    }
  }
  // Handle object format { sensor_id: value }
  else if (typeof payload === "object") {
    for (const [sensorId, value] of Object.entries(payload)) {
      // Skip metadata fields
      if (
        sensorId === "time" ||
        sensorId === "timestamp" ||
        sensorId === "location"
      ) {
        continue;
      }

      measurements.push({
        sensor_id: sensorId,
        value: typeof value === "number" ? value : parseFloat(value as string),
        createdAt: timestamp,
      });
    }
  }

  if (measurements.length === 0) {
    throw new Error("No measurements found in JSON payload");
  }

  logger.debug(`Decoded ${measurements.length} measurements from JSON payload`);

  return measurements;
}