/**
 * sdd-prepare skill definition — audit required skills and sub-agents before implementation.
 */
import type { SkillDefinition } from '../types.js';

export const sddPrepareSkill: SkillDefinition = {
  name: 'sdd-prepare',
  description:
    "Detect which sub-agents and skills a feature's spec, plan, and tasks need, and generate missing ones with `sdd prepare`. Use after task breakdown and before implementation.",
  argumentHint: '<feature> [--dry-run]',
  allowedTools: ['Read', 'Glob', 'Bash(sdd prepare*)'],
  content: `# SDD Prepare

## Overview

Analyze spec, plan, and task documents to detect the sub-agents and skills
needed for implementation. Missing tools are flagged in the output and in \`prepare.md\`; re-run with \`--auto-approve\` to generate them.
\`sdd prepare\` checks and writes them in the Claude Code layout (\`.claude/agents/\`, \`.claude/skills/\`).

**Codex:** \`sdd prepare\` currently targets only the Claude Code layout above; it does not
check or create Codex files. The Codex equivalents are subagents in \`.codex/agents/<name>.toml\`
(\`name\`, \`description\`, \`developer_instructions\`) and skills in \`.agents/skills/<name>/SKILL.md\`.
When working in Codex, use the detected list as a checklist and create the missing Codex files by hand.

## Instructions

1. Run \`sdd prepare <feature>\`
2. Review the detected tool list and presence status
3. Decide whether to generate any missing tools; if so, re-run with \`--auto-approve\` (a plain run never prompts)

## Workflow

\`\`\`
/sdd-spec → /sdd-plan → /sdd-tasks → sdd prepare → /sdd-implement
\`\`\`

## Commands

\`\`\`bash
# Analyze and write .sdd/specs/<domain>/<feature>/prepare.md (no prompt, no tools created)
sdd prepare user-auth

# Preview only (no files created, no report)
sdd prepare user-auth --dry-run

# Also generate the missing tools
sdd prepare user-auth --auto-approve

# JSON output
sdd prepare user-auth --json
\`\`\`

## Detection Targets

Keywords are matched in the feature's spec, plan, and tasks (English and Korean).
Sub-agents live in \`.claude/agents/*.md\`, skills in \`.claude/skills/<name>/SKILL.md\`.

| Keywords | Sub-agent | Skill |
|----------|-----------|-------|
| test, vitest, jest, unit test | test-runner | test |
| api, rest, endpoint, graphql | api-scaffold | gen-api |
| component, react, vue, ui | component-gen | gen-component |
| db, database, prisma, migration | - | db-migrate |
| doc, readme, jsdoc, documentation | doc-generator | doc |
| type, schema, zod, typescript | - | gen-types |
| lint, eslint, prettier, format | - | lint |
| review, code review | code-reviewer | review |

## Output

The CLI (messages are in Korean) prints the number of tasks analyzed, how many sub-agents and
skills are needed, present, and missing (with a name and description for each missing one), the
path of the \`prepare.md\` report, and, when tools are missing, a hint to re-run with \`--auto-approve\`.

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
