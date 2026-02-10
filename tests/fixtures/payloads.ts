export const ttnV2SenseboxHomePayload = {
  app_id: "sensebox-ifgi",
  dev_id: "my-dev-id",
  hardware_serial: "0102030405060708",
  port: 3,
  counter: 2,
  is_retry: false,
  payload_raw: "kzIrIYzlOycAMgEA",
};

export const ttnV3CayenneLppPayload = {
  end_device_ids: {
    device_id: "cayenne-1",
    application_ids: { application_id: "sensebox-cayenne" },
  },
  uplink_message: {
    f_port: 1,
    frm_payload: "AWcAAAFoAAFzAAABZQWrAQIAAAFxAAAAAAAAAYgAAAAAAAAAAAA=",
    decoded_payload: {
      temperature_1: 23,
      relative_humidity_1: 0,
      barometric_pressure_1: 1023,
      luminosity_1: 1451,
      analog_in_1: 0,
      accelerometer_1: { x: 0, y: 0, z: 0 },
      gps_1: { latitude: 0, longitude: 0, altitude: 0 },
    },
    received_at: "2021-02-18T10:47:46.570559141Z",
  },
};

export const loraSerializationValidPayload = "/e6+HpoC";
export const loraSerializationAdvancedPayload = "+5ak5RgD5Dx1AA+M7lgJKQB1GQMAEnoADxj5WA16";