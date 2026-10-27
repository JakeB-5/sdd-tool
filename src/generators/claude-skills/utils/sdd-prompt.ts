/**
 * sdd-prompt skill definition — output raw prompts for a given workflow step.
 */
import type { SkillDefinition } from '../types.js';

export const sddPromptSkill: SkillDefinition = {
  name: 'sdd-prompt',
  description:
    'Print the raw SDD prompt template for a workflow step (new, plan, tasks, change, apply, archive, impact, validate) with `sdd prompt`. Use when the user wants the prompt text to reuse in another AI tool.',
  argumentHint: '[new|plan|tasks|change|apply|archive|impact|validate] [--list]',
  allowedTools: ['Read', 'Bash(sdd prompt*)'],
  content: `# SDD Prompt

Run the \`sdd prompt\` command with the provided arguments.

\`\`\`bash
sdd prompt $ARGUMENTS
\`\`\`

## Available Prompts

| Prompt | Purpose | Related skill / command |
|--------|---------|-------------------------|
| \`new\` | Write a new feature spec | \`/sdd-spec\` |
| \`plan\` | Write an implementation plan | \`/sdd-plan\` |
| \`tasks\` | Break a plan into tasks | \`/sdd-tasks\` |
| \`change\` | Write a change proposal | \`/sdd-spec\` |
| \`apply\` | Apply an approved change | \`/sdd-spec\` (change lifecycle) |
| \`archive\` | Archive a completed change | \`/sdd-spec\` (change lifecycle) |
| \`impact\` | Analyze change impact | \`/sdd-impact\` |
| \`validate\` | Validate a spec | \`/sdd-validate\` |

## Options

- \`sdd prompt --list\`: List all available prompts

Output the prompt content and explain how to use it.
`,
};
