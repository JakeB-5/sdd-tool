/**
 * Claude Code Skills 2.0 skill definition.
 *
 * See MIGRATION-PLAN-SLASH-COMMANDS-TO-SKILLS.md §3 for the full spec.
 */

// Context execution modes introduced in Skills 2.0.
export type SkillContextMode = 'inline' | 'fork' | 'manual-invoke-only';

// Hook scripts run before/after a skill invocation.
export interface SkillHooks {
  before?: string;
  after?: string;
}

/**
 * Complete skill definition written to `.claude/skills/<name>/SKILL.md`.
 *
 * Required fields (`name`, `description`, `content`) are always emitted;
 * optional fields are omitted from the YAML frontmatter when unset so
 * that default Claude Code behavior applies.
 */
export interface SkillDefinition {
  // Skill identifier and directory name (kebab-case).
  name: string;
  // Short English description used for model routing.
  description: string;
  // SKILL.md body content in English.
  content: string;

  // Allowed tool patterns (supports globs like `Bash(sdd *)`).
  allowedTools?: string[];
  // Context execution mode (default: inline).
  context?: SkillContextMode;
  // Hook scripts to run before/after execution.
  hooks?: SkillHooks;
  // Linked sub-agent name for Skills → sub-agent integration.
  agent?: string;
  // Whether a user can invoke this skill via `/name` (default: true).
  userInvocable?: boolean;
  // Block automatic model invocation (default: false).
  disableModelInvocation?: boolean;
}
