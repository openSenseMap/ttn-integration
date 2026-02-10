import { describe, it, expect } from 'vitest';
import { decodeLoraserialization } from '../../../src/decoders/lora-serialization';
import { 
  loraSerializationIntegration,
  loraSerializationAdvancedIntegration,
  mockSensors,
} from '../../fixtures/integrations';
import {
  loraSerializationValidPayload,
  loraSerializationAdvancedPayload,
} from '../../fixtures/payloads';

describe('decodeLoraserialization', () => {
  const timestamp = new Date('2021-02-18T10:47:46.570Z');

  it('should decode valid lora-serialization payload', async () => {
    const measurements = await decodeLoraserialization(
      loraSerializationValidPayload,
      loraSerializationIntegration as any,
      timestamp,
      mockSensors
    );

    expect(measurements).toHaveLength(3);
    
    measurements.forEach(m => {
      expect(m).toHaveProperty('sensor_id');
      expect(m).toHaveProperty('value');
      expect(m).toHaveProperty('createdAt');
      expect(m.createdAt).toEqual(timestamp);
    });
  });

  it('should decode temperature correctly', async () => {
    const measurements = await decodeLoraserialization(
      loraSerializationValidPayload,
      loraSerializationIntegration as any,
      timestamp,
      mockSensors
    );

    const tempMeasurement = measurements.find(
      m => m.sensor_id === '588876b67dd004f79259bd8e'
    );
    
    expect(tempMeasurement).toBeDefined();
    expect(tempMeasurement!.value).toBeCloseTo(-5.3, 1);
  });

  it('should decode humidity correctly', async () => {
    const measurements = await decodeLoraserialization(
      loraSerializationValidPayload,
      loraSerializationIntegration as any,
      timestamp,
      mockSensors
    );

    const humMeasurement = measurements.find(
      m => m.sensor_id === '588876b67dd004f79259bd8d'
    );
    
    expect(humMeasurement).toBeDefined();
    expect(humMeasurement!.value).toBeCloseTo(78.7, 1);
  });

  it('should decode uint16 correctly', async () => {
    const measurements = await decodeLoraserialization(
      loraSerializationValidPayload,
      loraSerializationIntegration as any,
      timestamp,
      mockSensors
    );

    const uint16Measurement = measurements.find(
      m => m.sensor_id === '588876b67dd004f79259bd8a'
    );
    
    expect(uint16Measurement).toBeDefined();
    expect(uint16Measurement!.value).toBe(666);
  });

  it('should match sensors by sensor_title', async () => {
    const measurements = await decodeLoraserialization(
      loraSerializationValidPayload,
      loraSerializationIntegration as any,
      timestamp,
      mockSensors
    );

    // Humidity matched by sensor_title "rel. Luftfeuchte"
    const humMeasurement = measurements.find(
      m => m.sensor_id === '588876b67dd004f79259bd8d'
    );
    expect(humMeasurement).toBeDefined();
  });

  it('should match sensors by sensor_type', async () => {
    const measurements = await decodeLoraserialization(
      loraSerializationValidPayload,
      loraSerializationIntegration as any,
      timestamp,
      mockSensors
    );

    // UV matched by sensor_type "VEML6070"
    const uvMeasurement = measurements.find(
      m => m.sensor_id === '588876b67dd004f79259bd8a'
    );
    expect(uvMeasurement).toBeDefined();
  });

 it('should support multiple measurements per sensor with timestamps', async () => {
    const measurements = await decodeLoraserialization(
      loraSerializationAdvancedPayload,
      loraSerializationAdvancedIntegration as any,
      timestamp,
      mockSensors
    );

    // Should decode 3 temperature measurements
    expect(measurements).toHaveLength(3);
    
    const tempMeasurements = measurements.filter(
      m => m.sensor_id === '588876b67dd004f79259bd8e'
    );
    expect(tempMeasurements).toHaveLength(3);

    // After sorting by timestamp (chronological order):
    // [0] = 23.45 (first unixtime = 2017-04-12)
    // [1] = 34.5 (second unixtime = 2017-04-20)
    // [2] = -11.3 (default timestamp = 2021-02-18)
    
    expect(tempMeasurements[0].value).toBeCloseTo(23.45, 1);
    expect(tempMeasurements[1].value).toBeCloseTo(34.5, 1);
    expect(tempMeasurements[2].value).toBeCloseTo(-11.3, 1);
  });

  it('should apply timestamps from unixtime decoder', async () => {
    const measurements = await decodeLoraserialization(
      loraSerializationAdvancedPayload,
      loraSerializationAdvancedIntegration as any,
      timestamp,
      mockSensors
    );

    expect(measurements).toHaveLength(3);

    // Measurements are SORTED BY DATE
    // [0] = earliest (first unixtime)
    // [1] = middle (second unixtime)
    // [2] = latest (default timestamp = "now")
    
    expect(measurements[0].createdAt).toEqual(new Date('2017-04-12T20:20:31.000Z'));
    expect(measurements[1].createdAt).toEqual(new Date('2017-04-20T20:20:31.000Z'));
    expect(measurements[2].createdAt).toEqual(timestamp); // Default = "now"
  });

  it('should apply locations from latLng decoder', async () => {
    const measurements = await decodeLoraserialization(
      loraSerializationAdvancedPayload,
      loraSerializationAdvancedIntegration as any,
      timestamp,
      mockSensors
    );

    expect(measurements).toHaveLength(3);

    // After sorting by date:
    // [0] = first timestamp + first location
    expect(measurements[0].location).toBeDefined();
    expect(measurements[0].location!.lat).toBeCloseTo(51.9633, 2);
    expect(measurements[0].location!.lng).toBeCloseTo(7.6833, 2);

    // [1] = second timestamp + second location
    expect(measurements[1].location).toBeDefined();
    expect(measurements[1].location!.lat).toBeCloseTo(52, 0);
    expect(measurements[1].location!.lng).toBeCloseTo(8, 0);

    // [2] = default timestamp, NO location (first in payload)
    expect(measurements[2].location).toBeUndefined();
  });

  it('should sort measurements by timestamp', async () => {
    const measurements = await decodeLoraserialization(
      loraSerializationAdvancedPayload,
      loraSerializationAdvancedIntegration as any,
      timestamp,
      mockSensors
    );

    // Verify ascending order
    for (let i = 1; i < measurements.length; i++) {
      expect(measurements[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        measurements[i - 1].createdAt.getTime()
      );
    }
  });

  it('should throw if decodeOptions missing', async () => {
    const integration = { 
      ...loraSerializationIntegration, 
      decodeOptions: null 
    };
    
    await expect(
      decodeLoraserialization(loraSerializationValidPayload, integration as any, timestamp, mockSensors)
    ).rejects.toThrow("requires valid decodeOptions");
  });

  it('should throw if decodeOption missing decoder field', async () => {
    const integration = {
      ...loraSerializationIntegration,
      decodeOptions: [
        { sensor_id: "588876b67dd004f79259bd8e" },
      ],
    };

    await expect(
      decodeLoraserialization(loraSerializationValidPayload, integration as any, timestamp, mockSensors)
    ).rejects.toThrow("must have a 'decoder' field");
  });

  it('should throw for non-special decoders without any identifier', async () => {
    const integration = {
      ...loraSerializationIntegration,
      decodeOptions: [
        { decoder: "temperature" }, // No sensor_id, sensor_title, or sensor_type
      ],
    };

    await expect(
      decodeLoraserialization(loraSerializationValidPayload, integration as any, timestamp, mockSensors)
    ).rejects.toThrow("requires at least one of [sensor_id, sensor_title, sensor_type]");
  });

  it('should throw for unsupported transformer', async () => {
    const integration = {
      ...loraSerializationIntegration,
      decodeOptions: [
        { sensor_id: "id", decoder: "invalid_decoder" },
      ],
    };

    await expect(
      decodeLoraserialization(loraSerializationValidPayload, integration as any, timestamp, mockSensors)
    ).rejects.toThrow("not a supported transformer");
  });

  it('should handle buffer shorter than expected', async () => {
    const shortPayload = "Dw==";
    
    const integration = {
      ...loraSerializationIntegration,
      decodeOptions: [
        { sensor_id: "588876b67dd004f79259bd8e", decoder: "temperature" },
      ],
    };

    const measurements = await decodeLoraserialization(
      shortPayload,
      integration as any,
      timestamp,
      mockSensors
    );

    expect(measurements).toHaveLength(0);
  });
});