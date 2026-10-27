/**
 * Shared SDD subagents generator (Claude Code and Codex).
 *
 * `sdd init` writes each definition to `.claude/agents/<name>.md` and
 * `.codex/agents/<name>.toml`.
 */

export type { AgentDefinition, AgentAccess } from './types.js';
export {
  serializeClaudeAgent,
  serializeCodexAgent,
  claudeAgentTools,
  tomlString,
} from './writer.js';

import type { AgentDefinition } from './types.js';
import { sddSpecReviewerAgent, sddImplementerAgent, sddImpactAnalystAgent } from './definitions.js';

/**
 * Generate the SDD subagents: spec reviewer, implementer, and impact analyst.
 */
export function generateAgents(): AgentDefinition[] {
  return [sddSpecReviewerAgent, sddImplementerAgent, sddImpactAnalystAgent];
}
