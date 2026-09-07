export {
	type Skill,
	type SkillContextRequirement,
	SkillContextRequirementSchema,
	type SkillResource,
	SkillResourceSchema,
	SkillSchema,
	type SkillToolRequirement,
	SkillToolRequirementSchema,
} from './skill.schema';

import type { Skill } from './skill.schema';

export function getSkillIdentity(skill: Pick<Skill, 'id' | 'name' | 'version'>): string {
	return skill.id ? `id:${skill.id}` : `name-version:${JSON.stringify([skill.name, skill.version])}`;
}
