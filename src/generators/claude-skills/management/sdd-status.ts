/**
 * Skill definition for sdd-status.
 */
import type { SkillDefinition } from '../types.js';

export const sddStatusSkill: SkillDefinition = {
  name: 'sdd-status',
  description: 'Summarize current SDD project state — specs, changes, progress, blockers',
  allowedTools: ['Read', 'Glob', 'Bash(sdd status*)'],
  context: 'inline',
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
