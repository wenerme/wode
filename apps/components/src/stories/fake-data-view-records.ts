import { en, Faker } from '@faker-js/faker';
import type { DemoRecord } from './console-fixtures';

const fake = new Faker({ locale: [en] });

const resourceTypes: DemoRecord['type'][] = ['PostgreSQL', 'Redis', 'Object Storage', 'Message Queue'];
const resourceStatuses: DemoRecord['status'][] = ['healthy', 'healthy', 'healthy', 'warning', 'offline'];
const regions = [
	'cn-shanghai',
	'cn-beijing',
	'ap-singapore',
	'ap-tokyo',
	'eu-frankfurt',
	'us-west',
	'us-east',
	'au-sydney',
];

export function createFakeDemoRecords(count: number): DemoRecord[] {
	fake.seed(20260711);
	return Array.from({ length: Math.max(0, Math.floor(count)) }, (_, index) => {
		const ordinal = String(index + 1).padStart(4, '0');
		const name = `${fake.word.adjective()}-${fake.word.noun()}-${ordinal}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
		return {
			id: `res-${ordinal}`,
			name,
			type: fake.helpers.arrayElement(resourceTypes),
			status: fake.helpers.arrayElement(resourceStatuses),
			owner: fake.person.fullName(),
			region: fake.helpers.arrayElement(regions),
			updatedAt: formatUpdatedAt(fake.number.int({ min: 1, max: 60 * 24 * 14 })),
		};
	});
}

function formatUpdatedAt(minutes: number): string {
	if (minutes < 60) return `${minutes} 分钟前`;
	if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} 小时前`;
	return `${Math.floor(minutes / (60 * 24))} 天前`;
}
