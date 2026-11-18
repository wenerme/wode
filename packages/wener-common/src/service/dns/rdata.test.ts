import { describe, expect, it } from 'vitest';
import {
	canonicalRdata,
	formatCaa,
	formatRawTxt,
	formatTxtValue,
	isQuotedTxt,
	normalizeTxtValue,
	parseCaa,
	parseMx,
	parseSrv,
	parseTxtValue,
	splitCharacterStrings,
	tokenizeRdata,
} from './rdata';
import { DnsOperationScope, formatPageCursor, pageLocally, parsePageCursor, planDnsRecordChanges } from './rrset';

describe('presentation-format helpers', () => {
	it('parses and formats TXT character-strings', () => {
		expect(parseTxtValue('"part one" "part two"')).toEqual(['part one', 'part two']);
		expect(parseTxtValue('"say \\"hi\\" \\\\ ok"')).toEqual(['say "hi" \\ ok']);
		expect(parseTxtValue('"k=v\\059x"')).toEqual(['k=v;x']);
		expect(parseTxtValue('"\\228\\184\\173"')).toEqual(['\u4e2d']);
		expect(parseTxtValue('bare words')).toEqual(['bare', 'words']);
		expect(formatTxtValue(['say "hi"', 'a\\b'])).toBe('"say \\"hi\\"" "a\\\\b"');
		expect(normalizeTxtValue('"k=v\\059x"  bare')).toBe('"k=v\\059x" "bare"');
		expect(isQuotedTxt('"a" "b"')).toBe(true);
		expect(isQuotedTxt('v=spf1 -all')).toBe(false);
		expect(() => tokenizeRdata('"unterminated')).toThrow();
		expect(splitCharacterStrings('a'.repeat(300))).toEqual(['a'.repeat(255), 'a'.repeat(45)]);
		expect(formatRawTxt('a'.repeat(300))).toBe(`"${'a'.repeat(255)}" "${'a'.repeat(45)}"`);
		expect(normalizeTxtValue(`"${'b'.repeat(300)}" "x"`)).toBe(`"${'b'.repeat(255)}" "${'b'.repeat(45)}" "x"`);
		// Multi-byte characters are not split mid-sequence.
		expect(splitCharacterStrings('\u4e2d'.repeat(100)).map((part) => new TextEncoder().encode(part).byteLength)).toEqual([255, 45]);
	});

	it('parses MX, SRV and CAA', () => {
		expect(parseMx('10 mx.example.com')).toEqual({ priority: 10, target: 'mx.example.com.' });
		expect(parseSrv('10 5 5060 sip.example.com.')).toEqual({ priority: 10, weight: 5, port: 5060, target: 'sip.example.com.' });
		expect(parseCaa('0 issue "ca.example.net; account=1"')).toEqual({ flags: 0, tag: 'issue', value: 'ca.example.net; account=1' });
		expect(formatCaa({ flags: 128, tag: 'iodef', value: 'mailto:ops@example.com' })).toBe('128 iodef "mailto:ops@example.com"');
		expect(() => parseMx('mx.example.com.')).toThrow('MX value');
		expect(() => parseSrv('1 2 99999 a.')).toThrow();
		expect(canonicalRdata('cname', 'Target.Example.com')).toBe('target.example.com.');
		expect(canonicalRdata('TXT', 'hello')).toBe('"hello"');
		expect(canonicalRdata('TXT', `"${'c'.repeat(300)}"`)).toBe(canonicalRdata('TXT', `"${'c'.repeat(255)}" "${'c'.repeat(45)}"`));
		expect(canonicalRdata('TXT', '"a" "b"')).not.toBe(canonicalRdata('TXT', '"ab"'));
	});
});

describe('RRSet helpers', () => {
	it('plans keep/update/create/delete with in-place reuse', () => {
		const existing = [
			{ record: 'r1', value: '192.0.2.1', ttl: 60 },
			{ record: 'r2', value: '192.0.2.2', ttl: 300 },
			{ record: 'r3', value: '192.0.2.3', ttl: 60 },
			{ record: 'r4', value: '192.0.2.4', ttl: 60 },
		];
		const plan = planDnsRecordChanges({ type: 'A', ttl: 60, values: ['192.0.2.1', '192.0.2.2', '192.0.2.9', '192.0.2.1'], existing });
		expect(plan).toEqual({
			keep: ['r1'],
			update: [{ record: 'r2', value: '192.0.2.2' }, { record: 'r3', value: '192.0.2.9' }],
			create: [],
			delete: ['r4'],
		});
		expect(planDnsRecordChanges({ type: 'A', ttl: 60, values: ['192.0.2.1'], existing: [] }).create).toEqual(['192.0.2.1']);
	});

	it('pages locally and parses page cursors', () => {
		expect(pageLocally([1, 2, 3], { limit: 2 })).toEqual({ items: [1, 2], nextCursor: 'o:2' });
		expect(pageLocally([1, 2, 3], { limit: 2, cursor: 'o:2' })).toEqual({ items: [3] });
		expect(parsePageCursor('p:3:50')).toEqual({ page: 3, size: 50 });
		expect(parsePageCursor(undefined, 20)).toEqual({ page: 1, size: 20 });
		expect(formatPageCursor(2, 20)).toBe('p:2:20');
		expect(() => parsePageCursor('p:2:20', 10)).toThrow('different limit');
		expect(() => parsePageCursor('p:3')).toThrow();
		expect(() => parsePageCursor('p:0:5')).toThrow();
	});

	it('bounds an operation with one deadline and aborts on close', async () => {
		const scope = new DnsOperationScope(20);
		await expect(scope.run(undefined, () => new Promise(() => undefined))).rejects.toMatchObject({ code: 'TIMEOUT' });
		const long = new DnsOperationScope(10_000);
		let seen: AbortSignal | undefined;
		const pending = long.run(undefined, (signal) => {
			seen = signal;
			return new Promise(() => undefined);
		});
		long.close();
		await expect(pending).rejects.toMatchObject({ code: 'CLOSED' });
		expect(seen?.aborted).toBe(true);
		await expect(long.run(undefined, async () => 1)).rejects.toMatchObject({ code: 'CLOSED' });
	});
});
