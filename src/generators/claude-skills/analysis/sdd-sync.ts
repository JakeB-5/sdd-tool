/**
 * sdd-sync skill definition — verify synchronization between spec requirements and implementation.
 */
import type { SkillDefinition } from '../types.js';

export const sddSyncSkill: SkillDefinition = {
  name: 'sdd-sync',
  description:
    'Check which spec requirements (REQ-xxx) are implemented in code or tests via `@spec` annotations and report the sync rate with `sdd sync`. Use when the user asks whether code matches the specs.',
  argumentHint: '[specId] [--json] [--ci --threshold <percent>]',
  allowedTools: ['Read', 'Glob', 'Grep', 'Bash(sdd sync*)'],
  context: 'fork',
  content: `# SDD Sync

## Overview

Verify that every REQ-xx requirement in a spec is referenced by source code or a test. Detect gaps early to prevent spec drift.

---

## Commands

\`\`\`bash
# Verify all specs
sdd sync

# Verify a specific spec
sdd sync auth/login

# Output as JSON (stdout carries only JSON)
sdd sync --json

# CI mode: exit 2 if the sync rate is below the threshold (default 100)
sdd sync --ci --threshold 80

# Generate a Markdown report
sdd sync --markdown
\`\`\`

---

## Code Annotation Convention

Without \`--ci\`/\`--threshold\`, \`sdd sync\` only reports and exits 0.

Requirement IDs are numbered per spec, so qualify \`@spec\` annotations with the spec:
\`<domain>/<feature>#REQ-xx\` (or \`<feature>#REQ-xx\` when the feature name is unique).
A bare \`@spec REQ-01\` matches only when exactly one spec has \`REQ-01\`; if several specs do,
the reference is ignored and reported as a warning (JSON: \`warnings\`). References that match
no spec are reported as orphans.

\`\`\`typescript
/**
 * Authenticate a user with email and password.
 * @spec auth/login#REQ-01
 * @spec auth/login#REQ-02
 */
export async function login(email: string, password: string) { ... }
\`\`\`

---

## Test Mapping Convention

Name tests with the same reference:

\`\`\`typescript
it('auth/login#REQ-01: logs in with valid credentials', () => { ... });
it('auth/login#REQ-02: rejects invalid password', () => { ... });
\`\`\`

---

## Output Format

\`\`\`
=== SDD Sync: spec-code synchronization ===

Specs: 3   Requirements: 15

Implemented (12/15):
  auth/login#REQ-01  login                 src/auth/login.ts:45
  auth/login#REQ-02  password validation   src/auth/login.ts:62
  ...

Not implemented (3/15):
  auth/reset#REQ-01  password reset
  auth/login#REQ-05  account lockout
  audit/log#REQ-01   audit logging

Sync rate: 80% (12/15)
\`\`\`

---

## Workflow

1. Run \`sdd sync --json\` to collect requirement statuses, orphans and warnings.
2. A requirement is \`implemented\` when code **or** a test references it, otherwise \`missing\`.
3. For each ignored-reference warning, rewrite the bare \`REQ-xx\` as \`<domain>/<feature>#REQ-xx\`.
4. Report the overall sync rate and the missing requirements per spec.
5. In CI mode (\`--ci\`), the command exits 2 if the rate falls below the threshold.

---

## Next Steps

For each unimplemented requirement, run \`/sdd-tasks\` to create implementation tasks, or open the relevant spec with \`/sdd-implement\` to begin coding.
`,
};
