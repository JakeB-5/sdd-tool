/**
 * sdd-export skill definition — export specs to HTML, JSON, or consolidated Markdown.
 */
import type { SkillDefinition } from '../types.js';

export const sddExportSkill: SkillDefinition = {
  name: 'sdd-export',
  description:
    'Export one or all specs to styled HTML, JSON, or a consolidated Markdown file with `sdd export`. Use when the user wants to share, publish, or hand off specs outside the repository.',
  argumentHint: '[specId] [--all] [--format html|json|markdown] [-o <path>]',
  allowedTools: ['Read', 'Write', 'Glob', 'Bash(sdd export*)'],
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
| \`markdown\` | Consolidated Markdown (all specs merged, written as \`.md\`) |

PDF is not generated directly: export HTML and use the browser's print dialog.

Optional appendices: \`--include-constitution\` appends \`.sdd/constitution.md\`, \`--include-changes\` appends pending change proposals (all formats).

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

Always an object with a \`specs\` array (even for a single spec); \`constitution\` / \`changes\` appear only when included.

\`\`\`json
{
  "specs": [
    {
      "id": "auth/user-auth",
      "title": "User Authentication",
      "status": "approved",
      "requirements": [
        { "id": "REQ-001", "title": "Login", "keyword": "SHALL", "priority": "high" }
      ],
      "scenarios": [
        { "title": "Successful Login", "given": ["..."], "when": ["..."], "then": ["..."] }
      ]
    }
  ]
}
\`\`\`

---

## Output Format

The CLI prints a short summary: format, number of exported specs, output path and file size.
Failures (unknown spec, unsupported format, missing constitution) exit with a non-zero code.

---

## Next Steps

After exporting, verify the output file opens correctly in a browser or can be parsed by the consuming system. For a PDF, open the exported HTML file and use the browser's print dialog to save as PDF.
`,
};
