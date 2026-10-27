/**
 * sdd-guide skill definition — SDD methodology guide and command reference.
 */
import type { SkillDefinition } from '../types.js';

export const sddGuideSkill: SkillDefinition = {
  name: 'sdd-guide',
  description:
    'Explain the Spec-Driven Development methodology, the end-to-end workflow, and the available SDD skills and CLI commands. Use when the user asks how SDD works or which skill or command to use.',
  // Explanatory skill: only read-only CLI calls are pre-approved.
  allowedTools: [
    'Read',
    'Bash(sdd --help)',
    'Bash(sdd * --help)',
    'Bash(sdd status*)',
    'Bash(sdd list*)',
    'Bash(sdd validate*)',
  ],
  disableModelInvocation: true,
  content: `# SDD Guide

## Overview

This guide covers the complete workflow for Spec-Driven Development (SDD).
Refer to it when starting out or when you need a refresher on the workflow.

## Core Principles

1. **Spec first**: Write the spec before writing code
2. **Traceability**: Every implementation traces back to a spec
3. **Progressive refinement**: Overview → Detail → Implementation
4. **Change management**: Every change follows Propose → Review → Apply

## Full Workflow

\`\`\`
┌─────────────────────────────────────────────────┐
│                  SDD Workflow                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Start ──────> /sdd-start or sdd start       │
│     │                                           │
│     ▼                                           │
│  2. Constitution ─> /sdd-constitution           │
│     │               (define project principles) │
│     ▼                                           │
│  3. Spec ─────────> /sdd-spec                   │
│     │               (write spec.md)             │
│     ▼                                           │
│  4. Plan ─────────> /sdd-plan                   │
│     │               (write plan.md)             │
│     ▼                                           │
│  5. Tasks ────────> /sdd-tasks                  │
│     │               (write tasks.md)            │
│     ▼                                           │
│  6. Implement ────> /sdd-implement              │
│     │               (sequential implementation) │
│     ▼                                           │
│  7. Validate ─────> /sdd-validate               │
│     │                                           │
│     ▼                                           │
│  8. Done ─────────> merge or deploy             │
│                                                 │
└─────────────────────────────────────────────────┘
\`\`\`

## Change Workflow

When modifying an existing spec:

\`\`\`
1. /sdd-spec (large change) ──> proposal.md + delta.md
       │
       ▼
2. sdd change validate <id> ──> validate
       │
       ▼
3. sdd change apply <id> ──> apply
       │
       ▼
4. sdd change archive <id> ──> archive
\`\`\`

## Slash Command Summary

| Command | Description | When to Use |
|---------|-------------|-------------|
| /sdd-start | Unified entry point | First time starting |
| /sdd-spec | Create or modify a spec | New feature or spec change |
| /sdd-plan | Implementation plan | After spec is complete |
| /sdd-tasks | Task breakdown | After plan is complete |
| /sdd-implement | Implementation | After task breakdown |
| /sdd-validate | Validation | After implementation |
| /sdd-constitution | Constitution management | Project setup |
| /sdd-chat | Conversational mode | Anytime |
| /sdd-analyze | Request analysis | Estimating scope |

## CLI Command Summary

\`\`\`bash
sdd init                    # Initialize project
sdd start                   # Start workflow
sdd new <name>              # Create new feature
sdd new <name> --numbered   # Auto-assign number
sdd validate                # Validate specs
sdd validate --check-links  # Include link validation
sdd status                  # Check status
sdd list                    # List specs
sdd change -l               # List changes
sdd impact <spec>           # Analyze impact
sdd transition guide        # Show transition guide
\`\`\`

## Help

For more information:
- \`sdd --help\` — CLI help
- \`sdd <command> --help\` — Command-specific help
`,
};
