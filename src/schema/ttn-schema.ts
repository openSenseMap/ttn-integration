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
        minLength: 1,
      },
      appId: {
        type: "string",
        title: "Application ID",
        minLength: 1,
      },
      profile: {
        type: "string",
        title: "Decoder Profile",
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
        minimum: 1,
        maximum: 223,
      },
      decodeOptions: {
        type: "array",
        title: "Decode Options",
        items: {
          type: "object",
          required: ["sensor_id", "decoder"],
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
            channel: {
              type: "integer",
              title: "Channel",
            },
          },
        },
      },

    },
  },
  uiSchema: {
    "ui:order": ["enabled", "appId", "devId", "profile", "port", "decodeOptions"],
    
    appId: {
      "ui:help": "TTN application ID (app_id)",
    },
    devId: {
      "ui:help": "TTN device ID (dev_id)",
    },
    profile: {
      "ui:help": "json: Direct JSON mapping | cayenne-lpp: Cayenne LPP format | sensebox/home: senseBox:home format | lora-serialization: Custom byte encoding | debug: Raw bytes",
    },
    port: {
      "ui:help": "Leave empty to process messages from all ports",
    },
    decodeOptions: {
      "ui:help": "Configure how to decode the payload. Required for some profiles.",
      "ui:options": {
        orderable: false,
        addable: true,
        removable: true,
      },
      items: {
        sensor_id: {
          "ui:help": "Select the sensor that will receive this decoded value",
        },
        decoder: {
          "ui:help": "Type of decoder to use for this sensor's data",
        },
        channel: {
          "ui:widget": "hidden",
        },
      },
    },
  },
};