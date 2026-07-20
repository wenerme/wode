import { z } from 'zod';

export const EmptyInputSchema = z.object({});

export const ListDatasourcesInputSchema = z.object({
	type: z.string().nullish().describe('Optional datasource type filter, e.g. prometheus, loki, tempo'),
	limit: z.number().int().min(1).max(200).default(50).describe('Maximum number of datasources to return'),
	page: z.number().int().min(1).default(1).describe('1-based page number'),
});

export const GetDatasourceInputSchema = z.object({
	uid: z.string().describe('Datasource UID'),
});

export const SearchDashboardsInputSchema = z.object({
	query: z.string().nullish().describe('Dashboard search keyword'),
	limit: z.number().int().min(1).max(200).default(50).describe('Maximum number of dashboards to return'),
	page: z.number().int().min(1).default(1).describe('1-based page number'),
	folderUid: z.string().nullish().describe('Optional folder UID filter'),
});

export const GetDashboardByUidInputSchema = z.object({
	uid: z.string().describe('Dashboard UID'),
});
