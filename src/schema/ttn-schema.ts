import {
	CAYENNE_LPP_DECODERS,
	LORA_SERIALIZATION_DECODERS,
	SENSEBOX_HOME_DECODERS,
	TTN_PROFILES,
} from '../integration-config.js'

const sensorIdProperty = {
	type: 'string',
	title: 'Sensor ID',
	minLength: 1,
}

const decodeOptions = (
	itemSchema: Record<string, unknown>,
): Record<string, unknown> => ({
	type: 'array',
	title: 'Decode Options',
	minItems: 1,
	items: itemSchema,
})

const profileCondition = (
	profile: (typeof TTN_PROFILES)[number],
	itemSchema?: Record<string, unknown>,
): Record<string, unknown> => ({
	if: {
		required: ['profile'],
		properties: { profile: { const: profile } },
	},
	// oxlint-disable-next-line unicorn/no-thenable -- Standard JSON Schema keyword; the value is a non-callable subschema.
	then: itemSchema
		? {
				required: ['decodeOptions'],
				properties: { decodeOptions: decodeOptions(itemSchema) },
			}
		: {
				properties: {
					decodeOptions: {
						type: 'array',
						maxItems: 0,
						items: {
							type: 'object',
						},
					},
				},
			},
})

const sensorDecoderOptions = (
	decoders: readonly string[],
): Record<string, unknown> => ({
	type: 'object',
	required: ['sensor_id', 'decoder'],
	properties: {
		sensor_id: sensorIdProperty,
		decoder: {
			type: 'string',
			title: 'Decoder Type',
			enum: decoders,
		},
	},
})

const loraSerializationOptions = {
	type: 'object',
	required: ['decoder'],
	properties: {
		sensor_id: sensorIdProperty,
		decoder: {
			type: 'string',
			title: 'Decoder Type',
			enum: LORA_SERIALIZATION_DECODERS,
		},
	},
	allOf: [
		{
			if: {
				required: ['decoder'],
				properties: {
					decoder: { enum: ['latLng', 'unixtime'] },
				},
			},
			// oxlint-disable-next-line unicorn/no-thenable -- Standard JSON Schema keyword; the value is a non-callable subschema.
			then: {},
			else: { required: ['sensor_id'] },
		},
	],
}

const cayenneLppOptions = {
	type: 'object',
	required: ['sensor_id', 'decoder', 'channel'],
	properties: {
		sensor_id: sensorIdProperty,
		decoder: {
			type: 'string',
			title: 'Cayenne LPP Type',
			enum: CAYENNE_LPP_DECODERS,
		},
		channel: {
			type: 'integer',
			title: 'Channel',
			minimum: 0,
			maximum: 255,
		},
	},
}

export const ttnIntegrationSchema = {
	schema: {
		type: 'object',
		required: ['enabled', 'devId', 'appId', 'profile'],
		properties: {
			enabled: {
				type: 'boolean',
				title: 'Enable TTN',
				default: true,
			},
			appId: {
				type: 'string',
				title: 'Application ID',
				minLength: 1,
			},
			devId: {
				type: 'string',
				title: 'Device ID',
				minLength: 1,
			},
			profile: {
				type: 'string',
				title: 'Decoder Profile',
				enum: TTN_PROFILES,
				default: 'json',
			},
			port: {
				type: ['integer', 'null'],
				title: 'Port (optional)',
				minimum: 1,
				maximum: 223,
			},
		},
		allOf: [
			profileCondition('json'),
			profileCondition('debug', {
				type: 'object',
				required: ['sensor_id', 'bytes'],
				properties: {
					sensor_id: sensorIdProperty,
					bytes: {
						type: 'integer',
						title: 'Bytes',
						minimum: 1,
					},
				},
			}),
			profileCondition(
				'sensebox/home',
				sensorDecoderOptions(SENSEBOX_HOME_DECODERS),
			),
			profileCondition('lora-serialization', loraSerializationOptions),
			profileCondition('cayenne-lpp', cayenneLppOptions),
		],
	},
	uiSchema: {
		'ui:order': ['enabled', 'appId', 'devId', 'profile', 'port', '*'],
		appId: {
			'ui:help': 'TTN application ID (app_id)',
		},
		devId: {
			'ui:help': 'TTN device ID (dev_id)',
		},
		profile: {
			'ui:help':
				'json: Direct JSON mapping | cayenne-lpp: Cayenne LPP format | sensebox/home: senseBox:home format | lora-serialization: Custom byte encoding | debug: Raw bytes',
		},
		port: {
			'ui:help': 'Leave empty to process messages from all ports',
			'ui:emptyValue': null,
		},
		decodeOptions: {
			'ui:help':
				'Configure how to decode the payload for the selected profile.',
			'ui:options': {
				orderable: false,
				addable: true,
				removable: true,
			},
			items: {
				sensor_id: {
					'ui:help': 'Select the sensor that will receive this decoded value',
				},
				decoder: {
					'ui:help': 'Type of decoder to use for this sensor data',
				},
				channel: {
					'ui:widget': 'updown',
					'ui:help': 'Cayenne LPP channel (0-255)',
				},
				bytes: {
					'ui:widget': 'updown',
					'ui:help':
						'Number of consecutive payload bytes assigned to this sensor',
				},
			},
		},
	},
}
