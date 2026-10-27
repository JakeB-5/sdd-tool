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
    'Bash(sdd sync*)',
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

- Creates \`.sdd/specs/<domain>/<feature-id>/\` with \`spec.md\`, \`plan.md\`, \`tasks.md\`, and \`checklist.md\`
- A missing domain is created automatically (a notice is printed); without a domain the feature goes under \`common\`
- By default \`sdd new\` also creates and switches to a \`feature/<feature-id>\` git branch from the current one.
  Add \`--no-branch\` when you are already on a working branch (e.g. several features in one branch),
  otherwise each new feature branches off the previous feature's branch
- Existing files are never overwritten (exit code 1); use \`--force\` only to regenerate them from scratch
- Fill in the generated \`spec.md\` using RFC 2119 keywords and GIVEN-WHEN-THEN scenarios
- The spec starts as \`status: draft\`; change it with \`sdd new status <domain>/<feature-id> <status>\`
  (draft, review, approved, planned, tasked, implementing, implemented, deprecated) instead of editing the frontmatter

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
- Every requirement MUST be covered by at least one GIVEN-WHEN-THEN scenario
- Define each requirement with a heading \`### REQ-01: Title\` under the requirements section.
  Only definition headings count as requirements (\`sdd sync\`); REQ IDs in prose, tables, or lists are references
- Number requirements uniquely within the spec (REQ-01, REQ-02, …). IDs restart in every spec, so when you
  mention another spec's requirement write it qualified: \`<domain>/<feature>#REQ-xx\`
- Keep the structure \`sdd new\` generates: a requirements section with \`### REQ-xx\` headings, then a
  scenarios section whose scenarios name the requirement they cover
  (a \`#### Scenario:\` directly under each requirement is also accepted)

\`\`\`markdown
## Requirements

### REQ-01: User Authentication

The system SHALL authenticate users using email and password.

## Scenarios

### Scenario 1: Login with valid credentials (REQ-01)

- **GIVEN** a registered user exists
- **WHEN** the user submits the correct email and password
- **THEN** an access token SHALL be issued
\`\`\`

## Traceability

Code and tests reference requirements with the qualified form \`@spec <domain>/<feature>#REQ-xx\`
(in a comment, or in the test title). A bare \`REQ-xx\` counts only while a single spec has that ID;
once another spec defines it too, the reference is ambiguous and ignored. \`/sdd-implement\` adds these
references, and \`sdd sync\` reports which requirements are covered.

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
