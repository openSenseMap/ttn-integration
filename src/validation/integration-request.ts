import {
	CAYENNE_LPP_DECODERS,
	LORA_SERIALIZATION_DECODERS,
	LORA_SERIALIZATION_METADATA_DECODERS,
	SENSEBOX_HOME_DECODERS,
	TTN_PROFILES,
	type TtnProfile,
} from '../integration-config.js'

export interface IntegrationDecodeOption {
	sensor_id?: string
	sensor_title?: string
	sensor_type?: string
	decoder?: string
	channel?: number
	bytes?: number
	[key: string]: unknown
}

export interface IntegrationRequest {
	enabled?: boolean
	devId: string
	appId: string
	profile: TtnProfile
	port?: number | null
	decodeOptions?: IntegrationDecodeOption[]
}

export type IntegrationRequestValidation =
	| { valid: true }
	| { valid: false; errors: string[] }

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0
}

function isOneOf(value: string, allowed: readonly string[]): boolean {
	return allowed.includes(value)
}

function requireDecodeOptions(
	value: unknown,
	profile: TtnProfile,
	errors: string[],
): Record<string, unknown>[] | undefined {
	if (!Array.isArray(value) || value.length === 0) {
		errors.push(
			`decodeOptions must contain at least one option for profile '${profile}'`,
		)
		return undefined
	}

	const options: Record<string, unknown>[] = []
	value.forEach((option, index) => {
		if (!isRecord(option)) {
			errors.push(`decodeOptions[${index}] must be an object`)
			return
		}
		options.push(option)
	})

	return options
}

function validateSensorId(
	option: Record<string, unknown>,
	index: number,
	errors: string[],
): void {
	if (!isNonEmptyString(option.sensor_id)) {
		errors.push(`decodeOptions[${index}].sensor_id must be a non-empty string`)
	}
}

function validateCayenneOptions(value: unknown, errors: string[]): void {
	const options = requireDecodeOptions(value, 'cayenne-lpp', errors)
	options?.forEach((option, index) => {
		validateSensorId(option, index, errors)

		if (
			!isNonEmptyString(option.decoder) ||
			!isOneOf(option.decoder, CAYENNE_LPP_DECODERS)
		) {
			errors.push(
				`decodeOptions[${index}].decoder must be one of: ${CAYENNE_LPP_DECODERS.join(', ')}`,
			)
		}

		if (
			!Number.isInteger(option.channel) ||
			(option.channel as number) < 0 ||
			(option.channel as number) > 255
		) {
			errors.push(
				`decodeOptions[${index}].channel must be an integer between 0 and 255`,
			)
		}
	})
}

function validateDebugOptions(value: unknown, errors: string[]): void {
	const options = requireDecodeOptions(value, 'debug', errors)
	options?.forEach((option, index) => {
		validateSensorId(option, index, errors)
		if (!Number.isInteger(option.bytes) || (option.bytes as number) < 1) {
			errors.push(`decodeOptions[${index}].bytes must be a positive integer`)
		}
	})
}

function validateSenseboxHomeOptions(value: unknown, errors: string[]): void {
	const options = requireDecodeOptions(value, 'sensebox/home', errors)
	options?.forEach((option, index) => {
		validateSensorId(option, index, errors)
		if (
			!isNonEmptyString(option.decoder) ||
			!isOneOf(option.decoder, SENSEBOX_HOME_DECODERS)
		) {
			errors.push(
				`decodeOptions[${index}].decoder must be one of: ${SENSEBOX_HOME_DECODERS.join(', ')}`,
			)
		}
	})
}

function validateLoraSerializationOptions(
	value: unknown,
	errors: string[],
): void {
	const options = requireDecodeOptions(value, 'lora-serialization', errors)
	options?.forEach((option, index) => {
		if (
			!isNonEmptyString(option.decoder) ||
			!isOneOf(option.decoder, LORA_SERIALIZATION_DECODERS)
		) {
			errors.push(
				`decodeOptions[${index}].decoder must be one of: ${LORA_SERIALIZATION_DECODERS.join(', ')}`,
			)
			return
		}

		if (isOneOf(option.decoder, LORA_SERIALIZATION_METADATA_DECODERS)) {
			return
		}

		if (
			!isNonEmptyString(option.sensor_id) &&
			!isNonEmptyString(option.sensor_title) &&
			!isNonEmptyString(option.sensor_type)
		) {
			errors.push(
				`decodeOptions[${index}] must identify a sensor with sensor_id, sensor_title, or sensor_type`,
			)
		}
	})
}

/**
 * Validate the public PUT /integrations/:deviceId request body.
 *
 * This deliberately does not coerce input. Callers can safely persist the body
 * after a successful result without relying on form-side JSON Schema checks.
 */
export function validateIntegrationRequest(
	body: unknown,
): IntegrationRequestValidation {
	if (!isRecord(body)) {
		return { valid: false, errors: ['request body must be an object'] }
	}

	const errors: string[] = []

	if (!isNonEmptyString(body.devId)) {
		errors.push('devId is required and must be a non-empty string')
	}

	if (!isNonEmptyString(body.appId)) {
		errors.push('appId is required and must be a non-empty string')
	}

	const profile =
		isNonEmptyString(body.profile) && isOneOf(body.profile, TTN_PROFILES)
			? (body.profile as TtnProfile)
			: undefined

	if (!profile) {
		errors.push(`profile must be one of: ${TTN_PROFILES.join(', ')}`)
	}

	if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
		errors.push('enabled must be a boolean')
	}

	if (
		body.port !== undefined &&
		body.port !== null &&
		(!Number.isInteger(body.port) ||
			(body.port as number) < 1 ||
			(body.port as number) > 223)
	) {
		errors.push('port must be an integer between 1 and 223')
	}

	if (body.decodeOptions !== undefined && !Array.isArray(body.decodeOptions)) {
		errors.push('decodeOptions must be an array')
	}

	switch (profile) {
		case 'json':
			if (Array.isArray(body.decodeOptions) && body.decodeOptions.length > 0) {
				errors.push("profile 'json' does not use decodeOptions")
			}
			break
		case 'debug':
			validateDebugOptions(body.decodeOptions, errors)
			break
		case 'sensebox/home':
			validateSenseboxHomeOptions(body.decodeOptions, errors)
			break
		case 'lora-serialization':
			validateLoraSerializationOptions(body.decodeOptions, errors)
			break
		case 'cayenne-lpp':
			validateCayenneOptions(body.decodeOptions, errors)
			break
	}

	return errors.length === 0 ? { valid: true } : { valid: false, errors }
}

/**
 * Normalize identifiers after validation so route uniqueness and webhook
 * lookup use the same canonical values. TTN identifiers cannot contain
 * leading or trailing whitespace.
 */
export function normalizeIntegrationRequest(body: unknown): IntegrationRequest {
	const validation = validateIntegrationRequest(body)
	if (!validation.valid) {
		throw new TypeError('Cannot normalize an invalid integration request')
	}

	const request = body as unknown as IntegrationRequest
	return {
		...request,
		appId: request.appId.trim(),
		devId: request.devId.trim(),
		decodeOptions: request.decodeOptions?.map((option) => ({
			...option,
			...(typeof option.sensor_id === 'string'
				? { sensor_id: option.sensor_id.trim() }
				: {}),
			...(typeof option.sensor_title === 'string'
				? { sensor_title: option.sensor_title.trim() }
				: {}),
			...(typeof option.sensor_type === 'string'
				? { sensor_type: option.sensor_type.trim() }
				: {}),
		})),
	}
}
