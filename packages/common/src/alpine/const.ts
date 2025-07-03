export const AlpineArchitectures = ['x86', 'x86_64', 'armv7', 'armhf', 'aarch64', 'ppc64le', 's390x'];
export const AlpineRepos = ['main', 'community'];
const EdgeBranches = {
	branches: ['edge'],
	architectures: [...AlpineArchitectures, 'riscv64'],
	channels: ['main', 'community', 'testing'],
};
export const AlpineBranches: Matrix[] = [
	EdgeBranches,
	{
		branches: ['v3.22', 'v3.21', 'v3.20', 'v3.19', 'v3.18', 'v3.17', 'v3.16', 'v3.15', 'v3.14'],
		architectures: AlpineArchitectures,
		channels: ['main', 'community'],
	},
];

type Matrix = {
	branches: string[];
	architectures: string[];
	channels: string[];
};

const LatestBranch = 'v3.22';

export function getLatestAlpineBranch() {
	return LatestBranch;
}

const OfficialMirrorUrl = 'http://dl-cdn.alpinelinux.org/alpine/';

export function getOfficialAlpineMirrorUrl() {
	return OfficialMirrorUrl;
}

export const AlpineChannelType = Object.freeze({
	__proto__: null,
	main: 'main',
	community: 'community',
	testing: 'testing',
});
export type AlpineChannelType = EnumValues<typeof AlpineChannelType>;
type EnumValues<T> = T[Exclude<keyof T, '__proto__'>];
