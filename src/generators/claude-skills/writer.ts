/**
 * Serialize a SkillDefinition into a SKILL.md file contents string.
 *
 * Produces YAML frontmatter followed by the skill body. Optional fields
 * are omitted from the frontmatter when unset.
 */
import matter from 'gray-matter';
import type { SkillDefinition } from './types.js';

type SkillFrontmatter = Record<string, unknown>;

/**
 * Build the frontmatter object for a skill, omitting unset optional fields.
 */
function buildFrontmatter(skill: SkillDefinition): SkillFrontmatter {
  const fm: SkillFrontmatter = {
    name: skill.name,
    description: skill.description,
  };

  if (skill.allowedTools && skill.allowedTools.length > 0) {
    fm['allowed-tools'] = skill.allowedTools;
  }
  if (skill.context) {
    fm.context = skill.context;
  }
  if (skill.hooks && (skill.hooks.before || skill.hooks.after)) {
    const hooks: Record<string, string> = {};
    if (skill.hooks.before) hooks.before = skill.hooks.before;
    if (skill.hooks.after) hooks.after = skill.hooks.after;
    fm.hooks = hooks;
  }
  if (skill.agent) {
    fm.agent = skill.agent;
  }
  if (skill.userInvocable === false) {
    fm['user-invocable'] = false;
  }
  if (skill.disableModelInvocation === true) {
    fm['disable-model-invocation'] = true;
  }

  return fm;
}

/**
 * Serialize a SkillDefinition into a SKILL.md string with YAML frontmatter.
 */
export function serializeSkill(skill: SkillDefinition): string {
  const body = skill.content.trim() + '\n';
  return matter.stringify(body, buildFrontmatter(skill));
}
