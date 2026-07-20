import { z } from 'zod/v4';

export const ApkIndexPackageSchema = z.looseObject({
	checksum: z.string(),
	pkg: z.string(),
	version: z.string(),
	description: z.string(),
	arch: z.string(),
	size: z.number(),
	installSize: z.number(),
	maintainer: z.string().nullish(),
	origin: z.string(),
	buildTime: z.number(),
	commit: z.string(),
	license: z.string(),
	providerPriority: z.number().nullish(),
	url: z.string(),
	depends: z.array(z.string()).default([]),
	provides: z.array(z.string()).default([]),
	installIf: z.array(z.string()).default([]),

	maintainerName: z.string().nullish(),
	maintainerEmail: z.string().nullish(),
});

export type ApkIndexPackage = z.infer<typeof ApkIndexPackageSchema>;

/**
 * @see https://wiki.alpinelinux.org/wiki/Apk_spec
 */

// 	// branch: string;
// 	// repo: string;
// 	// arch: string;
// 	// name: string;
// 	// version: string;
// 	// size: number;
// 	// installSize: number;
// 	// description: string;
// 	// url: string;
// 	// license: string;
// 	// maintainer: string;
// 	// origin: string;
// 	// buildTime: string;
// 	// commit: string;
//
// 	// maintainerName: string;
// 	// maintainerEmail: string;
// 	// path: string;
// 	// key: string;
//
// 	// commitData: Commit;
// 	// dependPackages: PackageIndexEntry[];
// }

const Alias2Name: Record<string, keyof ApkIndexPackage> = {
	C: 'checksum',
	P: 'pkg',
	V: 'version',
	A: 'arch',
	S: 'size',
	I: 'installSize',
	T: 'description',
	U: 'url',
	L: 'license',
	m: 'maintainer',
	o: 'origin',
	t: 'buildTime',
	c: 'commit',
	k: 'providerPriority',
	D: 'depends',
	p: 'provides',
	i: 'installIf',
};

export function parseApkIndex(txt: string): ApkIndexPackage[] {
	const out: ApkIndexPackage[] = [];

	const create = (): Partial<ApkIndexPackage> => {
		return { depends: [], provides: [], installIf: [] };
	};

	let build = create();
	for (let line of txt.split('\n')) {
		if (!line) {
			build.pkg && out.push(build as any as ApkIndexPackage);
			build = create();
			continue;
		}
		let k = line.charAt(0);
		let v: any = line.slice(2);
		let f = Alias2Name[k];
		if (!f) {
			throw new Error(`unknown field ${line.charAt(0)} in ${line}`);
		}
		switch (f) {
			case 'size':
			case 'installSize':
			case 'providerPriority':
			case 'buildTime':
				v = parseInt(v, 10);
				break;
			case 'depends':
			case 'provides':
			case 'installIf':
				v = v.split(' ');
				break;
			case 'maintainer': {
				const m = v.match(/^(.*) <(.*)>$/);
				if (m) {
					build.maintainerName = m[1];
					build.maintainerEmail = m[2];
				}
				break;
			}
		}
		build[f] = v;
	}
	if (build.pkg) {
		out.push(build as any as ApkIndexPackage);
	}
	return out;
}
