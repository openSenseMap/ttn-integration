import express from 'express'
import { logger } from './logger.js'
import { type MessageProcessor } from './message-processor.js'
import { type ApiClient } from './api-client.js'
import { config } from './config.js'
import {
	integrationsRepository,
	isTtnRouteConflictError,
} from './integration.server.js'
import { type TtnWebhookPayload } from './types.js'
import { ttnIntegrationSchema } from './schema/ttn-schema.js'
import {
	normalizeIntegrationRequest,
	validateIntegrationRequest,
} from './validation/integration-request.js'

export function createHttpServer(
	messageProcessor: MessageProcessor,
	apiClient: ApiClient,
) {
	const app = express()
	app.use(express.json())

	app.get('/health', (req: any, res: any) => {
		res.json({
			status: 'healthy',
			timestamp: new Date().toISOString(),
			service: 'ttn-integration',
		})
	})

	// GET integration config for device
	app.get('/integrations/:deviceId', requireServiceKey, async (req, res) => {
		try {
			const { deviceId } = req.params
			const integration = await integrationsRepository.findByDeviceId(deviceId)

			if (!integration) {
				return res.status(404).json({ error: 'Integration not found' })
			}

			res.json(integration)
		} catch (error) {
			logger.error('Failed to fetch integration', { error })
			res.status(500).json({ error: 'Internal server error' })
		}
	})

	// Create or update integration
	app.put('/integrations/:deviceId', requireServiceKey, async (req, res) => {
		try {
			const { deviceId } = req.params

			const validation = validateIntegrationRequest(req.body)
			if (!validation.valid) {
				return res.status(400).json({
					error: 'Validation failed',
					details: validation.errors,
				})
			}

			const requestData = normalizeIntegrationRequest(req.body)
			const integration = await integrationsRepository.upsert(deviceId, {
				devId: requestData.devId,
				appId: requestData.appId,
				profile: requestData.profile,
				port: requestData.port,
				decodeOptions: requestData.decodeOptions,
				enabled: true,
			})

			logger.info(`Created or updated TTN integration for device ${deviceId}`)
			res.json(integration)
		} catch (error) {
			if (isTtnRouteConflictError(error)) {
				logger.warn('TTN route is already assigned to another device', {
					deviceId: req.params.deviceId,
				})
				return res.status(409).json({
					error: 'TTN route is already assigned to another device',
					code: 'ttn_route_conflict',
				})
			}

			logger.error('Failed to create/update integration', { error })
			res.status(500).json({ error: 'Internal server error' })
		}
	})

	app.delete('/integrations/:deviceId', requireServiceKey, async (req, res) => {
		try {
			const { deviceId } = req.params

			await integrationsRepository.delete(deviceId)

			logger.info(`Deleted TTN integration for device ${deviceId}`)
			res.status(204).send()
		} catch (error) {
			logger.error('Failed to delete integration', { error })
			res.status(500).json({ error: 'Internal server error' })
		}
	})

	app.post(
		'/integrations/:deviceId/reconcile-sensors',
		requireServiceKey,
		async (req, res) => {
			try {
				const { deviceId } = req.params
				const { validSensorIds } = req.body as { validSensorIds?: string[] }

				if (!Array.isArray(validSensorIds)) {
					return res.status(400).json({
						error: 'validSensorIds must be an array',
					})
				}

				const existing = await integrationsRepository.findByDeviceId(deviceId)

				if (!existing) {
					return res.status(404).json({ error: 'Integration not found' })
				}

				const previousDecodeOptions = existing.decodeOptions ?? []

				const nextDecodeOptions = previousDecodeOptions.filter((option) => {
					if (!option.sensor_id) return true
					return validSensorIds.includes(option.sensor_id)
				})

				const updated = await integrationsRepository.update(deviceId, {
					decodeOptions: nextDecodeOptions,
				})

				return res.json({
					success: true,
					removedCount: previousDecodeOptions.length - nextDecodeOptions.length,
					integration: updated,
				})
			} catch (error) {
				logger.error('Failed to reconcile sensors', { error })
				return res.status(500).json({ error: 'Internal server error' })
			}
		},
	)

	// GET TTN integration schema
	app.get('/integrations/schema/ttn', requireServiceKey, (req, res) => {
		res.json(ttnIntegrationSchema)
	})

	app.post('/webhook/ttn/:ttnDevId', async (req, res) => {
		const startTime = Date.now()
		const { ttnDevId } = req.params

		try {
			const payload = req.body as TtnWebhookPayload

			logger.info(`📨 Received TTN webhook`, {
				ttnDevId,
				port: payload.uplink_message?.f_port,
				hasDecodedPayload: !!payload.uplink_message?.decoded_payload,
				hasFrmPayload: !!payload.uplink_message?.frm_payload,
			})

			// validate webhook payload structure
			if (!payload.end_device_ids || !payload.uplink_message) {
				logger.warn('Malformed webhook payload', {
					hasEndDeviceIds: !!payload.end_device_ids,
					hasUplinkMessage: !!payload.uplink_message,
				})
				return res.status(422).json({
					error: 'Malformed request: missing end_device_ids or uplink_message',
				})
			}

			// check if payload data exists
			if (
				!payload.uplink_message.frm_payload &&
				!payload.uplink_message.decoded_payload
			) {
				logger.warn('Webhook missing payload data', { ttnDevId })
				return res.status(422).json({
					error: 'Missing payload data (frm_payload or decoded_payload)',
				})
			}

			//extract ttn identifiers
			const { device_id: payloadDevId, application_ids } =
				payload.end_device_ids

			const ttnAppId = application_ids.application_id
			const port = payload.uplink_message.f_port

			if (!Number.isInteger(port) || port < 1 || port > 223) {
				logger.warn('Webhook contains an invalid f_port', { ttnDevId, port })
				return res.status(422).json({
					error:
						'Malformed request: f_port must be an integer between 1 and 223',
				})
			}

			if (payloadDevId !== ttnDevId) {
				logger.warn('TTN device ID mismatch between URL and payload', {
					urlDevId: ttnDevId,
					payloadDevId,
				})
				return res.status(400).json({
					error: 'Device ID mismatch between URL and payload',
				})
			}

			logger.debug('TTN identifiers extracted', {
				ttnAppId,
				ttnDevId,
				port,
			})

			// fetch integration config by ttn identity
			const integration = await integrationsRepository.findByTtnDevice(
				ttnAppId,
				ttnDevId,
				port,
			)

			if (!integration) {
				logger.warn('Integration not found', { ttnAppId, ttnDevId })
				return res.status(404).json({
					error: `No TTN integration configured for device ${ttnDevId}`,
					hint: 'Configure the integration in OpenSenseMap device settings',
				})
			}

			if (!integration.enabled) {
				logger.warn('Integration disabled', {
					boxId: integration.deviceId,
					ttnDevId,
				})
				return res.status(403).json({
					error: 'TTN integration is disabled for this device',
				})
			}

			const boxId = integration.deviceId // osem device ID

			// decode payload
			logger.info(`🔧 Decoding payload`, {
				profile: integration.profile,
			})

			const measurements = await messageProcessor.processUplink(
				payload,
				integration,
			)

			logger.info(`✅ Decoded measurements`, {
				count: measurements.length,
				boxId,
			})

			if (measurements.length === 0) {
				return res.status(200).json({
					message: 'Webhook processed but no measurements decoded',
					count: 0,
				})
			}

			// send measurements to osem
			logger.info(`🚀 Sending measurements to OpenSenseMap`, {
				boxId,
				count: measurements.length,
			})

			await apiClient.sendMeasurements({
				deviceId: boxId,
				measurements,
			})

			const responseTime = Date.now() - startTime

			res.status(201).json({
				message: 'Measurements created successfully',
				count: measurements.length,
				responseTime: `${responseTime}ms`,
				boxId,
				profile: integration.profile,
			})

			logger.info(`✅ Webhook processed successfully`, {
				boxId,
				ttnDevId,
				responseTime: `${responseTime}ms`,
			})
		} catch (error) {
			const responseTime = Date.now() - startTime

			logger.error('❌ Error processing TTN webhook', {
				error:
					error instanceof Error
						? { message: error.message, stack: error.stack }
						: String(error),
				responseTime: `${responseTime}ms`,
				ttnDevId,
			})

			res.status(500).json({
				error: 'Internal server error',
				message: error instanceof Error ? error.message : String(error),
				responseTime: `${responseTime}ms`,
			})
		}
	})

	return app
}

export function requireServiceKey(req: any, res: any, next: any) {
	const key = req.headers['x-service-key']
	if (key !== config.API_SERVICE_KEY) {
		logger.warn('Unauthorized request - invalid service key', {
			path: req.path,
			ip: req.ip,
		})
		return res.status(401).json({ error: 'Unauthorized' })
	}
	next()
}
