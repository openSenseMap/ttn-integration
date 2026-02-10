// import express from "express";
// import { logger } from "./logger.js";
// import { config } from "./config.js";
// import { ApiClient } from "./api-client.js";
// import { WebhookHandler } from "./webhook-handler.js";

// export function createServer() {
//   const app = express();
//   const apiClient = new ApiClient();
//   const webhookHandler = new WebhookHandler(apiClient);

//   // Middleware
//   app.use(express.json());

//   // Request logging
//   app.use((req, res, next) => {
//     const startTime = Date.now();
//     logger.debug(`${req.method} ${req.url} from ${req.ip}`);

//     res.on("finish", () => {
//       const duration = Date.now() - startTime;
//       logger.debug(
//         `${req.method} ${req.url} ${res.statusCode} (${duration}ms)`
//       );
//     });

//     next();
//   });

//   // Health check
//   app.get("/health", (req, res) => {
//     res.json({
//       status: "healthy",
//       timestamp: new Date().toISOString(),
//     });
//   });

//   // TTN v3 webhook endpoint
//   app.post("/v3", (req, res, next) => {
//     webhookHandler.handleWebhook(req, res, next);
//   });

//   // 404 handler
//   app.use((req, res) => {
//     res.status(404).type("txt").send(`404 Not Found. Available routes:
// POST  /v3       webhook for TTN v3 uplink messages
// GET   /health   health check endpoint
// `);
//   });

//   // Error handler
//   app.use(
//     (
//       err: Error,
//       req: express.Request,
//       res: express.Response,
//       next: express.NextFunction
//     ) => {
//       logger.error("Unhandled error", { error: err.message, stack: err.stack });
//       res.status(500).json({
//         code: 500,
//         error: "internal server error",
//       });
//     }
//   );

//   return app;
// }

// export function startServer() {
//   const app = createServer();

//   app.listen(config.PORT, () => {
//     logger.info(`🚀 TTN Service listening on port ${config.PORT}`);
//     logger.info(`Webhook endpoint: POST http://localhost:${config.PORT}/v3`);
//   });

//   return app;
// }