import type { Sensor } from "../types.js";

/**
 * Find sensor IDs that match the given criteria
 * Ported from the original helpers.js
 */
export function findSensorIds(
  sensors: Sensor[],
  matchings: Array<Partial<Record<keyof Sensor, string[]>>>
): string[] {
  const sensorIds: string[] = [];

  for (const matching of matchings) {
    let matchedSensor: Sensor | undefined;

    for (const sensor of sensors) {
      let matches = true;

      for (const [key, values] of Object.entries(matching)) {
        if (!values.includes(sensor[key as keyof Sensor])) {
          matches = false;
          break;
        }
      }

      if (matches) {
        matchedSensor = sensor;
        break;
      }
    }

    if (matchedSensor) {
      sensorIds.push(matchedSensor.id);
    } else {
      throw new Error(
        `No sensor found matching criteria: ${JSON.stringify(matching)}`
      );
    }
  }

  return sensorIds;
}

/**
 * Decode base64 payload to Buffer
 */
export function decodeBase64(payload: string): Buffer {
  return Buffer.from(payload, "base64");
}