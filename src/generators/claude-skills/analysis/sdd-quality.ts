/**
 * sdd-quality skill definition — compute a quality score for a spec file.
 */
import type { SkillDefinition } from '../types.js';

export const sddQualitySkill: SkillDefinition = {
  name: 'sdd-quality',
  description: 'Compute a quality score for a spec file based on clarity, completeness, and testability',
  allowedTools: ['Read', 'Glob', 'Bash(sdd quality*)'],
  context: 'inline',
  content: `# SDD Quality

## Overview

Evaluate one or more spec files and assign a quality score based on clarity, completeness, and testability. Use the results to identify specs that need improvement before moving to implementation.

---

## Commands

\`\`\`bash
# Score a specific spec
sdd quality <specId>

# Score all specs in the project
sdd quality --all

# Set a minimum acceptable score
sdd quality --all --min-score 80

# Output as JSON
sdd quality <specId> --json
\`\`\`

---

## Options

| Flag | Description |
|------|-------------|
| \`--all\` | Analyze every spec in \`.sdd/specs/\` |
| \`--json\` | Emit structured JSON output |
| \`--min-score <n>\` | Exit non-zero if any spec scores below \`n\` |

---

## Grade Scale

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90–100 | Excellent — ready for implementation |
| B | 80–89 | Good — minor improvements recommended |
| C | 70–79 | Average — notable gaps present |
| D | 60–69 | Poor — significant rework needed |
| F | 0–59 | Failing — spec is incomplete or unclear |

---

## Scoring Dimensions

- **Clarity** — requirements use unambiguous RFC 2119 keywords (SHALL, SHOULD, MAY)
- **Completeness** — all sections present: Overview, Requirements, Scenarios, Acceptance Criteria
- **Testability** — each requirement has at least one GIVEN/WHEN/THEN scenario
- **Traceability** — requirements are uniquely identified (REQ-xxx)
- **Consistency** — no conflicting requirements within the spec

---

## Output Format

\`\`\`
=== SDD Quality: user-auth ===

Score: 85 / 100  [B]

Breakdown:
  Clarity      : 90/100
  Completeness : 80/100
  Testability  : 85/100
  Traceability : 88/100
  Consistency  : 82/100

Suggestions:
  - REQ-003 uses "should" (lowercase) — replace with SHALL or SHOULD
  - Scenario for REQ-007 is missing a THEN clause
\`\`\`

---

## Next Steps

Address all suggestions flagged by the quality check, then re-run \`sdd quality\` to confirm the score meets the project threshold before proceeding to \`/sdd-plan\`.
`,
};
