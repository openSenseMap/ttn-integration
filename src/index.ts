import { createHttpServer } from './http-server.js';
import { MessageProcessor } from './message-processor.js';
import { ApiClient } from './api-client.js';
import { config } from './config.js';
import { logger } from './logger.js';

async function main() {
  try {
    // Initialize services
    const messageProcessor = new MessageProcessor();
    const apiClient = new ApiClient();
    
    // Create HTTP server
    const app = createHttpServer(messageProcessor, apiClient);

    // Start listening
    app.listen(config.PORT, () => {
      logger.info(`🚀 TTN Integration Service started`, {
        port: config.PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        apiUrl: config.API_URL,
      });
      logger.info(`📡 Webhook endpoint: POST /webhook/ttn/:deviceId`);
      logger.info(`🔧 Management API: /integrations/:deviceId`);
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

main();