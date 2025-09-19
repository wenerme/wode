type Writer = (message?: any, ...args: any[]) => void;

export type Logger = {
	log: Writer;
	info: Writer;
	warn: Writer;
	error: Writer;
	debug: Writer;
	trace: Writer;
};
