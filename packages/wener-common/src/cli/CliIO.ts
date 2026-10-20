/** 宿主负责实际读写；渲染器只生成文本，命令执行器不访问进程 stdio。 */
export interface CliIO {
	readonly stdin?: string;
	stdout(text: string): void;
	/** 可选无换行写入，用于逐块流式输出。 */
	write?(text: string): void;
	stderr?(text: string): void;
}
