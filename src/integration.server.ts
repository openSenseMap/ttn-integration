import { eq, and } from 'drizzle-orm';
import { drizzleClient } from './db.server.js';
import { ttnIntegration } from './schema/index.js';

export const integrationsRepository = {
  async findByDeviceId(deviceId: string) {
    const [integration] = await drizzleClient
      .select()
      .from(ttnIntegration)
      .where(eq(ttnIntegration.deviceId, deviceId));
    return integration;
  },

  async findByTtnDevice(appId: string, devId: string) {
    const [integration] = await drizzleClient
      .select()
      .from(ttnIntegration)
      .where(
        and(
          eq(ttnIntegration.appId, appId),
          eq(ttnIntegration.devId, devId),
        )
      );
    return integration;
  },


  async create(data: typeof ttnIntegration.$inferInsert) {
    const [integration] = await drizzleClient
      .insert(ttnIntegration)
      .values(data)
      .returning();
    return integration;
  },

  async update(deviceId: string, data: Partial<typeof ttnIntegration.$inferInsert>) {
    const [integration] = await drizzleClient
      .update(ttnIntegration)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ttnIntegration.deviceId, deviceId))
      .returning();
    return integration;
  },

  async delete(deviceId: string) {
    await drizzleClient
      .delete(ttnIntegration)
      .where(eq(ttnIntegration.deviceId, deviceId));
  },

  async findAllEnabled() {
    const integrations = await drizzleClient
      .select()
      .from(ttnIntegration)
      .where(eq(ttnIntegration.enabled, true));
    
    // Convert all DB records to TTNIntegration type
    // return integrations.map(toTTNIntegration);
  }
};