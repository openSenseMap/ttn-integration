// import type { Request, Response, NextFunction } from "express";
// import { logger } from "./logger.js";
// import { ApiClient } from "./api-client.js";
// import { decodePayload } from "./decoders/index.js";
// import type { TtnWebhookPayload } from "./types.js";

// export class WebhookHandler {
//   private apiClient: ApiClient;

//   constructor(apiClient: ApiClient) {
//     this.apiClient = apiClient;
//   }

//   /**
//    * Handle TTN v3 webhook
//    */
//   async handleWebhook(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> {
//     const startTime = Date.now();

//     try {
//       const payload = req.body as TtnWebhookPayload;

//       // Validate payload structure
//       if (!payload.end_device_ids || !payload.uplink_message) {
//         res.status(422).json({
//           code: 422,
//           error:
//             "malformed request: missing [end_device_ids, uplink_message]",
//         });
//         logger.warn("Malformed webhook payload received");
//         return;
//       }

//       const { device_id, application_ids } = payload.end_device_ids;
//       const appId = application_ids.application_id;
//       const devId = device_id;
//       const port = payload.uplink_message.f_port;

//       logger.info(`Received webhook for device ${devId} (app: ${appId}, port: ${port})`);
//       logger.debug("Full webhook payload", { payload });

//       // Check if payload or decoded_payload exists
//       if (
//         !payload.uplink_message.frm_payload &&
//         !payload.uplink_message.decoded_payload
//       ) {
//         res.status(422).json({
//           code: 422,
//           error: "malformed request: missing payload data",
//         });
//         logger.warn("Webhook missing payload data");
//         return;
//       }

//       // Find device in openSenseMap
//       const device = await this.apiClient.findDeviceByTtn(appId, devId, port);

//       if (!device) {
//         res.status(404).json({
//           code: 404,
//           error: `no device found for dev_id '${devId}', app_id '${appId}'${port ? `, port ${port}` : ""}`,
//         });
//         logger.warn(`Device not found: ${devId} (${appId})`);
//         return;
//       }

//       logger.info(`Matched device: ${device.name} (${device.id})`);

//       // Decode payload according to profile
//       const measurements = await decodePayload(payload, device);

//       logger.info(`Decoded ${measurements.length} measurements`);
//       logger.debug("Decoded measurements", { measurements });

//       // Send measurements to API
//       await this.apiClient.sendMeasurements({
//         deviceId: device.id,
//         measurements: measurements.map((m) => ({
//           sensor_id: m.sensor_id,
//           value: m.value,
//           createdAt: m.createdAt?.toISOString(),
//           location: m.location,
//         })),
//       });

//       const responseTime = Date.now() - startTime;
//       res.status(201).json({
//         code: 201,
//         message: "measurements created",
//         count: measurements.length,
//         responseTime: `${responseTime}ms`,
//       });

//       logger.info(
//         `✅ Successfully processed webhook for ${device.name} (${responseTime}ms)`
//       );
//     } catch (err) {
//       const responseTime = Date.now() - startTime;
//       logger.error("Error processing webhook", {
//         error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
//         responseTime: `${responseTime}ms`,
//       });

//       res.status(500).json({
//         code: 500,
//         error: "internal server error",
//         message: err instanceof Error ? err.message : String(err),
//       });
//     }
//   }
// }