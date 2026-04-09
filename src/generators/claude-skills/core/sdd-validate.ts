/**
 * sdd-validate skill definition — validate spec files against RFC 2119 and GIVEN-WHEN-THEN rules.
 */
import type { SkillDefinition } from '../types.js';

export const sddValidateSkill: SkillDefinition = {
  name: 'sdd-validate',
  description: 'Validate spec files against RFC 2119 and GIVEN-WHEN-THEN format rules',
  allowedTools: ['Read', 'Glob', 'Bash(sdd validate*)'],
  context: 'inline',
  content: `# SDD Validate

## Instructions

Run \`sdd validate\` to validate all specs in the project.

## Validation Checks

1. **RFC 2119 keywords**: Presence of SHALL, MUST, SHOULD, MAY, etc.
2. **GIVEN-WHEN-THEN**: Proper scenario format
3. **Metadata**: Required fields in YAML frontmatter
4. **Structure**: Presence of required sections

## Usage

\`\`\`bash
# Validate all specs
sdd validate

# Validate a specific file (domain-based path)
sdd validate .sdd/specs/auth/user-auth/spec.md

# Strict mode (treat warnings as errors)
sdd validate --strict
\`\`\`

## Fixing Errors

When validation fails, open the flagged file and correct the reported errors.
Each error message includes guidance on how to resolve it.

## Next Steps

Based on validation results:

- **All passing**: Commit and open a PR or merge
- **Errors found**: Fix errors and re-run \`sdd validate\`
- **Warnings only**: Review warnings and decide whether to proceed

Recommended workflow after validation passes:
1. \`git add .sdd/\` — stage spec changes
2. \`git commit -m "spec: <description>"\` — commit
3. Open a PR and request review
`,
};
