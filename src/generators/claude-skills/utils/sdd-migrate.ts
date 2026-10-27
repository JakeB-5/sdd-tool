/**
 * sdd-migrate skill definition — import specs from external tools into the SDD format.
 */
import type { SkillDefinition } from '../types.js';

export const sddMigrateSkill: SkillDefinition = {
  name: 'sdd-migrate',
  description:
    'Migrate existing specs into SDD format: detect OpenSpec or Spec Kit projects, migrate them, or convert Markdown documents with `sdd migrate`. Use when the user wants to bring existing spec documents into SDD.',
  argumentHint: '[detect|openspec|speckit|docs|scan|analyze] [source] [--dry-run]',
  allowedTools: ['Read', 'Write', 'Bash(sdd migrate*)'],
  disableModelInvocation: true,
  content: `# SDD Migrate

Run the \`sdd migrate\` command with the provided arguments.

\`\`\`bash
sdd migrate $ARGUMENTS
\`\`\`

## Subcommands

- \`sdd migrate detect\`: Detect external SDD tools in the project (\`-p, --path <path>\`)
- \`sdd migrate openspec [source]\`: Migrate from OpenSpec (\`--dry-run\`, \`--overwrite\`)
- \`sdd migrate speckit [source]\`: Migrate from Spec Kit (\`--dry-run\`, \`--overwrite\`)
- \`sdd migrate docs <source>\`: Convert Markdown documents to spec.md (\`-o, --output <dir>\`, \`--dry-run\`)
- \`sdd migrate scan [dir]\`: Scan a directory for migratable documents (\`--ext <extensions>\`)
- \`sdd migrate analyze <file>\`: Check a document's SDD compatibility

## Examples

\`\`\`bash
sdd migrate detect
sdd migrate openspec ./openspec --dry-run
sdd migrate docs ./docs/requirements -o .sdd/specs
\`\`\`

After migration completes, review the results and provide guidance on any follow-up steps required.
`,
};
