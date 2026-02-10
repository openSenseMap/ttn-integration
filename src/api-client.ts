import { config } from "./config.js";
import { logger } from "./logger.js";
import type { MeasurementBatch } from "./types.js";

export class ApiClient {
  private baseUrl: string;
  private serviceKey: string;

  constructor() {
    this.baseUrl = config.API_URL;
    this.serviceKey = config.API_SERVICE_KEY;
  }

  private async fetch(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Service-Key": this.serviceKey,
        ...options.headers,
      },
    });

    return response;
  }

  /**
   * Send measurements to Osem
   */
  async sendMeasurements(batch: MeasurementBatch): Promise<void> {
    try {
      logger.info(
        `🚀 Sending ${batch.measurements.length} measurements for device ${batch.deviceId}`
      );

      const response = await this.fetch(
        `/api/boxes/${batch.deviceId}/data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            batch.measurements.map(m => ({
              sensor_id: m.sensor_id,
              value: m.value,
              createdAt: m.createdAt,
              location: m.location ?? undefined,
            }))
          ),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to send measurements: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      logger.info(
        `✅ Sent ${batch.measurements.length} measurements for device ${batch.deviceId}`
      );
    } catch (err) {
      logger.error(
        `Failed to send measurements for device ${batch.deviceId}`,
        {
          errorMessage: err instanceof Error ? err.message : String(err),
          batchSize: batch.measurements.length,
        }
      );
      throw err;
    }
  }

}