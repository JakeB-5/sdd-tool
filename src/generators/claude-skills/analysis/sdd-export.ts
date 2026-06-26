/**
 * sdd-export skill definition — export specs to HTML, JSON, or consolidated Markdown.
 */
import type { SkillDefinition } from '../types.js';

export const sddExportSkill: SkillDefinition = {
  name: 'sdd-export',
  description: 'Export specs to HTML, JSON, or consolidated Markdown with theme support',
  allowedTools: ['Read', 'Write', 'Glob', 'Bash(sdd export*)'],
  context: 'inline',
  content: `# SDD Export

## Overview

Convert spec files into shareable formats — HTML (with styling), JSON (structured data), or consolidated Markdown — for distribution to team members and stakeholders.

---

## Commands

\`\`\`bash
# Export a single spec to HTML
sdd export user-auth --format html

# Export all specs to HTML
sdd export --all --format html

# Export a single spec to JSON
sdd export user-auth --format json

# Consolidate all specs into one Markdown file
sdd export --all --format markdown

# Specify output path
sdd export user-auth -o ./docs/user-auth.html

# Use dark theme
sdd export --all --theme dark

# Omit table of contents
sdd export user-auth --no-toc
\`\`\`

---

## Supported Formats

| Format | Description |
|--------|-------------|
| \`html\` | Styled HTML document (default) |
| \`json\` | Structured JSON with full spec data |
| \`markdown\` | Consolidated Markdown (all specs merged) |
| \`pdf\` | Generates HTML then prompts browser print-to-PDF |

---

## HTML Features

- Responsive layout
- Auto-generated table of contents
- RFC 2119 keyword highlighting (SHALL, SHOULD, MAY)
- GIVEN/WHEN/THEN scenario visualization
- Light and dark theme support
- Print-optimized CSS

---

## JSON Structure

\`\`\`json
{
  "id": "user-auth",
  "title": "User Authentication",
  "status": "approved",
  "requirements": [
    {
      "id": "REQ-001",
      "title": "Login",
      "keyword": "SHALL",
      "priority": "high"
    }
  ],
  "scenarios": [
    {
      "title": "Successful Login",
      "given": "...",
      "when": "...",
      "then": "..."
    }
  ]
}
\`\`\`

---

## Output Format

\`\`\`
=== SDD Export ===

Format : HTML
Specs  : 3
Output : ./specs.html
Size   : 45.32 KB
\`\`\`

---

## Next Steps

After exporting, verify the output file opens correctly in a browser or can be parsed by the consuming system. For PDF output, open the HTML file and use the browser's print dialog to save as PDF.
`,
};
