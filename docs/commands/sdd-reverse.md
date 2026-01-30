# /sdd.reverse

A slash command for reverse engineering SDD specs from legacy codebases.

## Overview

`/sdd.reverse` analyzes existing code and automatically generates SDD spec drafts. You can proceed with review and approval through Claude Code's conversational interface.

## Usage

```
/sdd.reverse scan [path]         # Scan project structure
/sdd.reverse extract [path]      # Extract specs from code
/sdd.reverse review [spec-id]    # Review extracted specs
/sdd.reverse finalize [spec-id]  # Finalize approved specs
```

## Workflow

```
scan -> extract -> review -> finalize
```

### 1. Scan

Analyzes the project to estimate directory structure, language distribution, and domains.

```
/sdd.reverse scan
/sdd.reverse scan src/
```

**Example output:**
```
Project scan results

Structure:
  src/
  ├── auth/ (3 files)
  ├── order/ (5 files)
  └── core/ (8 files)

Statistics:
  - Language: TypeScript (100%)
  - Files: 16
  - Symbols: 45

Estimated domains:
  1. auth - Authentication related
  2. order - Order related
  3. core - Common modules
```

### 2. Extract

Extracts spec drafts from code based on scan results.

```
/sdd.reverse extract
/sdd.reverse extract --domain auth
/sdd.reverse extract --depth deep
```

**Options:**
- `--domain <name>`: Extract only a specific domain
- `--depth <level>`: Analysis depth (shallow, medium, deep)
- `--min-confidence <n>`: Minimum confidence filter

### 3. Review

Review and approve/reject extracted spec drafts.

```
/sdd.reverse review              # List pending reviews
/sdd.reverse review auth/login   # Specific spec details
```

**Review statuses:**
- `pending`: Awaiting review
- `approved`: Approved
- `rejected`: Rejected
- `needs_revision`: Needs revision

### 4. Finalize

Convert approved specs to official SDD specs.

```
/sdd.reverse finalize --all      # Finalize all approved specs
/sdd.reverse finalize auth/login # Finalize specific spec
```

## Output Files

| File | Description |
|------|-------------|
| `.sdd/.reverse-meta.json` | Scan result metadata |
| `.sdd/.reverse-drafts/` | Spec drafts directory |
| `.sdd/specs/` | Finalized specs directory |

## Example: Complete Workflow

```
User: /sdd.reverse scan

Claude: Project scan complete!

Structure found:
  src/
  ├── auth/ (3 files, 450 LOC)
  ├── order/ (5 files, 890 LOC)
  └── core/ (8 files, 1200 LOC)

Estimated domains: auth, order, core

Next step: Run /sdd.reverse extract

---

User: /sdd.reverse extract --depth deep

Claude: Spec extraction complete!

Generated drafts:
  - auth/user-authentication (confidence: 72%)
  - auth/token-management (confidence: 85%)
  - order/checkout (confidence: 78%)

Items needing review: 8

Next step: Run /sdd.reverse review

---

User: /sdd.reverse review auth/user-authentication

Claude: Spec Review: auth/user-authentication

Confidence: 72%

## Extracted Requirements:
1. REQ-001: Email/password login [85%]
2. REQ-002: JWT token issuance [90%]
3. REQ-003: Session expiration 24 hours [70%]

## Extracted Scenarios:
1. Normal login [95%]
2. Wrong password [95%]

Would you like to approve this spec?
1. Approve
2. Needs revision
3. Reject

---

User: 1

Claude: auth/user-authentication approved

Next step: /sdd.reverse finalize auth/user-authentication

---

User: /sdd.reverse finalize --all

Claude: Spec finalization complete!

Finalized specs:
  - .sdd/specs/auth/user-authentication.md
  - .sdd/specs/auth/token-management.md
  - .sdd/specs/order/checkout.md

Next steps:
  1. Validate specs with sdd validate
  2. Manually refine if needed
```

## Confidence Score

The confidence of extracted specs is calculated from the following factors:

| Factor | Weight | Evaluation Criteria |
|--------|--------|---------------------|
| documentation | 25% | JSDoc, comment quality |
| naming | 20% | Naming convention adherence |
| structure | 20% | Code organization |
| testCoverage | 20% | Test existence |
| typing | 15% | Type information quality |

## Notes

- Symbol-level analysis is available when Serena MCP is connected
- Extracted specs must be reviewed before finalization
- Specs with low confidence may need modifications

## Related Commands

- [`sdd reverse`](/cli/reverse) - CLI version
- [`/sdd.spec`](/commands/sdd-spec) - Write/modify specs
- [`/sdd.validate`](/commands/sdd-validate) - Validate specs
