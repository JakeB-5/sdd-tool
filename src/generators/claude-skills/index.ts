/**
 * Claude Code Skills 2.0 generator.
 *
 * Mirrors the Korean slash command generators under ../claude-commands as
 * English Skill definitions. See MIGRATION-PLAN-SLASH-COMMANDS-TO-SKILLS.md
 * for the overall migration strategy.
 *
 * - Skill definitions live under `./core`, `./management`, `./analysis`,
 *   `./domain`, and `./utils` (added in Phase 2).
 * - Each definition is a `SkillDefinition` with an English body.
 * - `generateClaudeSkills()` returns all 28 skills for `sdd init` to write.
 */

export type {
  SkillDefinition,
  SkillContextMode,
  SkillHooks,
} from './types.js';
export { serializeSkill } from './writer.js';

import type { SkillDefinition } from './types.js';

/**
 * Generate the full set of Claude Code Skills for the SDD workflow.
 *
 * Phase 1 returns an empty array. Phase 2 populates it with 28 skill
 * definitions spanning core, management, analysis, domain, and utils
 * categories.
 */
export function generateClaudeSkills(): SkillDefinition[] {
  return [];
}
