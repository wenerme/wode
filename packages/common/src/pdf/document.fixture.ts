/** Generate small synthetic documents for offline PDF tests. */
export function createMinimalPdf(objects: string[], options: { infoRef?: number | null } = {}): string {
	let out = '%PDF-1.4\n';
	const offsets = [0];
	for (const object of objects) {
		offsets.push(Buffer.byteLength(out));
		out += `${object}\n`;
	}
	const infoRef = options.infoRef === undefined ? (objects.length >= 4 ? 4 : undefined) : options.infoRef;
	const xref = Buffer.byteLength(out);
	out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (let index = 1; index < offsets.length; index++) out += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
	out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R${infoRef ? ` /Info ${infoRef} 0 R` : ''} >>\nstartxref\n${xref}\n%%EOF\n`;
	return out;
}
export function createMinimalOnePagePdf(info = ''): string {
	return createMinimalPdf([
		'1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
		'2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
		'3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj',
		`4 0 obj\n<< ${info} >>\nendobj`,
	]);
}
function pdfText(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
export function createTextPdf(lines: string[], info = ''): string {
	const commands = [
		'BT',
		'/F1 12 Tf',
		'72 720 Td',
		...lines.flatMap((line, index) => [`(${pdfText(line)}) Tj`, ...(index < lines.length - 1 ? ['0 -20 Td'] : [])]),
		'ET',
	].join('\n');
	return createMinimalPdf(
		[
			'1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
			'2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
			'3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj',
			`4 0 obj\n<< /Length ${Buffer.byteLength(commands)} >>\nstream\n${commands}\nendstream\nendobj`,
			'5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
			`6 0 obj\n<< ${info} >>\nendobj`,
		],
		{ infoRef: info ? 6 : null },
	);
}
export function createMultiPagePdf(count = 3): string {
	return createMinimalPdf(
		[
			'1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
			`2 0 obj\n<< /Type /Pages /Kids [${Array.from({ length: count }, (_, i) => `${i + 3} 0 R`).join(' ')}] /Count ${count} >>\nendobj`,
			...Array.from(
				{ length: count },
				(_, i) => `${i + 3} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 72 144] >>\nendobj`,
			),
		],
		{ infoRef: null },
	);
}
