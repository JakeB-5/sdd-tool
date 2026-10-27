/**
 * Target-neutral skill definition.
 *
 * One definition is serialized for both Claude Code (`.claude/skills/`) and
 * Codex (`.agents/skills/`). `name`, `description`, and `content` are shared;
 * the remaining fields mirror the Claude Code SKILL.md frontmatter
 * (https://code.claude.com/docs/en/skills) and are Claude-only metadata,
 * except `disableModelInvocation`, which also maps to the Codex
 * `policy.allow_implicit_invocation: false` setting.
 *
 * Bodies reference other skills with Claude notation (`/sdd-x`); the Codex
 * serializer rewrites them to `$sdd-x`.
 */

// Execution context. `fork` runs the skill in an isolated sub-agent;
// omit the field for the default (inline) behavior.
export type SkillContextMode = 'fork';

// Hook scripts run before/after a skill invocation.
export interface SkillHooks {
  before?: string;
  after?: string;
}

/**
 * Complete skill definition written to `.claude/skills/<name>/SKILL.md`
 * and `.agents/skills/<name>/SKILL.md`.
 *
 * Required fields (`name`, `description`, `content`) are always emitted;
 * optional fields are omitted from the YAML frontmatter when unset so
 * that default Claude Code behavior applies.
 */
export interface SkillDefinition {
  // Skill identifier and directory name (kebab-case).
  name: string;
  // What the skill does and when to use it (used for model routing).
  description: string;
  // SKILL.md body content in English.
  content: string;

  // Autocomplete hint for arguments shown after `/name`.
  argumentHint?: string;
  // Allowed tool rules (e.g. `Bash(sdd validate*)`), one rule per entry.
  allowedTools?: string[];
  // Execution context (omit for inline).
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
