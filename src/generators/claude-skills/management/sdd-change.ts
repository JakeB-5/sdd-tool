/**
 * Skill definition for sdd-change.
 */
import type { SkillDefinition } from '../types.js';

export const sddChangeSkill: SkillDefinition = {
  name: 'sdd-change',
  description: 'Author a change proposal against an existing spec with delta and impact analysis',
  allowedTools: ['Read', 'Write', 'Edit', 'Glob'],
  context: 'inline',
  content: `# SDD Change

## Overview

Author a change proposal against an existing spec.

> **Deprecated**: This skill is superseded by \`/sdd-spec\`.
> \`/sdd-spec\` automatically detects whether the request is new or a modification
> and routes to the appropriate workflow.

## Instructions

1. Ask the user for the **domain name** and **feature name** to change.
2. **First verify that \`.sdd/specs/<domain>/<feature-id>/spec.md\` exists.**
   - **If it does not exist**: Inform the user — "No spec found for this feature. If this is a new feature, use \`/sdd-new\` instead."
   - **If it exists**: Continue with the steps below.
3. Write a change proposal under the \`.sdd/changes/\` directory.
4. Clearly state the change type (ADDED, MODIFIED, REMOVED).

## Change Proposal Structure

\`\`\`markdown
---
id: CHG-001
status: draft
created: YYYY-MM-DD
---

# Change Proposal: [Title]

## Background
Why is this change necessary?

## Impact Scope
### Affected Specs
- \`.sdd/specs/auth/user-auth/spec.md\`

### Change Types
- [x] Modified (MODIFIED)

## Delta

### MODIFIED

#### Before
\`\`\`markdown
Original content
\`\`\`

#### After
\`\`\`markdown
Updated content
\`\`\`
\`\`\`

Once reviewed and approved, apply the delta to the affected specs.
`,
};
