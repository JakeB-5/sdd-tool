/**
 * sdd-reverse skill definition — reverse extraction of spec drafts from existing code.
 */
import type { SkillDefinition } from '../types.js';

export const sddReverseSkill: SkillDefinition = {
  name: 'sdd-reverse',
  description: 'Extract spec drafts from an existing codebase for brownfield SDD onboarding',
  allowedTools: ['Read', 'Glob', 'Grep', 'Bash(sdd reverse*)'],
  context: 'fork',
  content: `# SDD Reverse

## Overview

Analyzes an existing codebase and automatically generates SDD spec drafts through reverse extraction.
Use this workflow when adopting SDD on a brownfield project — one that already has code but no specs.

Drafts go through a review and approval process before being finalized as official specs.

## Instructions

**Always use the CLI commands. Do not write spec files directly.**

- Never hand-author spec files during reverse extraction
- Run \`sdd reverse <subcommand>\` for each stage
- Drafts are stored in \`.sdd/.reverse-drafts/\` — do not edit these files directly
- Specs are only created under \`.sdd/specs/\` after running \`finalize\`

## Subcommands

\`\`\`
/sdd-reverse scan [path]         # Scan project structure (runs CLI)
/sdd-reverse extract [path]      # Extract specs from code (runs CLI)
/sdd-reverse review [spec-id]    # Review extracted drafts (runs CLI)
/sdd-reverse finalize [spec-id]  # Finalize approved specs (runs CLI)
\`\`\`

## Workflow

\`\`\`
scan (+ auto-create domains) → extract → review → finalize
\`\`\`

**Execute each stage in order. Do not skip any stage.**

### 1. Scan (project scan + domain creation)

Run \`sdd reverse scan\` to analyze the project and auto-create domains.

\`\`\`bash
sdd reverse scan                      # Scan and auto-create domains
sdd reverse scan src/                 # Scan a specific path
sdd reverse scan --no-create-domains  # Scan only, skip domain creation
\`\`\`

**What this does:**
- Analyzes project structure (src/, lib/, packages/, etc.)
- Detects language distribution
- Auto-creates domains (appended to \`.sdd/domains.yml\`)
- Saves scan metadata to \`.sdd/.reverse-meta.json\`

**After completion:** "Scan complete. Run \`/sdd-reverse extract\` to extract specs from the code."

### 2. Extract

Run \`sdd reverse extract\` to generate spec drafts from the scanned code.

> Do not write spec files manually. The CLI writes drafts to \`.sdd/.reverse-drafts/\`.

\`\`\`bash
sdd reverse extract                   # Extract all
sdd reverse extract --domain auth     # Extract a specific domain only
sdd reverse extract --depth deep      # Deep analysis
\`\`\`

**What this does:**
- Analyzes code symbols
- Generates spec drafts → \`.sdd/.reverse-drafts/<domain>/<name>.json\`
- Status of each draft: \`pending\` (not yet approved)

**After completion:** "Extraction complete. Run \`/sdd-reverse review\` to review the drafts."

### 3. Review

Run \`sdd reverse review\` to inspect extracted drafts and approve or reject them.

\`\`\`bash
sdd reverse review                        # List drafts pending review
sdd reverse review auth/login             # View a specific draft
sdd reverse review auth/login --approve   # Approve the draft
sdd reverse review auth/login --reject    # Reject the draft
\`\`\`

**What this does:**
- Displays extracted drafts for inspection
- \`--approve\` marks a draft for finalization
- \`--reject\` discards the draft

**After completion:** "Review complete. Run \`/sdd-reverse finalize\` to finalize approved specs."

### 4. Finalize

Run \`sdd reverse finalize\` to write approved drafts as official specs under \`.sdd/specs/\`.

> Spec files under \`.sdd/specs/\` are only created after this step.

\`\`\`bash
sdd reverse finalize --all          # Finalize all approved specs
sdd reverse finalize auth/login     # Finalize a specific spec
sdd reverse finalize -d auth        # Finalize all specs in a domain
\`\`\`

**What this does:**
- Reads approved drafts from \`.sdd/.reverse-drafts/\`
- Creates \`.sdd/specs/<domain>/<feature-id>/spec.md\` (same format as \`/sdd-new\`)
- Removes processed draft files

**Generated spec format** (identical to \`/sdd-new\`):
- YAML frontmatter: id, title, status, domain, depends, ...
- \`## Requirements\` with REQ-IDs and RFC 2119 keywords (SHALL)
- \`## Scenarios\` with GIVEN / WHEN / THEN format
- \`## Non-functional Requirements\`, \`## Constraints\`, \`## Glossary\`

Additional metadata added by reverse extraction:
- \`extracted_from: reverse-extraction\`
- \`confidence: <score>\`
- \`source_files: [list of source files]\`

**After completion:** "Finalization complete. Run \`/sdd-validate\` to validate specs, or \`/sdd-new\` to add new features."

## Output Files

> All files are created by CLI commands. Do not create them manually.

| File | Description | Created by |
|------|-------------|------------|
| \`.sdd/domains.yml\` | Domain config (YAML format, not JSON) | scan |
| \`.sdd/domains/<domain>/domain.md\` | Per-domain documentation | scan |
| \`.sdd/.reverse-meta.json\` | Scan and extraction metadata | scan, extract |
| \`.sdd/.reverse-drafts/\` | Spec draft directory | extract |
| \`.sdd/specs/<feature-id>/spec.md\` | Finalized spec | finalize |

## Next Steps

- After finalizing: run \`/sdd-validate\` to validate specs
- Adjust domains: use \`/sdd-domain\` to rename, add dependencies, etc.
- Add new features: use \`/sdd-new\` to author specs going forward
`,
};
