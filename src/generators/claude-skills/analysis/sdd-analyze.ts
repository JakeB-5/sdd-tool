/**
 * sdd-analyze skill definition — analyze a user request and recommend an SDD workflow.
 */
import type { SkillDefinition } from '../types.js';

export const sddAnalyzeSkill: SkillDefinition = {
  name: 'sdd-analyze',
  description:
    'Classify a feature request as small, medium, or large, find affected domains in .sdd/specs, and recommend the SDD workflow to follow. Use when the user describes new work and asks how big it is or how to approach it.',
  argumentHint: '<request>',
  allowedTools: ['Read', 'Glob', 'Grep'],
  context: 'fork',
  content: `# SDD Analyze

## Overview

Analyze a natural-language request to estimate the size of work, identify which SDD domains are affected, and recommend the appropriate workflow.

---

## Scope Classification

### Small
- Keywords: fix, typo, rename, minor change, simple addition
- Workflow: \`/sdd-spec\` (direct edit of the existing spec)

### Medium
- Keywords: add feature, improve, extend, refactor
- Workflow: \`/sdd-spec\` → \`/sdd-plan\` → \`/sdd-tasks\`

### Large
- Keywords: system, architecture, migration, full overhaul, redesign
- Workflow: \`/sdd-research\` → \`/sdd-spec\` → \`/sdd-plan\` → \`/sdd-tasks\` → \`/sdd-prepare\`

---

## Workflow Selection Matrix

| Scope  | Recommended Workflow                      | Required Artifacts              |
|--------|-------------------------------------------|---------------------------------|
| Small  | \`/sdd-spec\` (edit existing spec)          | spec.md                         |
| Medium | \`/sdd-spec\` → \`/sdd-plan\`                 | spec.md, plan.md                |
| Large  | \`/sdd-research\` → \`/sdd-spec\` → \`/sdd-plan\` | research.md, spec.md, plan.md |

---

## Instructions

1. Read the user's request carefully.
2. Extract keywords and surrounding context.
3. Classify the scope (Small / Medium / Large).
4. Identify affected domains by scanning \`.sdd/specs/\` for related spec files.
5. Recommend the appropriate workflow with a brief rationale.

---

## Examples

**Input:** "Add a login feature"
**Analysis:**
- Keyword: "add feature" → Medium scope
- Affected domain: authentication
- Recommendation: \`/sdd-spec\` → \`/sdd-plan\` → \`/sdd-tasks\` → \`/sdd-implement\`

**Input:** "Change the login button color"
**Analysis:**
- Keyword: "change" → Small scope
- Recommendation: direct edit via \`/sdd-spec\`

**Input:** "Migrate to a microservices architecture"
**Analysis:**
- Keywords: "architecture", "migrate" → Large scope
- Recommendation: \`/sdd-research\` → \`/sdd-spec\` → \`/sdd-plan\`

---

## Next Steps

After classifying scope, present the recommended workflow to the user and ask for confirmation before proceeding.
`,
};
