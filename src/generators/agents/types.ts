/**
 * Target-neutral subagent definition.
 *
 * One definition is serialized for both Claude Code
 * (`.claude/agents/<name>.md`) and Codex (`.codex/agents/<name>.toml`).
 */

/**
 * What the agent may do. `read-only` agents get read/search/shell tools in
 * Claude Code; `edit` agents also get file editing tools. Codex cannot
 * restrict the sandbox per agent, so the instructions state the limits too.
 */
export type AgentAccess = 'read-only' | 'edit';

export interface AgentDefinition {
  // Agent identifier and file name (kebab-case, `sdd-` prefix avoids built-in names).
  name: string;
  // When to delegate to this agent (used for routing by both tools).
  description: string;
  // Tool access level.
  access: AgentAccess;
  // System prompt (Claude body) / developer_instructions (Codex), in English.
  instructions: string;
}
