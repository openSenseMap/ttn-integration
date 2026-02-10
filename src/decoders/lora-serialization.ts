import { decoder as loraDecoder } from 'lora-serialization';
import { logger } from '../logger.js';
import type { DecodedMeasurement } from '../types.js';
import { TtnIntegration } from '../schema/index.js';

/**
 * Match sensor by sensor_id, sensor_title, or sensor_type
 * Legacy compatibility: supports matching by title/type
 */
function findSensorId(
  option: any,
  sensors?: Array<{ _id: string; title: string; sensorType: string }>
): string | undefined {
  // Direct sensor_id (preferred)
  if (option.sensor_id) {
    return option.sensor_id;
  }

  // Legacy: match by sensor_title
  if (option.sensor_title && sensors) {
    const sensor = sensors.find(s => s.title === option.sensor_title);
    if (sensor) return sensor._id;
  }

  // Legacy: match by sensor_type
  if (option.sensor_type && sensors) {
    const sensor = sensors.find(s => s.sensorType === option.sensor_type);
    if (sensor) return sensor._id;
  }

  return undefined;
}

export async function decodeLoraserialization(
  base64Payload: string,
  integration: TtnIntegration,
  timestamp: Date,
  sensors?: Array<{ _id: string; title: string; sensorType: string }> // Optional for tests
): Promise<DecodedMeasurement[]> {
  const decodeOptions = integration.decodeOptions;

  if (!Array.isArray(decodeOptions) || decodeOptions.length === 0) {
    throw new Error("profile 'lora-serialization' requires valid decodeOptions");
  }

  // Validate all decodeOptions have required fields
  for (const option of decodeOptions) {
    if (!option.decoder) {
      throw new Error("Each decodeOption must have a 'decoder' field");
    }

    // Skip validation for special decoders
    if (!['unixtime', 'latLng'].includes(option.decoder)) {
      // Must have at least one identifier
      if (!option.sensor_id && !option.sensor_title && !option.sensor_type) {
        throw new Error(
          "invalid decodeOptions. requires at least one of [sensor_id, sensor_title, sensor_type]"
        );
      }
    }

    // Validate decoder exists
    if (typeof loraDecoder[option.decoder] !== 'function') {
      throw new Error(`'${option.decoder}' is not a supported transformer`);
    }
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Payload, 'base64');
  
  logger.debug('Decoding lora-serialization payload', {
    bufferLength: buffer.length,
    decoders: decodeOptions.map(o => o.decoder),
  });

  // Decode buffer according to decodeOptions
  const measurements: DecodedMeasurement[] = [];
  let offset = 0;
  let currentTimestamp: Date = timestamp;
  let currentLocation: { lng: number; lat: number } | undefined;

  for (const option of decodeOptions) {
    const transformer = loraDecoder[option.decoder!];
    const bytes = transformer.BYTES;

    if (offset + bytes > buffer.length) {
      logger.warn('Buffer too short for decoder', {
        decoder: option.decoder,
        expectedBytes: bytes,
        availableBytes: buffer.length - offset,
      });
      break;
    }

    // Extract bytes for this decoder
    const chunk = buffer.slice(offset, offset + bytes);
    const value = transformer(chunk);
    offset += bytes;

    logger.debug('Decoded value', {
      decoder: option.decoder,
      value,
      bytes,
    });

    // Handle special decoders
    if (option.decoder === 'unixtime') {
      currentTimestamp = new Date(value * 1000);
      logger.debug('Set timestamp from unixtime decoder', { currentTimestamp });
      continue;
    }

    if (option.decoder === 'latLng') {
      // lora-serialization returns [lat, lng]
      currentLocation = {
        lat: value[0],
        lng: value[1],
      };
      logger.debug('Set location from latLng decoder', { currentLocation });
      continue;
    }

    // Regular measurement - find sensor_id
    const sensorId = findSensorId(option, sensors);
    
    if (!sensorId) {
      logger.warn('Could not match sensor for decoder', { 
        decoder: option.decoder,
        option 
      });
      continue;
    }

    const measurement: DecodedMeasurement = {
      sensor_id: sensorId,
      value: typeof value === 'number' ? value : parseFloat(value),
      createdAt: currentTimestamp,
    };

    if (currentLocation) {
      measurement.location = currentLocation;
    }

    measurements.push(measurement);
  }

  logger.info(`Decoded ${measurements.length} measurements from lora-serialization payload`);

  measurements.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return measurements;
}