/**
 * sdd-validate skill definition — validate spec files against RFC 2119 and GIVEN-WHEN-THEN rules.
 */
import type { SkillDefinition } from '../types.js';

export const sddValidateSkill: SkillDefinition = {
  name: 'sdd-validate',
  description:
    'Validate specs with `sdd validate` (RFC 2119 keywords, GIVEN-WHEN-THEN scenarios, frontmatter) and fix reported errors. Use after writing or changing specs, or when the user asks to check spec format.',
  argumentHint: '[path] [--strict]',
  allowedTools: ['Read', 'Glob', 'Bash(sdd validate*)', 'Bash(sdd sync*)'],
  content: `# SDD Validate

## Instructions

Run \`sdd validate\` to validate all specs in the project.

## Validation Checks

Errors (the file fails):
- Unclosed or invalid YAML frontmatter, or invalid metadata types/values (the fields themselves are optional)
- Missing \`# Title\` heading
- No requirement with an uppercase RFC 2119 keyword (SHALL, MUST, SHOULD, MAY, etc.)
- No GIVEN-WHEN-THEN scenario
- Critical constitution violations or a major \`constitution_version\` mismatch

Warnings: missing \`created\` date, leftover template placeholders, lowercase RFC 2119 keywords,
deprecated \`status\` aliases, broken links (\`--check-links\`), minor constitution issues.
Exit code is 2 when a file fails (with \`--strict\`, also on warnings).

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

For a deeper read-only review (RFC 2119 usage, scenario coverage, constitution
compliance) you may delegate to the \`sdd-spec-reviewer\` subagent that SDD setup
generates; it reports issues without editing files.

## Next Steps

Based on validation results:

- **All passing**: Commit and open a PR or merge
- **Errors found**: Fix errors and re-run \`sdd validate\`
- **Warnings only**: Review warnings and decide whether to proceed

For features that are already implemented, also run \`sdd sync\` to confirm every requirement is
referenced by code or tests (\`@spec <domain>/<feature>#REQ-xx\`).

Recommended workflow after validation passes:
1. \`git add .sdd/\` — stage spec changes
2. \`git commit -m "spec: <description>"\` — commit (commit types: see the AGENTS.md SDD block)
3. Open a PR and request review
`,
};
