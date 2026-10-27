/**
 * sdd-watch skill definition — watch spec files and auto-validate on change (long-running).
 */
import type { SkillDefinition } from '../types.js';

export const sddWatchSkill: SkillDefinition = {
  name: 'sdd-watch',
  description:
    'Run `sdd watch` to watch .sdd/specs and re-validate (optionally with impact analysis) on every change; long-running. Use when the user explicitly asks to start watch mode.',
  argumentHint: '[--no-validate] [--impact] [--quiet] [--debounce <ms>]',
  allowedTools: ['Bash(sdd watch*)'],
  disableModelInvocation: true,
  content: `# SDD Watch

Run the \`sdd watch\` command with the provided arguments.

\`\`\`bash
sdd watch $ARGUMENTS
\`\`\`

## Options

- \`--no-validate\`: Disable automatic validation on change
- \`--impact\`: Include impact analysis on change
- \`-q, --quiet\`: Suppress output on success
- \`--debounce <ms>\`: Debounce interval in milliseconds (default: 500)

## Examples

\`\`\`bash
sdd watch
sdd watch --impact
sdd watch --quiet --debounce 1000
\`\`\`

Press Ctrl+C to stop watching.
`,
};
