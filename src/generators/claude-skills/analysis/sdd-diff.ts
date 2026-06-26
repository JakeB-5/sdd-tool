/**
 * sdd-diff skill definition — visualize spec changes between commits or in the working directory.
 */
import type { SkillDefinition } from '../types.js';

export const sddDiffSkill: SkillDefinition = {
  name: 'sdd-diff',
  description: 'Visualize spec changes between commits or within the working directory',
  allowedTools: ['Read', 'Glob', 'Bash(sdd diff*,git diff)'],
  context: 'inline',
  content: `# SDD Diff

## Overview

Compare spec files structurally — not just line-by-line. SDD Diff recognizes changes to requirements (REQ-xxx), scenarios (GIVEN/WHEN/THEN), RFC 2119 keywords, and YAML frontmatter metadata.

---

## Commands

\`\`\`bash
# Diff working directory against HEAD
sdd diff

# Diff staged changes only
sdd diff --staged

# Compare two commits
sdd diff abc123 def456

# Compare branches
sdd diff main..feature/auth

# Diff a specific spec only
sdd diff --spec user-auth

# Summary statistics
sdd diff --stat

# File names only
sdd diff --name-only

# JSON output
sdd diff --json

# Plain output (no ANSI color)
sdd diff --no-color
\`\`\`

---

## Detected Change Types

| Type | Description |
|------|-------------|
| Requirements | REQ-xxx additions, modifications, deletions |
| Scenarios | GIVEN/WHEN/THEN block changes |
| Keywords | RFC 2119 keyword changes (e.g., SHOULD → SHALL) |
| Metadata | YAML frontmatter field changes |

---

## Output Format

\`\`\`
=== SDD Diff ===

.sdd/specs/user-auth/spec.md

  Requirements:
  ~ REQ-001: User Login
    - The system SHOULD support email/password login
    + The system SHALL support email/password login
    ⚠ REQ-001: SHOULD → SHALL (strengthened)

  + REQ-005: Social Login
    + The system MAY support Google OAuth

  Scenarios:
  + Scenario: Google Login
\`\`\`

---

## Statistics Output (--stat)

\`\`\`
=== SDD Diff --stat ===

.sdd/specs/user-auth/spec.md
  Requirements : +1  ~1  -0
  Scenarios    : +1  ~0  -0
  Keyword changes: 1  (strengthened: 1, weakened: 0)

Total: 1 file changed, requirements +1 ~1 -0
\`\`\`

---

## Keyword Strength Classification

| Change | Direction |
|--------|-----------|
| MAY → SHOULD | Strengthened |
| SHOULD → SHALL | Strengthened |
| SHALL → SHOULD | Weakened |
| SHOULD → MAY | Weakened |

---

## Next Steps

After reviewing the diff, run \`/sdd-impact\` to assess downstream effects of keyword strengthening or new requirements. If changes look correct, proceed with \`/sdd-sync\` to verify implementation coverage.
`,
};
