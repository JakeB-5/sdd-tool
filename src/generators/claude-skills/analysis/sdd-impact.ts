/**
 * sdd-impact skill definition — analyze downstream impact of a proposed spec change.
 */
import type { SkillDefinition } from '../types.js';

export const sddImpactSkill: SkillDefinition = {
  name: 'sdd-impact',
  description: 'Analyze downstream impact of a proposed spec change across domains and code',
  allowedTools: ['Read', 'Glob', 'Grep', 'Bash(sdd impact*)'],
  context: 'fork',
  content: `# SDD Impact

## Overview

Run impact analysis on a spec change to identify all downstream specs and code files affected by the modification. Use this before committing a change to understand its blast radius.

---

## Commands

\`\`\`bash
# Analyze impact for a specific spec
sdd impact <specId>

# Show Mermaid dependency graph
sdd impact <specId> --graph

# Include code-level impact analysis
sdd impact <specId> --code

# Output as JSON
sdd impact <specId> --json

# Full project impact report
sdd impact report

# Impact of a specific change proposal
sdd impact change <id>

# What-if simulation: what breaks if this spec is removed?
sdd impact simulate --remove <spec>
\`\`\`

---

## Options

| Flag | Description |
|------|-------------|
| \`--graph\` | Render a Mermaid dependency graph |
| \`--code\` | Extend analysis to source code referencing the spec |
| \`--json\` | Emit structured JSON output |

---

## Workflow

1. Run \`sdd impact <specId>\` to collect raw dependency data.
2. Parse the output to list directly dependent specs.
3. If \`--code\` is requested, grep for \`@spec <specId>\` annotations in source files.
4. Render a dependency graph when \`--graph\` is provided.
5. Categorize findings by severity: **Breaking**, **Non-breaking**, **Informational**.
6. Propose a change strategy: which specs need updating, which tests need re-running.

---

## Output Format

\`\`\`
=== SDD Impact: <specId> ===

Directly dependent specs: 3
  - payment/spec.md  (REQ-005 references <specId>)
  - notification/spec.md  (REQ-012 references <specId>)
  - audit-log/spec.md  (REQ-003 references <specId>)

Code files affected: 5
  - src/services/payment.ts  (@spec <specId>)
  - src/services/notification.ts  (@spec <specId>)
  ...

Risk level: HIGH — 3 dependent specs, 5 code files
\`\`\`

---

## Next Steps

After reviewing the impact analysis, update all dependent specs as needed and re-run \`/sdd-sync\` to verify implementation coverage.
`,
};
