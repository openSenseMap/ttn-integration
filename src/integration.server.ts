import { and, eq, isNull, or, sql } from 'drizzle-orm'
import { drizzleClient } from './db.server.js'
import { ttnIntegration } from './schema/index.js'

export { isTtnRouteConflictError } from './integration-errors.js'

type IntegrationInsert = typeof ttnIntegration.$inferInsert

export type TtnIntegrationUpsert = {
	devId: IntegrationInsert['devId']
	appId: IntegrationInsert['appId']
	profile: NonNullable<IntegrationInsert['profile']>
	port?: IntegrationInsert['port']
	decodeOptions?: IntegrationInsert['decodeOptions']
	enabled?: IntegrationInsert['enabled']
}

export const integrationsRepository = {
	async findByDeviceId(deviceId: string) {
		const [integration] = await drizzleClient
			.select()
			.from(ttnIntegration)
			.where(eq(ttnIntegration.deviceId, deviceId))
		return integration
	},

	async findByTtnDevice(appId: string, devId: string, port: number) {
		const [integration] = await drizzleClient
			.select()
			.from(ttnIntegration)
			.where(
				and(
					eq(ttnIntegration.appId, appId),
					eq(ttnIntegration.devId, devId),
					or(eq(ttnIntegration.port, port), isNull(ttnIntegration.port)),
				),
			)
			// exact port match wins over a fallback row where port is NULL
			.orderBy(
				sql`CASE WHEN ${ttnIntegration.port} = ${port} THEN 0 ELSE 1 END`,
			)
			.limit(1)
		return integration
	},

	async create(data: typeof ttnIntegration.$inferInsert) {
		const [integration] = await drizzleClient
			.insert(ttnIntegration)
			.values(data)
			.returning()
		return integration
	},

	/**
	 * Create or replace the integration belonging to a device.
	 */
	async upsert(deviceId: string, data: TtnIntegrationUpsert) {
		const values = {
			deviceId,
			devId: data.devId,
			appId: data.appId,
			profile: data.profile,
			port: data.port ?? null,
			decodeOptions: data.decodeOptions ?? null,
			enabled: data.enabled ?? true,
		}

		const [integration] = await drizzleClient
			.insert(ttnIntegration)
			.values(values)
			.onConflictDoUpdate({
				target: ttnIntegration.deviceId,
				set: {
					devId: values.devId,
					appId: values.appId,
					profile: values.profile,
					port: values.port,
					decodeOptions: values.decodeOptions,
					enabled: values.enabled,
					updatedAt: new Date(),
				},
			})
			.returning()

		return integration
	},

	async update(
		deviceId: string,
		data: Partial<typeof ttnIntegration.$inferInsert>,
	) {
		const [integration] = await drizzleClient
			.update(ttnIntegration)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(ttnIntegration.deviceId, deviceId))
			.returning()
		return integration
	},

	async delete(deviceId: string) {
		await drizzleClient
			.delete(ttnIntegration)
			.where(eq(ttnIntegration.deviceId, deviceId))
	},

	async findAllEnabled() {
		const integrations = await drizzleClient
			.select()
			.from(ttnIntegration)
			.where(eq(ttnIntegration.enabled, true))

		// Convert all DB records to TTNIntegration type
		// return integrations.map(toTTNIntegration);
	},
}
