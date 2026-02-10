import { logger } from '../logger.js';
import { TtnIntegration } from '../schema/index.js';
import type { DecodedMeasurement } from '../types.js';

/**
 * Convert bytes to integer (big-endian)
 */
var bytesToInt = function (bytes: number[]) {
  var i = 0;
  for (var x = 0; x < bytes.length; x++) {
    i |= +(bytes[x] << (x * 8));  // LSB first
  }
  return i;
};

/**
 * Transformers for each sensor type
 */
const transformers: Record<string, { bytes: number; transformer: (bytes: number[]) => number }> = {
  temperature: {
    bytes: 2,
    transformer: (bytes) => parseFloat((bytesToInt(bytes) / 771 - 18).toFixed(1)),
  },
  humidity: {
    bytes: 2,
    transformer: (bytes) => parseFloat((bytesToInt(bytes) / 1e2).toFixed(1)),
  },
  pressure: {
    bytes: 2,
    transformer: (bytes) => parseFloat((bytesToInt(bytes) / 81.9187 + 300).toFixed(1)),
  },
  lightintensity: {
    bytes: 3,
    transformer: (bytes) => {
      const [mod, ...times] = bytes;
      return bytesToInt(times) * 255 + mod;
    },
  },
  uvlight: {
    bytes: 3,
    transformer: (bytes) => {
      const [mod, ...times] = bytes;
      return bytesToInt(times) * 255 + mod;
    },
  },
  pm10: {
    bytes: 2,
    transformer: (bytes) => parseFloat((bytesToInt(bytes) / 10).toFixed(1)),
  },
  pm25: {
    bytes: 2,
    transformer: (bytes) => parseFloat((bytesToInt(bytes) / 10).toFixed(1)),
  },
  soiltemperature: {
    bytes: 2,
    transformer: (bytes) => parseFloat((bytesToInt(bytes) / 771 - 18).toFixed(1)),
  },
  soilmoisture: {
    bytes: 2,
    transformer: (bytes) => parseFloat((bytesToInt(bytes) / 1e2).toFixed(1)),
  },
  soundlevel: {
    bytes: 2,
    transformer: (bytes) => parseFloat((bytesToInt(bytes) / 10).toFixed(1)),
  },
  bmetemperature: {
    bytes: 2,
    transformer: (bytes) => parseFloat((bytesToInt(bytes) / 771 - 18).toFixed(1)),
  },
  bmehumidity: {
    bytes: 2,
    transformer: (bytes) => parseFloat((bytesToInt(bytes) / 1e2).toFixed(1)),
  },
  bmepressure: {
    bytes: 2,
    transformer: (bytes) => parseFloat((bytesToInt(bytes) / 81.9187 + 300).toFixed(1)),
  },
  bmevoc: {
    bytes: 3,
    transformer: (bytes) => {
      const [mod, ...times] = bytes;
      return bytesToInt(times) * 255 + mod;
    },
  },
  windspeed: {
    bytes: 2,
    transformer: (bytes) => parseFloat((bytesToInt(bytes) / 10).toFixed(1)),
  },
  co2: {
    bytes: 2,
    transformer: (bytes) => bytesToInt(bytes),
  },
};

/**
 * Decode senseBox:home payload
 * 
 * This decoder expects a specific byte order matching the senseBox:home v2 LoRa sketch.
 * The payload structure is predefined and sensors must be configured in decodeOptions
 * with their type (e.g., "temperature", "humidity", etc.)
 */
export async function decodeSenseboxHome(
  base64Payload: string,
  integration: TtnIntegration,
  timestamp: Date
): Promise<DecodedMeasurement[]> {
  const decodeOptions = integration.decodeOptions;

  if (!Array.isArray(decodeOptions) || decodeOptions.length === 0) {
    throw new Error("profile 'sensebox/home' requires valid decodeOptions");
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Payload, 'base64');
  const bytes = Array.from(buffer);

  logger.debug('Decoding sensebox/home payload', {
    bufferLength: buffer.length,
    expectedSensors: decodeOptions.length,
  });

  const measurements: DecodedMeasurement[] = [];
  let offset = 0;

  // Process each sensor defined in decodeOptions
  for (const option of decodeOptions) {
    if (!option.sensor_id) {
      logger.warn('Skipping decodeOption without sensor_id');
      continue;
    }

    if (!option.decoder) {
      logger.warn('Skipping decodeOption without decoder type', {
        sensor_id: option.sensor_id,
      });
      continue;
    }

    const decoderType = option.decoder.toLowerCase();
    const transformer = transformers[decoderType];

    if (!transformer) {
      logger.warn(`Unknown decoder type: ${decoderType}`, {
        sensor_id: option.sensor_id,
        availableDecoders: Object.keys(transformers),
      });
      continue;
    }

    // Check if we have enough bytes
    if (offset + transformer.bytes > bytes.length) {
      logger.warn('Not enough bytes for decoder', {
        decoder: decoderType,
        needed: transformer.bytes,
        available: bytes.length - offset,
      });
      break;
    }

    // Extract bytes for this sensor
    const sensorBytes = bytes.slice(offset, offset + transformer.bytes);
    const value = transformer.transformer(sensorBytes);
    offset += transformer.bytes;

    measurements.push({
      sensor_id: option.sensor_id,
      value,
      createdAt: timestamp,
    });

    logger.debug('Decoded sensor value', {
      decoder: decoderType,
      sensor_id: option.sensor_id,
      value,
    });
  }

  // Warn if there are leftover bytes
  if (offset < bytes.length) {
    logger.warn('Payload has extra bytes', {
      expectedBytes: offset,
      actualBytes: bytes.length,
      extraBytes: bytes.length - offset,
    });
  }

  logger.info(`Decoded ${measurements.length} measurements from sensebox/home payload`);

  return measurements;
}