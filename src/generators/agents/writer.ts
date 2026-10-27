/**
 * Serialize a target-neutral AgentDefinition into per-target subagent files.
 *
 * - Claude Code: `.claude/agents/<name>.md` (YAML frontmatter + system prompt body)
 * - Codex: `.codex/agents/<name>.toml` (`name`, `description`, `developer_instructions`)
 */
import matter from 'gray-matter';
import { toCodexInvocations } from '../claude-skills/writer.js';
import type { AgentAccess, AgentDefinition } from './types.js';

const CLAUDE_TOOLS: Record<AgentAccess, string[]> = {
  'read-only': ['Read', 'Grep', 'Glob', 'Bash'],
  edit: ['Read', 'Grep', 'Glob', 'Bash', 'Edit', 'Write'],
};

/**
 * Claude Code tool allowlist for an access level.
 */
export function claudeAgentTools(access: AgentAccess): string[] {
  return [...CLAUDE_TOOLS[access]];
}

/**
 * Serialize an agent into a Claude Code subagent Markdown file.
 */
export function serializeClaudeAgent(agent: AgentDefinition): string {
  return matter.stringify(agent.instructions.trim() + '\n', {
    name: agent.name,
    description: agent.description,
    tools: claudeAgentTools(agent.access).join(', '),
    model: 'inherit',
  });
}

/**
 * Format a TOML basic string escape for one character.
 */
function escapeTomlChar(ch: string): string {
  switch (ch) {
    case '\\':
      return '\\\\';
    case '"':
      return '\\"';
    case '\b':
      return '\\b';
    case '\t':
      return '\\t';
    case '\n':
      return '\\n';
    case '\f':
      return '\\f';
    case '\r':
      return '\\r';
    default:
      return `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase()}`;
  }
}

/**
 * Serialize a single-line TOML basic string (`"..."`).
 */
function tomlBasicString(value: string): string {
  // eslint-disable-next-line no-control-regex
  return `"${value.replace(/[\\"\u0000-\u001F\u007F]/g, escapeTomlChar)}"`;
}

/**
 * Serialize a TOML string value.
 *
 * Single-line values become basic strings. Multi-line values become literal
 * strings (`'''...'''`, no escaping) when safe, otherwise multi-line basic
 * strings (`"""..."""`) with `\` and `"` escaped. Both multi-line forms start
 * on a new line (TOML trims the newline right after the opening delimiter).
 */
export function tomlString(value: string): string {
  if (!value.includes('\n')) {
    return tomlBasicString(value);
  }

  const text = value.endsWith('\n') ? value : `${value}\n`;
  // Literal strings cannot contain `'''` or control characters other than tab/newline.
  // eslint-disable-next-line no-control-regex
  const literalSafe = !text.includes("'''") && !/[\u0000-\u0008\u000B-\u001F\u007F]/.test(text);
  if (literalSafe) {
    return `'''\n${text}'''`;
  }

  // eslint-disable-next-line no-control-regex
  const escaped = text.replace(/[\\"\u0000-\u0008\u000B-\u001F\u007F]/g, escapeTomlChar);
  return `"""\n${escaped}"""`;
}

/**
 * Serialize an agent into a Codex custom agent TOML file.
 *
 * Only the documented string keys are emitted; sandbox, approval, and MCP
 * settings are not overridable per agent and are left to the user's config.
 */
export function serializeCodexAgent(agent: AgentDefinition): string {
  return [
    `name = ${tomlString(agent.name)}`,
    `description = ${tomlString(toCodexInvocations(agent.description))}`,
    `developer_instructions = ${tomlString(toCodexInvocations(agent.instructions.trim()))}`,
    '',
  ].join('\n');
}
