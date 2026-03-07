import 'reflect-metadata';
import { computeIfAbsent, Errors } from '@wener/utils';
import { getOwnMetadata } from 'reflect-metadata/no-conflict';

/**
 * Decorator to declare features for a class
 */
export const Feature = (o: string[] | FeatureOptions): ClassDecorator => {
	if (Array.isArray(o)) {
		o = { features: o };
	}
	return Reflect.metadata(FeatureKey, o);
};

/**
 * Helper to check features on a class
 */
export class Features {
	private static cache = new Map<Function, any>();

	static requireFeature(c: any, f: string | string[]) {
		Errors.NotImplemented.check(Features.hasFeature(c, f), `Feature not implemented: ${f}`);
		return c;
	}

	static hasFeature(c: any, f: string | string[]) {
		let features = Features.getFeatures(c);
		if (typeof f === 'string') {
			return features.includes(f);
		}
		return f.every((v) => features.includes(v));
	}

	static getFeatures(c: any) {
		if (typeof c !== 'function') {
			c = c.constructor;
		}
		return computeIfAbsent(Features.cache, c, () => {
			let all = [getOwnMetadata(FeatureKey, c) as FeatureOptions | undefined];
			{
				let p = c;
				while ((p = Object.getPrototypeOf(p))) {
					if (p === Function) {
						break;
					}
					all.push(getOwnMetadata(FeatureKey, p));
				}
			}
			all = all.filter(Boolean);
			return Array.from(new Set(all.flatMap((v) => v?.features ?? []))).sort();
		});
	}
}

export interface FeatureOptions {
	features: string[];
	abstract?: boolean;
	metadata?: any;
}

const FeatureKey = Symbol.for('Feature');
