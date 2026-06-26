/**
 * sdd-spec skill definition — unified entry point for creating or modifying feature specs.
 */
import type { SkillDefinition } from '../types.js';

export const sddSpecSkill: SkillDefinition = {
  name: 'sdd-spec',
  description: 'Create or modify a feature spec — auto-routes between new-feature and change-proposal flows',
  allowedTools: ['Read', 'Write', 'Edit', 'Glob'],
  context: 'inline',
  content: `# SDD Spec

## Overview

\`/sdd-spec\` automatically determines whether the request is for a new feature (\`/sdd-new\`)
or a modification to an existing feature (\`/sdd-change\`), and routes you to the appropriate workflow.

## Instructions

1. Ask the user for the **domain name** and **feature name**
2. Check whether \`.sdd/specs/<domain>/<feature-id>/spec.md\` already exists
3. **Auto-route based on the result:**

### If no spec exists (new feature) → /sdd-new workflow

\`\`\`bash
sdd new <domain>/<feature-id> --all
\`\`\`

- Creates the \`.sdd/specs/<domain>/<feature-id>/\` directory
- Generates \`spec.md\`, \`plan.md\`, and \`tasks.md\`
- Writes the spec using RFC 2119 keywords and GIVEN-WHEN-THEN scenarios

### If a spec exists (modifying existing) → route by change scope

**Small change** (typo fix, wording update, 1–2 new requirements):
- Edit \`spec.md\` directly
- Validate with \`sdd validate\`

**Large change** (many requirement changes, structural changes, deletions):
- Write a change proposal at \`.sdd/changes/CHG-xxx.md\`
- Follow the review → approve → apply workflow

## Change Scope Reference

| Scope | Examples | Recommended Approach |
|-------|---------|---------------------|
| Small | Typo fix, wording improvement | Edit directly |
| Medium | Add 1–2 requirements | Edit directly |
| Large | Change 3+ requirements | Change proposal |
| Large | Delete existing requirements | Change proposal |
| Large | Restructure scenarios | Change proposal |

## Example Workflow

\`\`\`
User: "Write a login feature spec"

AI: Checking .sdd/specs/...
    → auth/login not found
    → "This is a new feature. Creating spec."
    → Runs: sdd new auth/login --all
    → Guides user through spec.md authoring
\`\`\`

\`\`\`
User: "Add social login to the login feature"

AI: Checking .sdd/specs/...
    → auth/login/spec.md exists
    → "An existing spec was found. Assessing change scope."
    → Adding 1 requirement → "Small change — editing spec directly."
    → Adds REQ-xx to spec.md
\`\`\`

## Next Steps

- After writing a new spec: \`/sdd-plan\` → \`/sdd-tasks\` → \`/sdd-implement\`
- After modifying a spec: \`sdd validate\` → commit
`,
};
