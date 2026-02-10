import { describe, it, expect } from 'vitest';
import { decodeSenseboxHome } from '../../../src/decoders/sensebox_home';
import { senseboxHomeIntegration } from '../../fixtures/integrations';

describe('decodeSenseboxHome', () => {
  const validPayload = "kzIrIYzlOycAMgEA"; // 12 bytes
  const timestamp = new Date('2021-02-18T10:47:46.570Z');

  it('should decode valid sensebox/home payload', async () => {
    const measurements = await decodeSenseboxHome(
      validPayload,
      senseboxHomeIntegration as any,
      timestamp
    );

    expect(measurements).toHaveLength(5);
    
    // Verify all measurements have required fields
    measurements.forEach(m => {
      expect(m).toHaveProperty('sensor_id');
      expect(m).toHaveProperty('value');
      expect(m).toHaveProperty('createdAt');
      expect(m.createdAt).toEqual(timestamp);
    });

    // Verify sensor IDs match
    const sensorIds = measurements.map(m => m.sensor_id);
    expect(sensorIds).toContain('588876b67dd004f79259bd8a'); // UV
    expect(sensorIds).toContain('588876b67dd004f79259bd8b'); // Light
    expect(sensorIds).toContain('588876b67dd004f79259bd8c'); // Pressure
    expect(sensorIds).toContain('588876b67dd004f79259bd8d'); // Humidity
    expect(sensorIds).toContain('588876b67dd004f79259bd8e'); // Temperature
  });

  it('should decode temperature correctly', async () => {
    const measurements = await decodeSenseboxHome(
        validPayload,
        senseboxHomeIntegration as any,
        timestamp
    );

    const tempMeasurement = measurements.find(
        m => m.sensor_id === '588876b67dd004f79259bd8e'
    );
    
    expect(tempMeasurement).toBeDefined();
    expect(tempMeasurement!.value).toBeCloseTo(-1.2, 1);
    });

    it('should decode humidity correctly', async () => {
    const measurements = await decodeSenseboxHome(
        validPayload,
        senseboxHomeIntegration as any,
        timestamp
    );

    const humMeasurement = measurements.find(
        m => m.sensor_id === '588876b67dd004f79259bd8d'
    );
    
    expect(humMeasurement).toBeDefined();
    expect(humMeasurement!.value).toBeCloseTo(84.9, 1);
    });

  it('should throw if decodeOptions missing', async () => {
    const integration = { 
      ...senseboxHomeIntegration, 
      decodeOptions: null 
    };
    
    await expect(
      decodeSenseboxHome(validPayload, integration as any, timestamp)
    ).rejects.toThrow("requires valid decodeOptions");
  });

  it('should throw if decodeOptions empty', async () => {
    const integration = { 
      ...senseboxHomeIntegration, 
      decodeOptions: [] 
    };
    
    await expect(
      decodeSenseboxHome(validPayload, integration as any, timestamp)
    ).rejects.toThrow("requires valid decodeOptions");
  });

  it('should skip decodeOptions without sensor_id', async () => {
    const integration = {
      ...senseboxHomeIntegration,
      decodeOptions: [
        { decoder: "temperature" }, // Missing sensor_id
        { sensor_id: "588876b67dd004f79259bd8b", decoder: "lightintensity" },
      ],
    };

    const measurements = await decodeSenseboxHome(
      validPayload,
      integration as any,
      timestamp
    );

    // Should only decode the one with sensor_id
    expect(measurements).toHaveLength(1);
    expect(measurements[0].sensor_id).toBe('588876b67dd004f79259bd8b');
  });

  it('should skip decodeOptions without decoder', async () => {
    const integration = {
      ...senseboxHomeIntegration,
      decodeOptions: [
        { sensor_id: "588876b67dd004f79259bd8a" }, // Missing decoder
        { sensor_id: "588876b67dd004f79259bd8b", decoder: "lightintensity" },
      ],
    };

    const measurements = await decodeSenseboxHome(
      validPayload,
      integration as any,
      timestamp
    );

    expect(measurements).toHaveLength(1);
    expect(measurements[0].sensor_id).toBe('588876b67dd004f79259bd8b');
  });

  it('should skip unknown decoder types', async () => {
    const integration = {
      ...senseboxHomeIntegration,
      decodeOptions: [
        { sensor_id: "588876b67dd004f79259bd8a", decoder: "unknown_type" },
        { sensor_id: "588876b67dd004f79259bd8b", decoder: "lightintensity" },
      ],
    };

    const measurements = await decodeSenseboxHome(
      validPayload,
      integration as any,
      timestamp
    );

    expect(measurements).toHaveLength(1);
    expect(measurements[0].sensor_id).toBe('588876b67dd004f79259bd8b');
  });

  it('should handle payload shorter than expected', async () => {
    const shortPayload = "kzIr"; // Only 3 bytes instead of 12

    const measurements = await decodeSenseboxHome(
      shortPayload,
      senseboxHomeIntegration as any,
      timestamp
    );

    // Should decode what it can (UV light needs 3 bytes)
    expect(measurements.length).toBeLessThan(5);
    expect(measurements.length).toBeGreaterThanOrEqual(1);
  });

  it('should warn about extra bytes in payload', async () => {
    const longPayload = "kzIrIYzlOycAMgEAAA=="; // Extra bytes

    const measurements = await decodeSenseboxHome(
      longPayload,
      senseboxHomeIntegration as any,
      timestamp
    );

    // Should still decode all 5 sensors
    expect(measurements).toHaveLength(5);
  });

  it('should handle case-insensitive decoder types', async () => {
    const integration = {
      ...senseboxHomeIntegration,
      decodeOptions: [
        { sensor_id: "588876b67dd004f79259bd8e", decoder: "TEMPERATURE" },
        { sensor_id: "588876b67dd004f79259bd8d", decoder: "Humidity" },
      ],
    };

    const measurements = await decodeSenseboxHome(
      validPayload,
      integration as any,
      timestamp
    );

    expect(measurements).toHaveLength(2);
  });
});