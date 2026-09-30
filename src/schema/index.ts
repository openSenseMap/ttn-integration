import { createId } from '@paralleldrive/cuid2'
import { type InferSelectModel, sql } from 'drizzle-orm'
import {
	boolean,
	check,
	integer,
	json,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'

export const ttnProfileEnum = pgEnum('ttn_profile', [
	'json',
	'debug',
	'sensebox/home',
	'lora-serialization',
	'cayenne-lpp',
])

export const ttnIntegration = pgTable(
	'ttn_integration',
	{
		id: text('id')
			.primaryKey()
			.notNull()
			.$defaultFn(() => createId()),

		deviceId: text('device_id').notNull().unique(),
		enabled: boolean('enabled').default(true).notNull(),

		devId: text('dev_id').notNull(),
		appId: text('app_id').notNull(),
		port: integer('port'),
		profile: ttnProfileEnum('profile').default('json').notNull(),

		decodeOptions: json('decode_options').$type<
			Array<{
				sensor_id?: string
				sensor_title?: string
				sensor_type?: string
				decoder?: string
				[key: string]: any
			}>
		>(),

		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),

		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		check(
			'ttn_integration_port_range_check',
			sql`${table.port} IS NULL OR ${table.port} BETWEEN 1 AND 223`,
		),
	],
)

export type TtnIntegration = InferSelectModel<typeof ttnIntegration>
