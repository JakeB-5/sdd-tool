/**
 * Serialize a target-neutral SkillDefinition into per-target skill files.
 *
 * - Claude Code: `.claude/skills/<name>/SKILL.md` with the full Claude
 *   frontmatter (`serializeSkill`).
 * - Codex: `.agents/skills/<name>/SKILL.md` with only `name` and
 *   `description` (`serializeCodexSkill`), plus an optional
 *   `agents/openai.yaml` policy file (`serializeCodexSkillMetadata`).
 *
 * Definitions reference other skills with Claude notation (`/sdd-x`);
 * the Codex serializer rewrites those references to `$sdd-x` and replaces
 * Claude's `$ARGUMENTS` substitution with placeholder wording.
 */
import matter from 'gray-matter';
import { stringify as stringifyYaml } from 'yaml';
import type { SkillDefinition } from './types.js';

type SkillFrontmatter = Record<string, unknown>;

/**
 * A `/sdd-x` skill reference that is not part of a path or URL
 * (e.g. `.claude/skills/sdd-x`, `~/sdd-x`, `C:/sdd-x` or `https://host/sdd-x` are left alone).
 */
export const CLAUDE_SKILL_REF = /(?<![\w./$~:-])\/(sdd-[a-z][a-z0-9-]*[a-z0-9])/g;

/**
 * Rewrite Claude skill invocations (`/sdd-x`) to Codex invocations (`$sdd-x`).
 *
 * Both notations have the same length, so ASCII diagrams keep their alignment.
 */
export function toCodexInvocations(text: string): string {
  return text.replace(CLAUDE_SKILL_REF, '$$$1');
}

/**
 * Replace Claude Code's `$ARGUMENTS` substitution, which Codex does not
 * expand (and which would read like a `$skill` reference), with wording
 * that reads as a placeholder.
 */
export function toCodexArguments(text: string): string {
  return text
    .replace(/`\$ARGUMENTS`/g, 'the arguments the user gave')
    .replace(/\$ARGUMENTS\b/g, '<user-arguments>');
}

/**
 * Build the frontmatter object for a skill, omitting unset optional fields.
 */
function buildFrontmatter(skill: SkillDefinition): SkillFrontmatter {
  const fm: SkillFrontmatter = {
    name: skill.name,
    description: skill.description,
  };

  if (skill.argumentHint) {
    fm['argument-hint'] = skill.argumentHint;
  }
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
 * Serialize a SkillDefinition into a Claude Code SKILL.md string with YAML frontmatter.
 */
export function serializeSkill(skill: SkillDefinition): string {
  const body = skill.content.trim() + '\n';
  return matter.stringify(body, buildFrontmatter(skill));
}

/**
 * Serialize a SkillDefinition into a Codex SKILL.md string.
 *
 * Codex (agentskills.io) frontmatter only documents `name` and `description`;
 * Claude-only metadata (allowed-tools, context, argument-hint, ...) is dropped.
 */
export function serializeCodexSkill(skill: SkillDefinition): string {
  const body = toCodexArguments(toCodexInvocations(skill.content.trim())) + '\n';
  return matter.stringify(body, {
    name: skill.name,
    description: toCodexInvocations(skill.description),
  });
}

/**
 * Human-readable display name derived from a skill name (`sdd-data-model` → `SDD Data Model`).
 */
function displayName(name: string): string {
  return name
    .split('-')
    .map((part) => (part === 'sdd' ? 'SDD' : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');
}

/**
 * Serialize the optional Codex `agents/openai.yaml` for a skill.
 *
 * Only manual-only skills (`disableModelInvocation`) need one: it turns off
 * implicit invocation so Codex runs them only on an explicit `$skill`.
 * Returns null when the skill needs no metadata file.
 */
export function serializeCodexSkillMetadata(skill: SkillDefinition): string | null {
  if (skill.disableModelInvocation !== true) {
    return null;
  }
  return stringifyYaml({
    interface: { display_name: displayName(skill.name) },
    policy: { allow_implicit_invocation: false },
  });
}
