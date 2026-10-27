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
- Feature list and their statuses
- Current Git branch
- Suggested next steps

## Additional Commands

\`\`\`bash
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
