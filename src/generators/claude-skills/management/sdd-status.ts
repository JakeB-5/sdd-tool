/**
 * Skill definition for sdd-status.
 */
import type { SkillDefinition } from '../types.js';

export const sddStatusSkill: SkillDefinition = {
  name: 'sdd-status',
  description:
    'Summarize the SDD project state (features and their statuses, change proposals, branch, next steps) using `sdd status` and `sdd list`. Use when the user asks about progress, status, or what to do next.',
  allowedTools: ['Read', 'Glob', 'Bash(sdd status*)', 'Bash(sdd list*)'],
  content: `# SDD Status

## Overview

Summarize the current state of the SDD project.

## Instructions

Run \`sdd status\` to inspect the project state.

## Checklist

- Project structure (presence of \`constitution.md\`, \`AGENTS.md\`)
- Feature list with spec status and task progress (completed/total)
- Current Git branch
- Suggested next steps per feature (plan → tasks → implement → finalize → done)

The stage comes from the feature's files, its spec \`status\`, and the task statuses in \`tasks.md\`.
If it looks stale, the statuses were not updated: \`/sdd-implement\` updates task statuses as it
works and sets the spec to \`implemented\` when the feature is finished.

## Additional Commands

\`\`\`bash
# Per-feature status labels, files, and feature branches
sdd status --verbose

# One domain only
sdd status -d auth

# Project summary
sdd list

# Feature list
sdd list features

# Spec file list
sdd list specs

# JSON output
sdd status --json
\`\`\`
`,
};
