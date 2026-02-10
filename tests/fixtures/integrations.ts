export const senseboxHomeIntegration = {
  deviceId: "test-box-sbhome",
  devId: "my-dev-id",
  appId: "sensebox-ifgi",
  profile: "sensebox/home" as const,
  port: 3,
  decodeOptions: [
    { sensor_id: "588876b67dd004f79259bd8e", decoder: "temperature" },    // Bytes 0-1
    { sensor_id: "588876b67dd004f79259bd8d", decoder: "humidity" },       // Bytes 2-3
    { sensor_id: "588876b67dd004f79259bd8c", decoder: "pressure" },       // Bytes 4-5
    { sensor_id: "588876b67dd004f79259bd8b", decoder: "lightintensity" }, // Bytes 6-8
    { sensor_id: "588876b67dd004f79259bd8a", decoder: "uvlight" },        // Bytes 9-11
  ],
};

export const cayenneLppIntegration = {
  deviceId: "test-box-cayenne",
  devId: "cayenne-1",
  appId: "sensebox-cayenne",
  profile: "cayenne-lpp" as const,
  port: 1,
  decodeOptions: [
    {
      sensor_id: "588876b67dd004f79259bd8f",
      decoder: "barometric_pressure",
      channel: 1,
    },
    {
      sensor_id: "588876b67dd004f79259bd8e",
      decoder: "temperature",
      channel: 1,
    },
  ],
};

export const loraSerializationIntegration = {
  deviceId: "test-box-lora",
  devId: "loraserializationbox",
  appId: "sensebox-ifgi",
  profile: "lora-serialization" as const,
  decodeOptions: [
    { sensor_id: "588876b67dd004f79259bd8e", decoder: "temperature" },
    { sensor_title: "rel. Luftfeuchte", decoder: "humidity" },
    { sensor_type: "VEML6070", decoder: "uint16" },
  ],
};

export const loraSerializationAdvancedIntegration = {
  deviceId: "test-box-lora-adv",
  devId: "loraserializationbox",
  appId: "sensebox-ifgi",
  profile: "lora-serialization" as const,
  decodeOptions: [
    { sensor_title: "Temperatur", decoder: "temperature" },
    { decoder: "latLng" },
    { decoder: "unixtime" },
    { sensor_title: "Temperatur", decoder: "temperature" },
    { decoder: "latLng" },
    { decoder: "unixtime" },
    { sensor_title: "Temperatur", decoder: "temperature" },
  ],
};

// Mock sensor data for matching
export const mockSensors = [
  {
    _id: "588876b67dd004f79259bd8a",
    sensorType: "VEML6070",
    title: "UV-Intensität",
  },
  {
    _id: "588876b67dd004f79259bd8b",
    sensorType: "TSL45315",
    title: "Beleuchtungsstärke",
  },
  {
    _id: "588876b67dd004f79259bd8c",
    sensorType: "BMP280",
    title: "Luftdruck",
  },
  {
    _id: "588876b67dd004f79259bd8d",
    sensorType: "HDC1008",
    title: "rel. Luftfeuchte",
  },
  {
    _id: "588876b67dd004f79259bd8e",
    sensorType: "HDC1008",
    title: "Temperatur",
  },
];

export const debugIntegration = {
  deviceId: "test-box-debug",
  devId: "debug-dev-1",
  appId: "debug-app",
  profile: "debug" as const,
  decodeOptions: [
    { sensor_id: "588876b67dd004f79259bd8a", decoder: "0" },
    { sensor_id: "588876b67dd004f79259bd8b", decoder: "1" },
    { sensor_id: "588876b67dd004f79259bd8c", decoder: "2" },
  ],
};