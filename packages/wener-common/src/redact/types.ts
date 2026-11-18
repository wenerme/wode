/** Explicit display/diagnostic redaction; never installs a service policy. */
export interface Redactor {
	/**
	 * Returns a non-mutating display copy. T is a convenience, not a schema guarantee:
	 * sensitive values and bounded subtrees become marker strings. Objects/arrays,
	 * Map/Set entries, Error own data properties/cause, URL, URLSearchParams and Headers
	 * are supported. Cycles and shared references are retained among copied objects.
	 * Accessors are omitted without invoking them; custom toJSON hooks on copies are disabled.
	 * Date, RegExp, binary data, functions,
	 * streams and other class instances are opaque and retained by reference.
	 * Safe JSON/YAML strings retain their layout; changed JSON is serialized compactly.
	 * YAML uses scalar range edits; sensitive comments or ambiguous aliases mask the document.
	 */
	redact<T>(value: T): T;
	/**
	 * Inspects nested data and text. Nullish values and blank strings are not sensitive.
	 * Returns true conservatively when a traversal limit is reached.
	 */
	isSensitive(value: unknown, key?: string): boolean;
}

/** Additional rules only add sensitivity to non-empty values in the default credential policy. */
export type SensitivityRule = (value: unknown, key?: string) => boolean;

export interface RedactorOptions {
	marker?: string;
	/** Literal substrings; empty strings are ignored. Copied when creating the instance. */
	knownSecrets?: readonly string[];
	/** All matches are masked (global matching is added). Source/flags are copied; lastIndex is never shared. */
	patterns?: readonly RegExp[];
	/** Additional key names or patterns. Strings match after key normalization. */
	sensitiveKeys?: readonly (string | RegExp)[];
	/** Callbacks should be pure; their closure state remains the caller's responsibility. */
	rules?: readonly SensitivityRule[];
	/** Default 64, capped at 256 to bound the JavaScript call stack. */
	maxDepth?: number;
	/** Default 10,000 visited values/AST nodes per call. Exceeding it masks the whole result. */
	maxNodes?: number;
	/** Default 1,000,000 UTF-16 units per string; larger strings are masked. */
	maxTextLength?: number;
}

/** Options for the stateless text and compatibility helpers. */
export interface RedactionOptions extends RedactorOptions {
	redact?: boolean;
	key?: string;
}
