/**
 * sdd-reverse skill definition — AI-driven extraction of spec drafts from existing code.
 */
import type { SkillDefinition } from '../types.js';

export const sddReverseSkill: SkillDefinition = {
  name: 'sdd-reverse',
  description:
    'Draft specs from an existing codebase for brownfield onboarding. Use when a project has code but no specs, or when the user asks to document the current behaviour of existing modules as SDD specs.',
  argumentHint: '[scan|review|finalize] [args]',
  allowedTools: ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'Bash(sdd reverse *)', 'Bash(sdd validate *)'],
  content: `# SDD Reverse

## Overview

Turns existing code into SDD spec drafts. The CLI handles the deterministic parts
(structure scan, draft validation, review state, finalization); **you** read the code and
write the drafts. Drafts only become official specs after the user approves them.

\`\`\`
scan → read code → write drafts → validate → review (user approval) → finalize
\`\`\`

## Rules

- Describe **observed behaviour only**. Never invent requirements the code does not implement.
- When intent is unclear (dead code, ambiguous branches, missing tests), say so in the draft's
  description or overview (e.g. "Uncertain: ...") instead of guessing.
- Write drafts only under \`.sdd/.reverse-drafts/<domain>/<feature>/spec.md\`.
  Never write to \`.sdd/specs/\` directly — \`sdd reverse finalize\` does that.
- \`<domain>\` must be a valid domain id (lowercase letter first, then lowercase letters, digits, hyphens).
  \`<feature>\` is a kebab-case id (lowercase letters, digits, hyphens). The frontmatter \`id\` must
  equal \`<feature>\` and \`domain\` (if set) must equal \`<domain>\`.
- Never approve a draft without explicit user confirmation.
- Match the language of existing specs / the constitution when writing prose.

## Workflow

### 1. Scan

\`\`\`bash
sdd reverse scan --json                       # whole project
sdd reverse scan src/ --json                  # a sub-tree
sdd reverse scan --json --exclude "**/*.test.ts" --language ts
\`\`\`

The JSON contains \`summary\` (file count, line count, language distribution),
\`domains[]\` (suggested domain \`id\`, \`path\`, \`files\`, \`lines\`, \`languages\`) and
\`unassigned\` source files. Domain suggestions are directory-based; merge, split or rename
them when the code suggests a better boundary.

### 2. Read the code

For each domain, find and read the relevant files: entry points, public APIs,
route handlers, data models, validation rules, error handling and existing tests (tests are
the best evidence of intended behaviour). Group behaviour into features (one spec per feature).

### 3. Write drafts

Create \`.sdd/.reverse-drafts/<domain>/<feature>/spec.md\` using the same spec format that \`/sdd-spec\` produces:

\`\`\`markdown
---
id: <feature>
title: <Feature title>
status: draft
created: <YYYY-MM-DD>
domain: <domain>
depends: null
---

# <Feature title>

> One-sentence summary of what the code does.

## Overview

What the feature does, which files implement it (e.g. \`src/auth/login.ts\`), and any
uncertainty about intent.

## Requirements

### REQ-01: <Requirement title>

The system SHALL <observed behaviour>.

### REQ-02: <Requirement title>

The system SHOULD <observed behaviour>.

## Scenarios

### Scenario 1: <Scenario name>

- **GIVEN** <precondition>
- **WHEN** <action>
- **THEN** <observed result>
\`\`\`

- RFC 2119 keywords must be UPPERCASE (SHALL, MUST, SHOULD, MAY, and their NOT forms).
- Every draft needs at least one requirement and one GIVEN/WHEN/THEN scenario.
- Add \`constitution_version\` if the project has a constitution, and list other spec ids in
  \`depends\` only when the code really depends on them.
- Do not leave template placeholders such as \`[requirement title]\`.

### 4. Validate and fix

\`\`\`bash
sdd validate .sdd/.reverse-drafts
\`\`\`

Fix every error (and warnings where reasonable) by editing the drafts, then re-run until it passes.

### 5. Present drafts to the user

\`\`\`bash
sdd reverse review --list                 # all drafts, statuses and validation results
sdd reverse review <domain>/<feature>     # one draft with its content
\`\`\`

Summarize each draft for the user (requirements, scenarios, open uncertainties) and ask which
ones to approve, change or reject. Apply requested changes to the draft files first.

### 6. Record the decision (only after the user confirms)

\`\`\`bash
sdd reverse review <domain>/<feature> --approve
sdd reverse review <domain>/<feature> --reject --reason "<why>"
\`\`\`

Approval is refused while the draft has validation errors. Approval is tied to a hash of the
draft content: any change to the file after review (even line-ending normalization such as
CRLF → LF) returns it to pending, so re-approve after changes.

### 7. Finalize

\`\`\`bash
sdd reverse finalize                      # all approved drafts
sdd reverse finalize <domain>/<feature>   # one approved draft
sdd reverse finalize --force              # overwrite existing specs (ask the user first)
\`\`\`

Finalize moves approved drafts to \`.sdd/specs/<domain>/<feature>/spec.md\`, registers the
domain in \`.sdd/domains.yml\` if needed, links the spec to it and removes the draft.
It refuses to overwrite an existing spec unless \`--force\` is given.

## Next Steps

- Validate the finalized specs with \`sdd validate .sdd/specs\`
- Adjust domains with \`/sdd-domain\` (rename, dependencies)
- Author new features with \`/sdd-spec\`
`,
};
