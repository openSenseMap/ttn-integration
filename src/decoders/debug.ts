import { logger } from '../logger.js';
import { TtnIntegration } from '../schema/index.js';
import type { DecodedMeasurement } from '../types.js';

/**
 * Convert bytes to integer (big-endian)
 */
function bytesToInt(bytes: number[]): number {
  let result = 0;
  for (let i = 0; i < bytes.length; i++) {
    result = (result << 8) | bytes[i];
  }
  return result;
}

/**
 * Decode debug profile payload
 * 
 * This is a general-purpose decoder that reads bytes according to a byteMask.
 * The byteMask defines how many bytes to consume for each sensor.
 * Each sensor gets decoded as an integer value.
 * 
 * @example
 * // decodeOptions format:
 * {
 *   profile: 'debug',
 *   decodeOptions: [
 *     { sensor_id: 'abc123', bytes: 3 },  // First 3 bytes → sensor abc123
 *     { sensor_id: 'def456', bytes: 1 },  // Next 1 byte → sensor def456
 *     { sensor_id: 'ghi789', bytes: 2 },  // Next 2 bytes → sensor ghi789
 *   ]
 * }
 */
export async function decodeDebug(
  base64Payload: string,
  integration: TtnIntegration,
  timestamp: Date
): Promise<DecodedMeasurement[]> {
  const decodeOptions = integration.decodeOptions;

  if (!Array.isArray(decodeOptions) || decodeOptions.length === 0) {
    throw new Error("profile 'debug' requires valid decodeOptions array");
  }

  // Validate all decodeOptions have required fields
  for (const option of decodeOptions) {
    if (!option.sensor_id) {
      throw new Error("Each decodeOption must have a 'sensor_id' field");
    }
    if (!option.bytes || typeof option.bytes !== 'number') {
      throw new Error("Each decodeOption must have a 'bytes' field (number)");
    }
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Payload, 'base64');
  const byteArray = Array.from(buffer);

  logger.debug('Decoding debug payload', {
    bufferLength: buffer.length,
    sensors: decodeOptions.length,
  });

  // Calculate expected byte length
  const expectedBytes = decodeOptions.reduce((sum, opt) => sum + (opt.bytes || 0), 0);
  
  if (buffer.length !== expectedBytes) {
    logger.warn('Buffer length mismatch', {
      expected: expectedBytes,
      actual: buffer.length,
    });
  }

  const measurements: DecodedMeasurement[] = [];
  let offset = 0;

  // Decode each sensor according to byteMask
  for (const option of decodeOptions) {
    const numBytes = option.bytes || 0;

    // Check if we have enough bytes
    if (offset + numBytes > byteArray.length) {
      logger.warn('Not enough bytes for sensor', {
        sensor_id: option.sensor_id,
        needed: numBytes,
        available: byteArray.length - offset,
      });
      break;
    }

    // Extract bytes for this sensor
    const sensorBytes = byteArray.slice(offset, offset + numBytes);
    const value = bytesToInt(sensorBytes);
    offset += numBytes;

    measurements.push({
      sensor_id: option.sensor_id!,
      value,
      createdAt: timestamp,
    });

    logger.debug('Decoded sensor value', {
      sensor_id: option.sensor_id,
      bytes: numBytes,
      value,
    });
  }

  logger.info(`Decoded ${measurements.length} measurements from debug payload`);

  return measurements;
}