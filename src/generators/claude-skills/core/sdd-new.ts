/**
 * sdd-new skill definition — scaffold a new feature spec.
 */
import type { SkillDefinition } from '../types.js';

export const sddNewSkill: SkillDefinition = {
  name: 'sdd-new',
  description: 'Scaffold a new feature spec with RFC 2119 keywords and GIVEN-WHEN-THEN scenarios',
  allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Bash(sdd new*)'],
  context: 'inline',
  content: `# SDD New

> **Deprecated**: This skill has been superseded by \`/sdd-spec\`.
> \`/sdd-spec\` automatically detects whether a feature is new or existing and routes to the correct workflow.

## Instructions

1. Ask the user for the **domain name**, feature name, and a brief description
2. **First check whether \`.sdd/specs/<domain>/<feature-id>/spec.md\` already exists**
   - **If it exists**: Inform the user: "A spec for this feature already exists. Use \`/sdd-change\` to modify it."
   - **If it does not exist**: Continue with the steps below
3. Run \`sdd new <domain>/<feature-id> --all\` to scaffold the directory structure
   - If no domain is specified, the feature is created under the \`common\` folder
4. Open the generated \`.sdd/specs/<domain>/<feature-id>/spec.md\` and write the content

## Directory Structure

\`\`\`
.sdd/specs/
├── auth/                    # Authentication domain
│   ├── login/
│   │   ├── spec.md
│   │   ├── plan.md
│   │   └── tasks.md
│   └── signup/
├── payment/                 # Payment domain
│   └── checkout/
└── common/                  # Default location when no domain is specified
    └── settings/
\`\`\`

## Spec Authoring Rules

- Use RFC 2119 keywords: SHALL, MUST, SHOULD, MAY, SHALL NOT
- Every spec MUST include at least one GIVEN-WHEN-THEN scenario
- Assign a unique ID to each requirement (REQ-001, REQ-002, …)

## Example

\`\`\`markdown
### REQ-01: User Authentication

The system SHALL authenticate users using email and password.

### Scenario: Login with valid credentials

- **GIVEN** a registered user exists
- **WHEN** the user submits the correct email and password
- **THEN** an access token SHALL be issued
\`\`\`

After writing the spec, validate it with \`sdd validate\`.
`,
};
