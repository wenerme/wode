import { DefaultMarker } from './policy';

const DsnUserInfoPattern = /(^|[\s"'=(,:[{])([^\s"'=:@/,;()[\]{}]*):([^\s"']+)@(?=[^\s"'@])/gu;
const CredentialTokenPatterns: readonly RegExp[] = [
	/\b(sk-(?:ant-|proj-|live-|test-)?)[A-Za-z0-9_-]{16,}/gu,
	/\b(gh[pousr]_)[A-Za-z0-9]{20,}/gu,
	/\b(github_pat_)[A-Za-z0-9_]{20,}/gu,
	/\b(glpat-)[A-Za-z0-9_-]{16,}/gu,
	/\b(xox[abposr]-)[A-Za-z0-9-]{10,}/gu,
	/\b(AKIA|ASIA)[A-Z0-9]{16}\b/gu,
	/\b(AIza)[A-Za-z0-9_-]{30,}/gu,
	/\b(eyJ)[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/gu,
	/\b(Bearer\s+)[A-Za-z0-9._~+/-]+=*/giu,
	/\b(\d{6,12}:)[A-Za-z0-9_-]{30,}\b/gu,
];
const PemPrivateKeyPattern = /(-----BEGIN [A-Z ]*PRIVATE KEY-----)[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----)/gu;
const BasicPattern = /\b(Basic\s+)([A-Za-z0-9+/]{4,}={0,2})/giu;

/** Masks established credential shapes, retaining recognizable prefixes for diagnostics. */
export function redactCredentialShapes(
	value: string,
	marker = DefaultMarker,
	onSensitive: () => void = () => {},
): string {
	let output = value.replace(PemPrivateKeyPattern, (_full, begin: string, end: string) => {
		onSensitive();
		return `${begin}${marker}${end}`;
	});
	output = output.replace(DsnUserInfoPattern, (full, lead: string, user: string, password: string) => {
		if (password.startsWith('//')) return full;
		onSensitive();
		return password === marker ? full : `${lead}${user}:${marker}@`;
	});
	for (const pattern of CredentialTokenPatterns)
		output = output.replace(pattern, (_full, keep: string) => {
			onSensitive();
			return `${keep}${marker}`;
		});
	output = output.replace(BasicPattern, (full, keep: string, token: string) => {
		// Retain the established long-token rule and recognize short user:password base64,
		// without treating prose such as `Basic configuration` as credentials.
		let credential = token.length >= 16;
		if (!credential && typeof atob === 'function') {
			try {
				credential = atob(token).includes(':');
			} catch {
				/* Ordinary words need not be valid base64. */
			}
		}
		if (!credential) return full;
		onSensitive();
		return `${keep}${marker}`;
	});
	return output;
}
