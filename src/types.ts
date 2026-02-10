import { TtnIntegration } from "./schema";

export type TtnProfile =
  | "json"
  | "debug"
  | "sensebox/home"
  | "lora-serialization"
  | "cayenne-lpp";

export interface DeviceWithIntegration {
  id: string;
  name: string;
  sensors: Sensor[];
  integration: TtnIntegration;
}

export interface Sensor {
  id: string;
  title: string;
  unit: string;
  sensorType: string;
}

// TTN v3 Webhook Payload
export interface TtnWebhookPayload {
  end_device_ids: {
    device_id: string;
    application_ids: {
      application_id: string;
    };
  };
  uplink_message: {
    frm_payload: string; // base64 encoded
    decoded_payload?: Record<string, any>;
    f_port: number;
    rx_metadata: any[];
    settings: any;
    received_at: string;
  };
}

export interface DecodedMeasurement {
  sensor_id: string;
  value: number;
  createdAt: Date;
  location?: {
    lat: number;
    lng: number;
    altitude?: number;
  };
}

export interface MeasurementBatch {
  deviceId: string;
  measurements: DecodedMeasurement[]
}

export interface Config {
  API_URL: string;
  API_SERVICE_KEY: string;
  PORT: number;
  LOG_LEVEL: string;
  RETRY_ATTEMPTS: number;
  RETRY_DELAY_MS: number;
}

// Decode options for different profiles
export interface CayenneLppDecodeOption {
  decoder: string;
  channel: number;
  sensor_id?: string;
  sensor_title?: string;
  sensor_type?: string;
  sensor_unit?: string;
}

export interface LoraSerializationDecodeOption {
  decoder: string;
  sensor_id?: string;
  sensor_title?: string;
  sensor_type?: string;
  sensor_unit?: string;
}