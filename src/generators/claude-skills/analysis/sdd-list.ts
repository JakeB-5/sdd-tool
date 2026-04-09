/**
 * sdd-list skill definition — list specs with filtering by domain, status, or priority.
 */
import type { SkillDefinition } from '../types.js';

export const sddListSkill: SkillDefinition = {
  name: 'sdd-list',
  description: 'List specs with filtering by domain, status, or priority',
  allowedTools: ['Read', 'Glob', 'Bash(sdd list*)'],
  context: 'inline',
  content: `# SDD List

## Overview

Display a summary of all SDD items in the project. Use sub-commands to narrow the listing to features, change proposals, spec files, or templates.

---

## Commands

\`\`\`bash
# Project summary (default)
sdd list

# List features
sdd list features

# Shorthand aliases
sdd list f    # features
sdd list c    # changes
sdd list s    # specs
sdd list t    # templates
\`\`\`

---

## Sub-commands

| Sub-command | Alias | Description |
|-------------|-------|-------------|
| *(none)*    | —     | Project-level summary |
| \`features\` | \`f\` | All feature specs |
| \`changes\`  | \`c\` | All change proposals |
| \`specs\`    | \`s\` | All spec files |
| \`templates\`| \`t\` | Available spec templates |

---

## Options

| Flag | Description |
|------|-------------|
| \`--status <status>\` | Filter features by status (e.g., \`draft\`, \`approved\`) |
| \`--pending\` | Show only pending change proposals |
| \`--archived\` | Show only archived change proposals |

---

## Output Format

\`\`\`
=== SDD List ===

Project: my-app
Specs   : 12  (approved: 8, draft: 3, review: 1)
Features: 8
Changes : 4   (pending: 2, archived: 2)

Recent activity:
  2024-01-15  user-auth/spec.md        [approved]
  2024-01-14  payment/spec.md          [review]
  2024-01-12  notification/spec.md     [draft]
\`\`\`

---

## Next Steps

After reviewing the list, use \`/sdd-search\` to locate a specific spec, or \`/sdd-quality --all\` to assess overall spec health.
`,
};
