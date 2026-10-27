/**
 * Claude Code Skills 2.0 generator (stable wrapper).
 *
 * This file mirrors the pattern used by ./claude-commands.ts so that CLI
 * commands can import from a single path. The actual implementation lives
 * under ./claude-skills/.
 */

export {
  generateClaudeSkills,
  serializeSkill,
  serializeCodexSkill,
  serializeCodexSkillMetadata,
  toCodexInvocations,
} from './claude-skills/index.js';
export type {
  SkillDefinition,
  SkillContextMode,
  SkillHooks,
} from './claude-skills/index.js';
