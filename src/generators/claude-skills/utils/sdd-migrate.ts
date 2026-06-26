/**
 * sdd-migrate skill definition — import specs from external tools into the SDD format.
 */
import type { SkillDefinition } from '../types.js';

export const sddMigrateSkill: SkillDefinition = {
  name: 'sdd-migrate',
  description: 'Import specs from external tools (Notion, Jira, etc.) into the SDD format',
  allowedTools: ['Read', 'Write', 'Bash(sdd migrate*)'],
  context: 'inline',
  disableModelInvocation: true,
  content: `# SDD Migrate

Run the \`sdd migrate\` command with the provided arguments.

\`\`\`bash
sdd migrate $ARGUMENTS
\`\`\`

## Subcommands

- \`detect\`: Detect existing tools and formats
- \`openspec\`: Migrate from OpenSpec
- \`speckit\`: Migrate from SpecKit
- \`docs\`: Convert Markdown documents

## Options

- \`--dry-run\`: Preview without writing files
- \`--overwrite\`: Overwrite existing specs
- \`--source <path>\`: Source directory

After migration completes, review the results and provide guidance on any follow-up steps required.
`,
};
