import { logger } from "./logger.js";
import { decodePayload } from "./decoders/index.js";
import type { TtnWebhookPayload, DecodedMeasurement } from "./types.js";
import { TtnIntegration } from "./schema/index.js";

export class MessageProcessor {
  /**
   * Process TTN uplink message
   */
  async processUplink(
    payload: TtnWebhookPayload,
    integration: TtnIntegration
  ): Promise<DecodedMeasurement[]> {
    try {
      logger.debug(`Processing uplink for device ${integration.deviceId}`, {
        profile: integration.profile,
      });

      // Decode payload based on profile
      const measurements = await decodePayload(payload, integration);

      logger.info(`Decoded ${measurements.length} measurements for device ${integration.deviceId}`);

      return measurements;
    } catch (error) {
      logger.error(`Failed to process uplink for device ${integration.deviceId}`, {
        error: error instanceof Error ? error.message : String(error),
        profile: integration.profile,
      });
      throw error;
    }
  }
}