const TTN_ROUTE_CONFLICT_CONSTRAINT = 'ttn_integration_ttn_route_exclude'

type DatabaseError = {
	code?: unknown
	constraint_name?: unknown
	cause?: unknown
}

/**
 * Detect the named PostgreSQL exclusion violation after unwrapping errors
 * added by Drizzle. postgres.js exposes the constraint as `constraint_name`.
 */
export function isTtnRouteConflictError(error: unknown): boolean {
	let current = error
	const seen = new Set<object>()

	while (current !== null && typeof current === 'object') {
		if (seen.has(current)) return false
		seen.add(current)

		const databaseError = current as DatabaseError
		if (
			databaseError.code === '23P01' &&
			databaseError.constraint_name === TTN_ROUTE_CONFLICT_CONSTRAINT
		) {
			return true
		}

		current = databaseError.cause
	}

	return false
}
