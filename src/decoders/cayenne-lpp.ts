import { logger } from "../logger.js";
import type { TtnIntegration } from "../schema/index.js";
import type { DecodedMeasurement } from "../types.js";

interface ValidatedCayenneOption {
  decoder: string;
  channel: number;
  sensor_id: string;
  [key: string]: any;
}

function isValidCayenneOption(option: any): option is ValidatedCayenneOption {
  return (
    typeof option === 'object' &&
    option !== null &&
    typeof option.decoder === 'string' &&
    typeof option.channel === 'number' &&
    typeof option.sensor_id === 'string' 
  );
}

/**
 * Decode Cayenne LPP payload
 * Note: TTN v3 already decodes Cayenne LPP format in decoded_payload,
 * so we just need to map the decoded values to sensors
 */
export async function decodeCayenneLpp(
  payload: Record<string, any>,
  integration: TtnIntegration,
  timestamp: Date
): Promise<DecodedMeasurement[]> {
  const rawOptions = integration.decodeOptions;

  if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
    throw new Error("profile 'cayenne-lpp' requires valid decodeOptions array");
  }

  const decodeOptions = rawOptions.filter(isValidCayenneOption);

  if (decodeOptions.length === 0) {
    throw new Error(
      "profile 'cayenne-lpp' requires decodeOptions with sensor_id, decoder, and channel"
    );
  }

  logger.debug("Decoding Cayenne LPP payload", {
    optionsCount: decodeOptions.length,
  });

  // Extract location if present (GPS data)
  let location:
    | { lat: number; lng: number; altitude?: number }
    | undefined = undefined;

  for (const key in payload) {
    if (key.includes("gps")) {
      const gpsData = payload[key];
      if (gpsData && typeof gpsData === 'object') {
        location = {
          lat: gpsData.latitude,
          lng: gpsData.longitude,
          altitude: gpsData.altitude,
        };
        logger.debug("Found GPS location in payload", location);
        break;
      }
    }
  }

  // Decode measurements
  const measurements: DecodedMeasurement[] = [];

  for (const option of decodeOptions) {
    const key = `${option.decoder}_${option.channel}`;
    const value = payload[key];

    if (value === undefined || value === null) {
      logger.warn(`No value found for ${key} in payload`, {
        decoder: option.decoder,
        channel: option.channel,
      });
      continue; // Skip this measurement
    }

    // Handle nested objects (like accelerometer, gps)
    let numericValue: number;
    
    if (typeof value === "object" && !Array.isArray(value)) {
      // For objects like accelerometer: { x, y, z }, take magnitude
      if ("x" in value && "y" in value && "z" in value) {
        // Calculate magnitude for accelerometer
        numericValue = Math.sqrt(value.x ** 2 + value.y ** 2 + value.z ** 2);
        logger.debug(`Calculated magnitude for ${key}`, { numericValue });
      } else {
        // Take first numeric property
        const firstNumeric = Object.values(value).find(
          (v) => typeof v === "number"
        );
        if (typeof firstNumeric !== 'number') {
          logger.warn(`No numeric value found in object for ${key}`, { value });
          continue;
        }
        numericValue = firstNumeric;
      }
    } else if (typeof value === 'number') {
      numericValue = value;
    } else {
      // Try to parse as number
      numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        logger.warn(`Could not parse value for ${key}`, { value });
        continue;
      }
    }

    const measurement: DecodedMeasurement = {
      sensor_id: option.sensor_id,
      value: numericValue,
      createdAt: timestamp,
    };

    if (location) {
      measurement.location = location;
    }

    measurements.push(measurement);

    logger.debug(`Decoded measurement for ${key}`, {
      sensor_id: option.sensor_id,
      value: numericValue,
    });
  }

  logger.info(`Decoded ${measurements.length} Cayenne LPP measurements`);

  return measurements;
}