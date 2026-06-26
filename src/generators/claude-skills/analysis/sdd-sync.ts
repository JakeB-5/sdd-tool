/**
 * sdd-sync skill definition — verify synchronization between spec requirements and implementation.
 */
import type { SkillDefinition } from '../types.js';

export const sddSyncSkill: SkillDefinition = {
  name: 'sdd-sync',
  description: 'Verify synchronization between spec requirements and implementation code',
  allowedTools: ['Read', 'Glob', 'Grep', 'Bash(sdd sync*)'],
  context: 'fork',
  content: `# SDD Sync

## Overview

Verify that every REQ-xxx requirement in a spec has a corresponding implementation in source code or a matching test. Detect gaps early to prevent spec drift.

---

## Commands

\`\`\`bash
# Verify all specs
sdd sync

# Verify a specific spec
sdd sync user-auth

# Output as JSON
sdd sync --json

# CI mode: fail if sync rate is below threshold
sdd sync --ci --threshold 80

# Generate a Markdown report
sdd sync --markdown
\`\`\`

---

## Code Annotation Convention

Link implementation code to requirements using \`@spec\` annotations:

\`\`\`typescript
/**
 * Authenticate a user with email and password.
 * @spec REQ-001
 * @spec REQ-002
 */
export async function login(email: string, password: string) { ... }
\`\`\`

---

## Test Mapping Convention

Name tests to reference requirement IDs:

\`\`\`typescript
it('REQ-001: logs in with valid credentials', () => { ... });
it('REQ-002: rejects invalid password', () => { ... });
\`\`\`

---

## Output Format

\`\`\`
=== SDD Sync: spec-code synchronization ===

Specs: 3   Requirements: 15

Implemented (12/15):
  REQ-001  login                    src/auth/login.ts:45
  REQ-002  password validation      src/auth/login.ts:62
  ...

Not implemented (3/15):
  REQ-010  password reset
  REQ-013  account lockout
  REQ-015  audit logging

Sync rate: 80% (12/15)
\`\`\`

---

## Workflow

1. Run \`sdd sync\` to collect the full requirement list.
2. For each REQ-xxx, search source files for \`@spec REQ-xxx\` annotations.
3. Search test files for \`REQ-xxx:\` in test names.
4. Mark each requirement as Implemented, Partially implemented, or Not implemented.
5. Calculate and display the overall sync rate.
6. In CI mode (\`--ci\`), exit non-zero if the rate falls below the threshold.

---

## Next Steps

For each unimplemented requirement, run \`/sdd-tasks\` to create implementation tasks, or open the relevant spec with \`/sdd-implement\` to begin coding.
`,
};
