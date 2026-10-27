/**
 * sdd-quality skill definition — compute a quality score for a spec file.
 */
import type { SkillDefinition } from '../types.js';

export const sddQualitySkill: SkillDefinition = {
  name: 'sdd-quality',
  description:
    'Score one or all specs (A–F) on clarity, completeness, and testability with `sdd quality`, and suggest fixes. Use when the user wants to check whether a spec is good enough before planning or implementing.',
  argumentHint: '[specId] [--all] [--min-score <n>] [--json]',
  allowedTools: ['Read', 'Glob', 'Bash(sdd quality*)'],
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

## Scoring Criteria

| Criterion | Points | What earns them |
|-----------|--------|-----------------|
| RFC 2119 keywords | 10 | SHALL, MUST, SHOULD, MAY (and NOT forms) used in the spec |
| GIVEN-WHEN-THEN scenarios | 20 | Complete GIVEN/WHEN/THEN scenarios (at least two) |
| Requirement clarity | 15 | A requirements section and REQ-xx ids (\`### REQ-xx: Title\` headings) |
| Dependencies | 10 | A \`depends\` field in the frontmatter (\`depends: []\` when there are none) |
| Document structure | 15 | Title (H1), requirements section, scenarios, plus overview, constraints, and notes sections |
| Constitution | 10 | A \`constitution_version\` field (full score when the project has no constitution) |
| Links | 10 | Markdown links to related specs or documents |
| Metadata | 10 | \`id\`, \`title\`, \`status\`, plus \`created\` / \`updated\` / \`author\` / \`version\` |

Scenarios count whether they sit in one scenarios section (the layout generated for a new spec) or under
each requirement (\`#### Scenario:\`); keep the layout the spec already uses.
The output lists each criterion's score and concrete suggestions.

---

## Next Steps

Address all suggestions flagged by the quality check, then re-run \`sdd quality\` to confirm the score meets the project threshold before proceeding to \`/sdd-plan\`.
`,
};
