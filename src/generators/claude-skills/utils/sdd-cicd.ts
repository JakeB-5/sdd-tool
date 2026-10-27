/**
 * sdd-cicd skill definition — set up CI/CD configuration for SDD validation.
 */
import type { SkillDefinition } from '../types.js';

export const sddCicdSkill: SkillDefinition = {
  name: 'sdd-cicd',
  description:
    'Generate CI workflows (GitHub Actions, GitLab CI) and Git hooks that validate specs, or run the CI check, with `sdd cicd`. Use when the user wants spec validation in CI or pre-commit hooks.',
  argumentHint: '[setup [github|gitlab|all] | hooks [type] | check]',
  allowedTools: ['Read', 'Write', 'Bash(sdd cicd*)'],
  disableModelInvocation: true,
  content: `# SDD CI/CD

Run the \`sdd cicd\` command with the provided arguments.

\`\`\`bash
sdd cicd $ARGUMENTS
\`\`\`

## Subcommands

- \`sdd cicd setup [platform]\`: Generate CI workflow files; \`platform\` is \`github\` (default), \`gitlab\`, or \`all\`
- \`sdd cicd hooks [type]\`: Configure Git hooks (\`--install\` also installs husky)
- \`sdd cicd check\`: Run spec validation in CI (\`--strict\`, \`--fail-on-warning\`)

## Examples

\`\`\`bash
sdd cicd setup
sdd cicd setup gitlab
sdd cicd setup all --strict
sdd cicd hooks --install
sdd cicd check --fail-on-warning
\`\`\`

After the CI/CD configuration is generated, review the output and provide guidance on any additional setup required.
`,
};
