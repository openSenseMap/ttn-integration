import { describe, it, expect } from 'vitest';
import { decodeCayenneLpp } from '../../../src/decoders/cayenne-lpp';
import { cayenneLppIntegration } from '../../fixtures/integrations';

describe('decodeCayenneLpp', () => {
  const timestamp = new Date('2021-02-18T10:47:46.570Z');

  const validDecodedPayload = {
    temperature_1: 23,
    relative_humidity_1: 0,
    barometric_pressure_1: 1023,
    luminosity_1: 1451,
    analog_in_1: 0,
  };

  it('should decode valid cayenne-lpp payload', async () => {
    const measurements = await decodeCayenneLpp(
      validDecodedPayload,
      cayenneLppIntegration as any,
      timestamp
    );

    expect(measurements).toHaveLength(2);
    
    measurements.forEach(m => {
      expect(m).toHaveProperty('sensor_id');
      expect(m).toHaveProperty('value');
      expect(m).toHaveProperty('createdAt');
      expect(m.createdAt).toEqual(timestamp);
    });
  });

  it('should map decoder and channel to payload keys', async () => {
    const measurements = await decodeCayenneLpp(
      validDecodedPayload,
      cayenneLppIntegration as any,
      timestamp
    );

    const pressureMeasurement = measurements.find(
      m => m.sensor_id === '588876b67dd004f79259bd8f'
    );
    expect(pressureMeasurement).toBeDefined();
    expect(pressureMeasurement!.value).toBe(1023);

    const tempMeasurement = measurements.find(
      m => m.sensor_id === '588876b67dd004f79259bd8e'
    );
    expect(tempMeasurement).toBeDefined();
    expect(tempMeasurement!.value).toBe(23);
  });

  it('should handle GPS location data', async () => {
    const payloadWithGps = {
      ...validDecodedPayload,
      gps_2: {
        latitude: 52.52,
        longitude: 13.40,
        altitude: 35,
      },
    };

    const integration = {
      ...cayenneLppIntegration,
      decodeOptions: [
        ...cayenneLppIntegration.decodeOptions,
        { sensor_id: "gps_sensor_id", decoder: "gps", channel: 2 },
      ],
    };

    const measurements = await decodeCayenneLpp(
      payloadWithGps,
      integration as any,
      timestamp
    );

    // GPS location should be added to all measurements
    measurements.forEach(m => {
      expect(m.location).toBeDefined();
      expect(m.location!.lat).toBe(52.52);
      expect(m.location!.lng).toBe(13.40);
      expect(m.location!.altitude).toBe(35);
    });
  });

  it('should handle accelerometer data', async () => {
    const payloadWithAccel = {
      accelerometer_3: { x: 1.5, y: 2.3, z: -0.8 },
    };

    const integration = {
      ...cayenneLppIntegration,
      decodeOptions: [
        { sensor_id: "accel_id", decoder: "accelerometer", channel: 3 },
      ],
    };

    const measurements = await decodeCayenneLpp(
      payloadWithAccel,
      integration as any,
      timestamp
    );

    expect(measurements).toHaveLength(1);
    const magnitude = Math.sqrt(1.5**2 + 2.3**2 + 0.8**2);
    expect(measurements[0].value).toBeCloseTo(magnitude, 2);
  });

  it('should skip missing values in payload', async () => {
    const integration = {
      ...cayenneLppIntegration,
      decodeOptions: [
        { sensor_id: "temp_id", decoder: "temperature", channel: 1 },
        { sensor_id: "missing_id", decoder: "temperature", channel: 99 }, // Not in payload
      ],
    };

    const measurements = await decodeCayenneLpp(
      validDecodedPayload,
      integration as any,
      timestamp
    );

    // Should only decode the one that exists
    expect(measurements).toHaveLength(1);
    expect(measurements[0].sensor_id).toBe('temp_id');
  });

  it('should throw if decodeOptions missing', async () => {
    const integration = { 
      ...cayenneLppIntegration, 
      decodeOptions: null 
    };
    
    await expect(
      decodeCayenneLpp(validDecodedPayload, integration as any, timestamp)
    ).rejects.toThrow("requires valid decodeOptions");
  });

  it('should throw if decodeOptions empty', async () => {
    const integration = { 
      ...cayenneLppIntegration, 
      decodeOptions: [] 
    };
    
    await expect(
      decodeCayenneLpp(validDecodedPayload, integration as any, timestamp)
    ).rejects.toThrow("requires valid decodeOptions");
  });

  it('should throw if decodeOptions missing required fields', async () => {
    const integration = {
      ...cayenneLppIntegration,
      decodeOptions: [
        { decoder: "temperature", channel: 1 }, // Missing sensor_id
      ],
    };

    await expect(
      decodeCayenneLpp(validDecodedPayload, integration as any, timestamp)
    ).rejects.toThrow("requires decodeOptions with sensor_id, decoder, and channel");
  });

  it('should handle numeric string values', async () => {
    const payloadWithStrings = {
      temperature_1: "23.5",
    };

    const integration = {
      ...cayenneLppIntegration,
      decodeOptions: [
        { sensor_id: "temp_id", decoder: "temperature", channel: 1 },
      ],
    };

    const measurements = await decodeCayenneLpp(
      payloadWithStrings,
      integration as any,
      timestamp
    );

    expect(measurements).toHaveLength(1);
    expect(measurements[0].value).toBe(23.5);
  });

  it('should skip non-numeric values', async () => {
    const payloadWithInvalid = {
      temperature_1: "not a number",
    };

    const integration = {
      ...cayenneLppIntegration,
      decodeOptions: [
        { sensor_id: "temp_id", decoder: "temperature", channel: 1 },
      ],
    };

    const measurements = await decodeCayenneLpp(
      payloadWithInvalid,
      integration as any,
      timestamp
    );

    expect(measurements).toHaveLength(0);
  });
});