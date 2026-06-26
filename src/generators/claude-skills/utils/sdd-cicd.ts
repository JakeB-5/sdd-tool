/**
 * sdd-cicd skill definition — set up CI/CD configuration for SDD validation.
 */
import type { SkillDefinition } from '../types.js';

export const sddCicdSkill: SkillDefinition = {
  name: 'sdd-cicd',
  description: 'Set up CI/CD configuration (GitHub Actions, GitLab CI) for SDD validation',
  allowedTools: ['Read', 'Write', 'Bash(sdd cicd*)'],
  context: 'inline',
  disableModelInvocation: true,
  content: `# SDD CI/CD

Run the \`sdd cicd\` command with the provided arguments.

\`\`\`bash
sdd cicd $ARGUMENTS
\`\`\`

## Subcommands

- \`setup\`: Generate CI/CD workflow files
- \`hooks\`: Configure Git hooks
- \`check\`: Run CI validation

## Options

- \`--platform <type>\`: \`github\`, \`gitlab\`, or \`all\`

After the CI/CD configuration is generated, review the output and provide guidance on any additional setup required.
`,
};
