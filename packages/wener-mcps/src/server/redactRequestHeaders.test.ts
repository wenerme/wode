import { describe, expect, it } from 'vitest';
import { REDACTED_HEADER_VALUE, redactRequestHeaders } from './redactRequestHeaders';

describe('redactRequestHeaders', () => {
	it('redacts credentials while retaining non-sensitive routing metadata', () => {
		const headers = new Headers({
			Accept: 'application/json',
			Authorization: 'Bearer client-token',
			Cookie: 'session=private',
			'X-Forwarded-Authorization': 'Basic private',
			'X-Token': 'client-token',
			'X-DB-URL': 'postgres://user:password@db.internal/app',
			'X-DB-READ-URL': 'postgres://reader:password@db.internal/app',
			'X-DB-WRITE-URL': 'postgres://writer:password@db.internal/app',
			'X-Grafana-Service-Account-Token': 'grafana-token',
			'X-Grafana-Password': 'grafana-password',
			'X-CLS-Secret-ID': 'secret-id',
			'X-Gemini-API-Key': 'gemini-key',
			'X-Custom-URL': 'https://user:password@example.com/api',
			'X-MCP-URL': 'https://mcp.example.com/api',
			'X-Grafana-Org-ID': '9',
		});

		expect(redactRequestHeaders(headers)).toEqual({
			accept: 'application/json',
			authorization: REDACTED_HEADER_VALUE,
			cookie: REDACTED_HEADER_VALUE,
			'x-cls-secret-id': REDACTED_HEADER_VALUE,
			'x-custom-url': REDACTED_HEADER_VALUE,
			'x-db-read-url': REDACTED_HEADER_VALUE,
			'x-db-url': REDACTED_HEADER_VALUE,
			'x-db-write-url': REDACTED_HEADER_VALUE,
			'x-gemini-api-key': REDACTED_HEADER_VALUE,
			'x-forwarded-authorization': REDACTED_HEADER_VALUE,
			'x-grafana-org-id': '9',
			'x-grafana-password': REDACTED_HEADER_VALUE,
			'x-grafana-service-account-token': REDACTED_HEADER_VALUE,
			'x-mcp-url': 'https://mcp.example.com/api',
			'x-token': REDACTED_HEADER_VALUE,
		});
	});
});
