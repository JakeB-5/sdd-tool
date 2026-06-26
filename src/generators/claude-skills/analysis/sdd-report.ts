/**
 * sdd-report skill definition — generate a project-level report of specs, progress, and quality metrics.
 */
import type { SkillDefinition } from '../types.js';

export const sddReportSkill: SkillDefinition = {
  name: 'sdd-report',
  description: 'Generate a project-level report of specs, progress, and quality metrics',
  allowedTools: ['Read', 'Glob', 'Grep', 'Bash(sdd report*)'],
  context: 'fork',
  content: `# SDD Report

## Overview

Generate a comprehensive project-level report that aggregates spec status, implementation progress, quality scores, and validation results into a single document.

---

## Commands

\`\`\`bash
# Generate report (HTML by default)
sdd report

# Specify output format
sdd report --format html
sdd report --format markdown
sdd report --format json

# Save to file
sdd report -o ./reports/project-report.html

# Set report title
sdd report --title "Sprint 3 Status Report"

# Exclude quality analysis section
sdd report --no-quality

# Exclude validation results section
sdd report --no-validation
\`\`\`

---

## Options

| Flag | Description |
|------|-------------|
| \`--format <type>\` | Output format: \`html\`, \`markdown\`, \`json\` (default: \`html\`) |
| \`-o, --output <path>\` | Write report to file |
| \`--title <title>\` | Custom report title |
| \`--no-quality\` | Omit quality score analysis |
| \`--no-validation\` | Omit spec validation results |

---

## Report Sections

1. **Project Summary** — total specs, status breakdown, domains covered
2. **Implementation Progress** — sync rate per spec, unimplemented requirements
3. **Quality Scores** — per-spec scores and grade distribution
4. **Validation Results** — constitution violations, schema errors
5. **Recent Activity** — specs changed in the last 30 days
6. **Recommendations** — top 5 actionable improvements

---

## Output Format

\`\`\`
=== SDD Project Report ===
Generated: 2024-01-15  Title: Q1 Progress

Project Summary
  Total specs    : 12
  Approved       : 8
  In review      : 2
  Draft          : 2

Implementation Progress
  Overall sync rate: 78%  (94/120 requirements)
  Fully synced     : 7 specs
  Partially synced : 3 specs
  Not started      : 2 specs

Quality Overview
  Average score: 82/100  [B]
  Grade A: 4 specs
  Grade B: 6 specs
  Grade C: 2 specs

Top Recommendations
  1. user-auth: REQ-010, REQ-013 not yet implemented
  2. payment: quality score 68 — add missing scenarios
  ...
\`\`\`

---

## Next Steps

Share the generated report with stakeholders. For each item under Recommendations, run \`/sdd-quality <specId>\` or \`/sdd-sync <specId>\` to drill into the details and address gaps.
`,
};
