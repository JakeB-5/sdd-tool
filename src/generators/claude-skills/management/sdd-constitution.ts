/**
 * Skill definition for sdd-constitution.
 */
import type { SkillDefinition } from '../types.js';

export const sddConstitutionSkill: SkillDefinition = {
  name: 'sdd-constitution',
  description: 'Create or edit the project constitution — core principles, technical standards, forbidden practices',
  allowedTools: ['Read', 'Write', 'Edit'],
  context: 'inline',
  content: `# SDD Constitution

## Overview

The constitution defines the core principles of a project.
Every spec and implementation must comply with the principles declared here.

## Instructions

### Setting up a new project

1. Ask the user about the project's core values and principles.
2. Open \`.sdd/constitution.md\` and write the content.
3. Validate the format with \`sdd constitution validate\`.

### Editing an existing constitution

1. Review the current content with \`sdd constitution show\`.
2. After editing, bump the version to reflect the scope of change:
   - \`sdd constitution bump --patch -m "Fix wording"\`
   - \`sdd constitution bump --minor -m "Add new principle"\`
   - \`sdd constitution bump --major -m "Change core principle"\`

## Constitution Structure

\`\`\`markdown
---
version: 1.0.0
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Constitution: <Project Name>

> Project description

## Core Principles

### 1. <Principle Name>
- Rule (SHALL/MUST/SHOULD/MAY)

## Forbidden Practices
- Prohibition (SHALL NOT/MUST NOT)

## Tech Stack
- Technology choices

## Quality Standards
- Quality requirements
\`\`\`

## Versioning

- **MAJOR**: Core principle changes (affects existing specs)
- **MINOR**: New principle added
- **PATCH**: Wording fixes, typo corrections

## Commands

\`\`\`bash
sdd constitution show      # Display current constitution
sdd constitution version   # Show version only
sdd constitution validate  # Validate format
sdd constitution history   # View change history
sdd constitution bump      # Bump version
\`\`\`
`,
};
