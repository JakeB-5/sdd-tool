/**
 * sdd-prepare skill definition — audit required skills and sub-agents before implementation.
 */
import type { SkillDefinition } from '../types.js';

export const sddPrepareSkill: SkillDefinition = {
  name: 'sdd-prepare',
  description: 'Audit required skills and sub-agents for a feature before implementation',
  allowedTools: ['Read', 'Glob', 'Bash(sdd prepare*)'],
  context: 'inline',
  content: `# SDD Prepare

## Overview

Analyze spec, plan, and task documents to detect the Claude Code sub-agents and skills
needed for implementation. Any missing tools are flagged, with an option to generate them automatically.

## Instructions

1. Run \`sdd prepare <feature-id>\`
2. Review the detected tool list and presence status
3. Decide whether to generate any missing tools

## Workflow

\`\`\`
/sdd-new → /sdd-plan → /sdd-tasks → sdd prepare → /sdd-implement
\`\`\`

## Commands

\`\`\`bash
# Interactive (default)
sdd prepare user-auth

# Preview only (no files created)
sdd prepare user-auth --dry-run

# Auto-approve (generate missing tools without prompting)
sdd prepare user-auth --auto-approve

# JSON output
sdd prepare user-auth --json
\`\`\`

## Detection Targets

### Sub-agents (\`.claude/agents/*.md\`)

| Agent | Detection Keywords | Description |
|-------|-------------------|-------------|
| test-runner | test, jest, vitest | Run tests |
| api-scaffold | api, rest, endpoint | Scaffold APIs |
| component-gen | component, react | Generate components |
| code-reviewer | review | Code review |

### Skills (\`.claude/skills/<name>/SKILL.md\`)

| Skill | Detection Keywords | Description |
|-------|-------------------|-------------|
| test | test | Write tests |
| gen-api | api, rest | Generate API |
| gen-component | component | Generate component |
| db-migrate | database, migration | DB migration |
| gen-doc | doc | Generate docs |

## Example Output

\`\`\`
=== SDD Prepare: user-auth ===

Analyzed: 3 documents, 5 tasks

--- Sub-agents ---
  [x] test-runner (present)
  [ ] api-scaffold (missing) → needs to be created

--- Skills ---
  [x] test (present)
  [ ] gen-api (missing) → needs to be created

Generate missing tools? (y/n)
\`\`\`

## Generated File Structure

\`\`\`
.claude/
├── agents/
│   └── api-scaffold.md     # Agent definition
└── skills/
    └── gen-api/
        └── SKILL.md        # Skill definition
\`\`\`

After completing preparation, start implementation with \`/sdd-implement\`.
`,
};
