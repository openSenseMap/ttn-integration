import { logger } from "../logger.js";
import { decodeCayenneLpp } from "./cayenne-lpp.js";
import { decodeJson } from "./json.js";
import { decodeLoraserialization } from "./lora-serialization.js";
import { decodeSenseboxHome } from "./sensebox_home.js";
import { decodeDebug } from "./debug.js";
import type {
  TtnWebhookPayload,
  DecodedMeasurement,
} from "../types.js";
import { TtnIntegration } from "../schema/index.js";

/**
 * Main decoder router - selects appropriate decoder based on profile
 */
export async function decodePayload(
  webhookPayload: TtnWebhookPayload,
  integration: TtnIntegration 
): Promise<DecodedMeasurement[]> {
  const { uplink_message } = webhookPayload;
  const profile = integration.profile;
  const timestamp = uplink_message.received_at 
    ? new Date(uplink_message.received_at)
    : new Date();

  logger.info(`Decoding payload with profile: ${profile}`);

  try {
    switch (profile) {
      case "json":
        if (!uplink_message.decoded_payload) {
          throw new Error(
            "profile 'json' requires decoded_payload from TTN payload function"
          );
        }
        return await decodeJson(
          uplink_message.decoded_payload,
          integration,
          timestamp
        );

      case "cayenne-lpp":
        if (!uplink_message.decoded_payload) {
          throw new Error(
            "profile 'cayenne-lpp' requires decoded_payload from TTN"
          );
        }
        return await decodeCayenneLpp(
          uplink_message.decoded_payload,
          integration,
          timestamp
        );

      case "lora-serialization":
        if (!uplink_message.frm_payload) {
          throw new Error("profile 'lora-serialization' requires frm_payload");
        }
        return await decodeLoraserialization(
          uplink_message.frm_payload,
          integration,
          timestamp
        );

      case "sensebox/home":
        if (!uplink_message.frm_payload) {
          throw new Error("profile 'sensebox/home' requires frm_payload");
        }
        return await decodeSenseboxHome(
          uplink_message.frm_payload,
          integration,
          timestamp
        );

      case "debug":
        if (!uplink_message.frm_payload) {
          throw new Error("profile 'debug' requires frm_payload");
        }
        return await decodeDebug(
          uplink_message.frm_payload,
          integration,
          timestamp
        );

      default:
        throw new Error(`Unknown profile: ${profile}`);
    }
  } catch (err) {
    logger.error(`Failed to decode payload with profile ${profile}`, {
      error: err instanceof Error ? err.message : String(err),
      profile,
      deviceId: integration.deviceId,
    });
    throw err;
  }
}