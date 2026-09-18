import { Activity, CloudCog, Database, FileClock } from 'lucide-react';

export type DemoRecord = {
	id: string;
	name: string;
	type: 'PostgreSQL' | 'Redis' | 'Object Storage' | 'Message Queue';
	status: 'healthy' | 'warning' | 'offline';
	owner: string;
	region: string;
	updatedAt: string;
};

export const demoRecords: DemoRecord[] = [
	{
		id: 'res-001',
		name: 'core-postgres',
		type: 'PostgreSQL',
		status: 'healthy',
		owner: 'Platform',
		region: 'cn-shanghai',
		updatedAt: '2 分钟前',
	},
	{
		id: 'res-002',
		name: 'session-cache',
		type: 'Redis',
		status: 'healthy',
		owner: 'Runtime',
		region: 'cn-shanghai',
		updatedAt: '5 分钟前',
	},
	{
		id: 'res-003',
		name: 'audit-archive',
		type: 'Object Storage',
		status: 'warning',
		owner: 'Security',
		region: 'ap-singapore',
		updatedAt: '18 分钟前',
	},
	{
		id: 'res-004',
		name: 'events-primary',
		type: 'Message Queue',
		status: 'healthy',
		owner: 'Platform',
		region: 'ap-singapore',
		updatedAt: '24 分钟前',
	},
	{
		id: 'res-005',
		name: 'analytics-replica',
		type: 'PostgreSQL',
		status: 'offline',
		owner: 'Data',
		region: 'us-west',
		updatedAt: '1 小时前',
	},
	{
		id: 'res-006',
		name: 'model-artifacts',
		type: 'Object Storage',
		status: 'healthy',
		owner: 'AI',
		region: 'us-west',
		updatedAt: '2 小时前',
	},
];

export const resourceTypeIcons = {
	PostgreSQL: Database,
	Redis: Activity,
	'Object Storage': CloudCog,
	'Message Queue': FileClock,
} as const;
