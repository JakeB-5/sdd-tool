/**
 * sdd-impact skill definition — analyze downstream impact of a proposed spec change.
 */
import type { SkillDefinition } from '../types.js';

export const sddImpactSkill: SkillDefinition = {
  name: 'sdd-impact',
  description:
    'Analyze which specs and code files depend on a spec or change proposal, with optional dependency graph and what-if simulation. Use before changing or removing a spec, or when the user asks about blast radius.',
  argumentHint: '<feature> [--graph] [--code] [--json]',
  allowedTools: ['Read', 'Glob', 'Grep', 'Bash(sdd impact*)'],
  context: 'fork',
  content: `# SDD Impact

## Overview

Run impact analysis on a spec change to identify all downstream specs and code files affected by the modification. Use this before committing a change to understand its blast radius.

Dependencies come only from each spec's frontmatter \`depends\` list (\`depends: [pricing/cart]\`).
A spec mentioned in another spec's body (\`pricing/cart\` in backticks, a link) is reported as a
reference, listed separately: it is not a dependency and never creates a cycle or lowers the health score.

---

## Commands

\`\`\`bash
# Analyze impact for a specific spec
sdd impact <feature>

# Show Mermaid dependency graph
sdd impact <feature> --graph

# Include code-level impact analysis
sdd impact <feature> --code

# Output as JSON
sdd impact <feature> --json

# Full project impact report
sdd impact report

# Impact of a specific change proposal
sdd impact change <id>

# What-if simulation: predict the impact of applying a change proposal to a spec
sdd impact simulate <feature> <proposal-id>
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

1. Run \`sdd impact <feature>\` to collect raw dependency data.
2. Parse the output to list directly dependent specs.
3. If \`--code\` is requested, grep for \`@spec <feature>\` annotations in source files.
4. Render a dependency graph when \`--graph\` is provided.
5. Categorize findings by severity: **Breaking**, **Non-breaking**, **Informational**.
6. Propose a change strategy: which specs need updating, which tests need re-running.

---

## Output Format

\`\`\`
=== SDD Impact: <feature> ===

Directly dependent specs: 3
  - pricing/payment  (depends on <feature>)
  - notify/notification  (depends on <feature>)
  - audit/audit-log  (depends on <feature>)

Code files affected: 5
  - src/services/payment.ts  (@spec <feature>)
  - src/services/notification.ts  (@spec <feature>)
  ...

Risk level: HIGH — 3 dependent specs, 5 code files
\`\`\`

---

## Next Steps

After reviewing the impact analysis, update all dependent specs as needed and re-run \`/sdd-sync\` to verify implementation coverage.
`,
};
