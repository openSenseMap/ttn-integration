import { describe, it, expect } from 'vitest';
import { decodeDebug } from '../../../src/decoders/debug';
import { debugIntegration } from '../../fixtures/integrations';

describe('decodeDebug', () => {
  const timestamp = new Date('2021-02-18T10:47:46.570Z');
  
  // Payload with 3 bytes: [1, 2, 3]
  const validPayload = "AQID";

  it('should decode valid debug payload', async () => {
    const measurements = await decodeDebug(
      validPayload,
      debugIntegration as any,
      timestamp
    );

    expect(measurements).toHaveLength(3);
    
    measurements.forEach(m => {
      expect(m).toHaveProperty('sensor_id');
      expect(m).toHaveProperty('value');
      expect(m).toHaveProperty('createdAt');
      expect(m.createdAt).toEqual(timestamp);
    });
  });

  it('should decode bytes by index', async () => {
    const measurements = await decodeDebug(
      validPayload,
      debugIntegration as any,
      timestamp
    );

    expect(measurements[0].value).toBe(1);
    expect(measurements[1].value).toBe(2);
    expect(measurements[2].value).toBe(3);
  });

  it('should map to correct sensor IDs', async () => {
    const measurements = await decodeDebug(
      validPayload,
      debugIntegration as any,
      timestamp
    );

    expect(measurements[0].sensor_id).toBe('588876b67dd004f79259bd8a');
    expect(measurements[1].sensor_id).toBe('588876b67dd004f79259bd8b');
    expect(measurements[2].sensor_id).toBe('588876b67dd004f79259bd8c');
  });

  it('should throw if decodeOptions missing', async () => {
    const integration = { 
      ...debugIntegration, 
      decodeOptions: null 
    };
    
    await expect(
      decodeDebug(validPayload, integration as any, timestamp)
    ).rejects.toThrow("requires valid decodeOptions");
  });

  it('should stop when the payload has too few bytes for the next sensor', async () => {
    const integration = {
      ...debugIntegration,
      decodeOptions: [
        { sensor_id: "id1", bytes: 1 },
        { sensor_id: "id2", bytes: 10 },
      ],
    };

    await expect(
      decodeDebug(validPayload, integration as any, timestamp)
    ).resolves.toEqual([
      { sensor_id: 'id1', value: 1, createdAt: timestamp },
    ]);
  });

//   it('should skip decodeOptions without sensor_id', async () => {
//     const integration = {
//       ...debugIntegration,
//       decodeOptions: [
//         { decoder: "0" }, // Missing sensor_id
//         { sensor_id: "588876b67dd004f79259bd8b", decoder: "1" },
//       ],
//     };

//     const measurements = await decodeDebug(
//       validPayload,
//       integration as any,
//       timestamp
//     );

//     expect(measurements).toHaveLength(1);
//     expect(measurements[0].sensor_id).toBe('588876b67dd004f79259bd8b');
//   });
});
