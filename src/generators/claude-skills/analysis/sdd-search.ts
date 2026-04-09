/**
 * sdd-search skill definition — search across spec files by keyword, metadata, domain, or status.
 */
import type { SkillDefinition } from '../types.js';

export const sddSearchSkill: SkillDefinition = {
  name: 'sdd-search',
  description: 'Search across spec files by keyword, metadata, domain, or status',
  allowedTools: ['Read', 'Glob', 'Grep', 'Bash(sdd search*)'],
  context: 'fork',
  content: `# SDD Search

## Overview

Search all spec files in \`.sdd/specs/\` using keyword queries, metadata filters, or structural criteria. Use this to quickly locate requirements, scenarios, or specs by any attribute.

---

## Commands

\`\`\`bash
# Full-text keyword search
sdd search "authentication"

# Filter by status
sdd search --status draft

# Filter by phase
sdd search --status approved --phase phase1

# Filter by author
sdd search --author alice

# Filter by tags (comma-separated)
sdd search --tags "auth,security"

# Find specs that depend on another spec
sdd search --depends-on user-auth

# Limit results
sdd search "login" --limit 10

# Sort results
sdd search "login" --sort-by updated

# Regex search
sdd search "REQ-0[0-9]{2}" -r

# Case-sensitive search
sdd search "OAuth" -c

# JSON output
sdd search "login" --json
\`\`\`

---

## Options

| Flag | Description |
|------|-------------|
| \`--status <status>\` | Filter by status: \`draft\`, \`review\`, \`approved\` |
| \`--phase <phase>\` | Filter by delivery phase |
| \`--author <name>\` | Filter by spec author |
| \`--tags <tags>\` | Filter by comma-separated tags |
| \`--depends-on <spec>\` | Find specs that reference the given spec |
| \`--limit <n>\` | Cap result count |
| \`--sort-by <field>\` | Sort by: \`relevance\`, \`created\`, \`updated\`, \`title\`, \`status\` |
| \`-r, --regex\` | Treat query as a regular expression |
| \`-c, --case-sensitive\` | Enable case-sensitive matching |
| \`--json\` | Emit structured JSON output |

---

## Output Format

\`\`\`
=== SDD Search: "authentication" ===

Found 4 results:

1. user-auth/spec.md  [approved]
   REQ-001: The system SHALL support email/password authentication
   ...

2. sso/spec.md  [draft]
   REQ-007: The system SHOULD support SSO authentication
   ...
\`\`\`

---

## Next Steps

After locating the relevant spec, open it for review with \`/sdd-quality\` or trace its impact with \`/sdd-impact\`.
`,
};
