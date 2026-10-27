/**
 * sdd-spec skill definition — unified entry point for creating or modifying feature specs.
 */
import type { SkillDefinition } from '../types.js';

export const sddSpecSkill: SkillDefinition = {
  name: 'sdd-spec',
  description:
    'Create a new feature spec or modify an existing one, routing large modifications through a change proposal. Use when the user wants to write, add, change, or extend a feature spec or requirements.',
  argumentHint: '<domain>/<feature-id>',
  allowedTools: [
    'Read',
    'Write',
    'Edit',
    'Glob',
    'Bash(sdd new*)',
    'Bash(sdd change*)',
    'Bash(sdd validate*)',
  ],
  content: `# SDD Spec

## Overview

\`/sdd-spec\` determines whether the request is for a new feature or a modification
to an existing feature, and follows the matching workflow.

## Instructions

1. Ask the user for the **domain name** and **feature name** (or use \`$ARGUMENTS\`)
2. Check whether \`.sdd/specs/<domain>/<feature-id>/spec.md\` already exists
3. **Route based on the result:**

### If no spec exists (new feature)

\`\`\`bash
sdd new <domain>/<feature-id> --all
\`\`\`

- Creates the \`.sdd/specs/<domain>/<feature-id>/\` directory
- Generates \`spec.md\`, \`plan.md\`, and \`tasks.md\`
- If no domain is specified, the feature is created under \`common\`
- Write the spec using RFC 2119 keywords and GIVEN-WHEN-THEN scenarios

### If a spec exists (modifying existing) → route by change scope

**Small change** (typo fix, wording update, 1–2 new requirements):
- Edit \`spec.md\` directly
- Validate with \`sdd validate\`

**Large change** (many requirement changes, structural changes, deletions):
- Create a change proposal: \`sdd change -t "<title>" -s <domain>/<feature-id>\`
- This creates \`.sdd/changes/CHG-xxx/proposal.md\` and \`delta.md\`; add \`tasks.md\` in the same directory if the change needs a task list
- Fill in the delta (ADDED / MODIFIED / REMOVED), then follow review → approve → apply:
  - \`sdd change validate <id>\`
  - \`sdd change apply <id>\`
  - \`sdd change archive <id>\`

## Spec Authoring Rules

- Use RFC 2119 keywords: SHALL, MUST, SHOULD, MAY, SHALL NOT
- Every requirement MUST include at least one GIVEN-WHEN-THEN scenario
- Assign a unique ID to each requirement (REQ-001, REQ-002, …)

\`\`\`markdown
### REQ-01: User Authentication

The system SHALL authenticate users using email and password.

### Scenario: Login with valid credentials

- **GIVEN** a registered user exists
- **WHEN** the user submits the correct email and password
- **THEN** an access token SHALL be issued
\`\`\`

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
