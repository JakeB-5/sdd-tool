/**
 * sdd-analyze skill definition — analyze a user request and recommend an SDD workflow.
 */
import type { SkillDefinition } from '../types.js';

export const sddAnalyzeSkill: SkillDefinition = {
  name: 'sdd-analyze',
  description: 'Analyze a user request and estimate its implementation scope and affected domains',
  allowedTools: ['Read', 'Glob', 'Grep'],
  context: 'fork',
  content: `# SDD Analyze

## Overview

Analyze a natural-language request to estimate the size of work, identify which SDD domains are affected, and recommend the appropriate workflow.

---

## Scope Classification

### Small
- Keywords: fix, typo, rename, minor change, simple addition
- Workflow: direct edit or \`/sdd-change\`

### Medium
- Keywords: add feature, improve, extend, refactor
- Workflow: \`/sdd-new\` → \`/sdd-plan\` → \`/sdd-tasks\`

### Large
- Keywords: system, architecture, migration, full overhaul, redesign
- Workflow: \`/sdd-research\` → \`/sdd-new\` → \`/sdd-plan\` → \`/sdd-tasks\` → \`/sdd-prepare\`

---

## Workflow Selection Matrix

| Scope  | Recommended Workflow                      | Required Artifacts              |
|--------|-------------------------------------------|---------------------------------|
| Small  | \`/sdd-change\`                             | proposal.md                     |
| Medium | \`/sdd-new\` → \`/sdd-plan\`                  | spec.md, plan.md                |
| Large  | \`/sdd-research\` → \`/sdd-new\` → \`/sdd-plan\` | research.md, spec.md, plan.md   |

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
- Recommendation: \`/sdd-new\` → \`/sdd-plan\` → \`/sdd-tasks\` → \`/sdd-implement\`

**Input:** "Change the login button color"
**Analysis:**
- Keyword: "change" → Small scope
- Recommendation: direct edit or \`/sdd-change\`

**Input:** "Migrate to a microservices architecture"
**Analysis:**
- Keywords: "architecture", "migrate" → Large scope
- Recommendation: \`/sdd-research\` → \`/sdd-new\` → \`/sdd-plan\`

---

## Next Steps

After classifying scope, present the recommended workflow to the user and ask for confirmation before proceeding.
`,
};
