import typia from 'typia';
import { IVersionFilter } from '../repo.controller';

export const isVersionFilter = typia.createIs<IVersionFilter>();
export const VersionFilterSchema = typia.application<[IVersionFilter], 'ajv'>();
