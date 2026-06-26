/**
 * sdd-watch skill definition — watch spec files and auto-validate on change (long-running).
 */
import type { SkillDefinition } from '../types.js';

export const sddWatchSkill: SkillDefinition = {
  name: 'sdd-watch',
  description: 'Watch spec files and auto-validate on change (long-running)',
  allowedTools: ['Bash(sdd watch*)'],
  context: 'manual-invoke-only',
  disableModelInvocation: true,
  content: `# SDD Watch

Run the \`sdd watch\` command with the provided arguments.

\`\`\`bash
sdd watch $ARGUMENTS
\`\`\`

## Options

- \`--path <dir>\`: Directory to watch
- \`--validate\`: Auto-validate on change
- \`--quality\`: Run quality checks on change

Press Ctrl+C to stop watching.
`,
};
