/**
 * sdd-prompt skill definition — output raw prompts for a given workflow step.
 */
import type { SkillDefinition } from '../types.js';

export const sddPromptSkill: SkillDefinition = {
  name: 'sdd-prompt',
  description: 'Output raw prompts for a given workflow step',
  allowedTools: ['Read'],
  context: 'inline',
  content: `# SDD Prompt

Run the \`sdd prompt\` command with the provided arguments.

\`\`\`bash
sdd prompt $ARGUMENTS
\`\`\`

## Available Prompts

- \`change\`: Write a change proposal
- \`apply\`: Apply a change
- \`archive\`: Archive a change
- \`validate\`: Validate a spec

## Options

- \`--list\`: List all available prompts

Output the prompt content and explain how to use it.
`,
};
