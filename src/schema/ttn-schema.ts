export const ttnIntegrationSchema = {
  schema: {
    type: "object",
    required: ["enabled", "devId", "appId", "profile"],
    properties: {
      enabled: {
        type: "boolean",
        title: "Enable TTN",
        default: true,
      },
      devId: {
        type: "string",
        title: "Device ID",
        description: "TTN device ID (dev_id)",
        minLength: 1,
      },
      appId: {
        type: "string",
        title: "Application ID",
        description: "TTN application ID (app_id)",
        minLength: 1,
      },
      profile: {
        type: "string",
        title: "Decoder Profile",
        description: "Profile used to decode the payload",
        enum: [
          "json",
          "debug",
          "sensebox/home",
          "lora-serialization",
          "cayenne-lpp",
        ],
        default: "json",
      },
      port: {
        type: "integer",
        title: "Port (optional)",
        description: "TTN port number to filter messages. Leave empty to accept all ports.",
        minimum: 1,
        maximum: 223,
      },
      decodeOptions: {
        type: "array",
        title: "Decode Options",
        description: "Configuration for decoding the payload based on selected profile",
        items: {
          type: "object",
          properties: {
            sensor_id: {
              type: "string",
              title: "Sensor ID",
            },
            decoder: {
              type: "string",
              title: "Decoder Type",
              enum: [
                "temperature",
                "humidity",
                "uint8",
                "uint16",
                "pressure",
                "latLng",
                "unixtime",
              ],
            },
          },
        },
      },
    },
  },
  uiSchema: {
    "ui:order": ["enabled", "appId", "devId", "profile", "port", "decodeOptions"],
    decodeOptions: {
      "ui:help": "Required for lora-serialization and debug profiles. Defines how to decode the binary payload.",
      "ui:collapsible": true,
      "ui:collapsed": true,
      items: {
        sensor_id: {
          "ui:help": "Select the sensor that will receive this decoded value",
        },
        decoder: {
          "ui:help": "Type of decoder to use for this sensor's data",
        },
      },
    },
    port: {
      "ui:help": "Leave empty to process messages from all ports",
    },
    profile: {
      "ui:help": "json: Direct JSON mapping | cayenne-lpp: Cayenne LPP format | sensebox/home: senseBox:home format | lora-serialization: Custom byte encoding | debug: Raw bytes with byteMask",
    },
  },
};