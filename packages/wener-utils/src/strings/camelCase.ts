const UPPERCASE = /\p{Lu}/u;
const LOWERCASE = /\p{Ll}/u;
const SEPARATORS = /[_.\- ]+/u;
const LEADING_SEPARATORS = /^[_.\- ]+/u;
const IDENTIFIER = /([\p{L}\p{N}]|$)/u;
const SEPARATORS_AND_IDENTIFIER = new RegExp(`${SEPARATORS.source}${IDENTIFIER.source}`, 'gu');
const NUMBERS_AND_IDENTIFIER = new RegExp(`\\d+${IDENTIFIER.source}`, 'gu');
const ASCII_SEPARATORS_AND_IDENTIFIER = /[_.\- ]+([A-Za-z\d]|$)/g;
const ASCII_NUMBERS_AND_IDENTIFIER = /\d+([A-Za-z\d]|$)/g;
const PASCAL_CASE_OPTIONS = { pascalCase: true } as const;

export type CamelCaseOptions = {
	readonly pascalCase?: boolean;
};

function isAsciiLower(code: number): boolean {
	return code >= 97 && code <= 122;
}

function isAsciiUpper(code: number): boolean {
	return code >= 65 && code <= 90;
}

function isAscii(input: string): boolean {
	for (let index = 0; index < input.length; index++) {
		if (input.charCodeAt(index) > 127) return false;
	}
	return true;
}

function preserveAsciiCamelCase(input: string): string | undefined {
	const output = Array<string>(input.length * 2);
	let outputIndex = 0;
	let isLastCharacterLower = false;
	let isLastCharacterUpper = false;
	let isLastLastCharacterUpper = false;

	for (let index = 0; index < input.length; index++) {
		const code = input.charCodeAt(index);
		if (code > 127) return undefined;

		const isCharacterLower = isAsciiLower(code);
		const isCharacterUpper = isAsciiUpper(code);
		const isRecentBoundary = outputIndex <= 2 || output[outputIndex - 3] === '-';

		if (isLastCharacterLower && isCharacterUpper) {
			output[outputIndex++] = '-';
			isLastCharacterLower = false;
			isLastLastCharacterUpper = isLastCharacterUpper;
			isLastCharacterUpper = true;
		} else if (isLastCharacterUpper && isLastLastCharacterUpper && isCharacterLower && !isRecentBoundary) {
			const previousCharacter = output[--outputIndex];
			output[outputIndex++] = '-';
			output[outputIndex++] = previousCharacter;
			isLastLastCharacterUpper = isLastCharacterUpper;
			isLastCharacterUpper = false;
			isLastCharacterLower = true;
		} else {
			isLastCharacterLower = isCharacterLower;
			isLastLastCharacterUpper = isLastCharacterUpper;
			isLastCharacterUpper = isCharacterUpper;
		}

		output[outputIndex++] = input[index];
	}

	output.length = outputIndex;
	return output.join('');
}

function preserveUnicodeCamelCase(input: string): string {
	const characters = [...input];
	const output = Array<string>(characters.length * 2);
	let outputIndex = 0;
	let isLastCharacterLower = false;
	let isLastCharacterUpper = false;
	let isLastLastCharacterUpper = false;

	for (const character of characters) {
		const isCharacterLower = LOWERCASE.test(character);
		const isCharacterUpper = UPPERCASE.test(character);
		const isRecentBoundary = outputIndex <= 2 || output[outputIndex - 3] === '-';

		if (isLastCharacterLower && isCharacterUpper) {
			output[outputIndex++] = '-';
			isLastCharacterLower = false;
			isLastLastCharacterUpper = isLastCharacterUpper;
			isLastCharacterUpper = true;
		} else if (isLastCharacterUpper && isLastLastCharacterUpper && isCharacterLower && !isRecentBoundary) {
			const previousCharacter = output[--outputIndex];
			output[outputIndex++] = '-';
			output[outputIndex++] = previousCharacter;
			isLastLastCharacterUpper = isLastCharacterUpper;
			isLastCharacterUpper = false;
			isLastCharacterLower = true;
		} else {
			isLastCharacterLower = isCharacterLower;
			isLastLastCharacterUpper = isLastCharacterUpper;
			isLastCharacterUpper = isCharacterUpper;
		}

		output[outputIndex++] = character;
	}

	output.length = outputIndex;
	return output.join('');
}

function capitalizeNumericIdentifier(match: string, identifier: string, offset: number, input: string): string {
	const nextCharacter = input.charAt(offset + match.length);
	if (
		identifier.length === 0 ||
		nextCharacter === '_' ||
		nextCharacter === '.' ||
		nextCharacter === '-' ||
		nextCharacter === ' '
	) {
		return match;
	}
	return match.slice(0, -identifier.length) + identifier.toUpperCase();
}

function capitalizeIdentifier(_match: string, identifier: string): string {
	return identifier.toUpperCase();
}

function upperFirst(input: string): string {
	const firstCharacter = String.fromCodePoint(input.codePointAt(0)!);
	return firstCharacter.toUpperCase() + input.slice(firstCharacter.length);
}

export function pascalCase(input: string | readonly string[]): string {
	return camelCase(input, PASCAL_CASE_OPTIONS);
}

export function camelCase(input: string | readonly string[], options?: CamelCaseOptions): string {
	if (!(typeof input === 'string' || Array.isArray(input))) {
		throw new TypeError('Expected the input to be `string | string[]`');
	}

	if (Array.isArray(input)) {
		input = input
			.map((value) => value.trim())
			.filter((value) => value.length > 0)
			.join('-');
	} else {
		input = input.trim();
	}

	if (input.length === 0) return '';

	let ascii = true;
	if (input !== input.toLowerCase()) {
		const asciiInput = preserveAsciiCamelCase(input);
		if (asciiInput === undefined) {
			ascii = false;
			input = preserveUnicodeCamelCase(input);
		} else {
			input = asciiInput;
		}
	} else {
		ascii = isAscii(input);
	}

	input = input.replace(LEADING_SEPARATORS, '');
	if (input.length === 0) return '';

	input = input.toLowerCase();
	input = ascii
		? input
				.replace(ASCII_NUMBERS_AND_IDENTIFIER, capitalizeNumericIdentifier)
				.replace(ASCII_SEPARATORS_AND_IDENTIFIER, capitalizeIdentifier)
		: input
				.replace(NUMBERS_AND_IDENTIFIER, capitalizeNumericIdentifier)
				.replace(SEPARATORS_AND_IDENTIFIER, capitalizeIdentifier);

	return options?.pascalCase ? upperFirst(input) : input;
}
