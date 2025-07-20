type EstimateProcessTimeResult = {
	eta: number; // estimated time of arrival in seconds
	elapsed: number; // in seconds
	endTime: Date; // estimated end time
	rate: number; // rate of processing in items per second
};

export function getEstimateProcessTime({
	total,
	processed,
	startTime,
	elapsed = startTime ? (Date.now() - startTime.getTime()) / 1000 : undefined,
}: {
	total?: number;
	processed?: number;
	startTime?: Date;
	elapsed?: number; // in seconds
}): EstimateProcessTimeResult | undefined {
	if (typeof total !== 'number' || typeof processed !== 'number' || !elapsed || processed === 0 || processed >= total) {
		return undefined;
	}
	const now = new Date();
	const rate = processed / elapsed;
	if (rate === 0) {
		return undefined;
	}
	const remaining = total - processed;
	const eta = Math.round(remaining / rate);
	const endTime = new Date(now.getTime() + eta * 1000);
	return {
		eta,
		elapsed,
		endTime,
		rate,
	};
}
