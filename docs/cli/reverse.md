# sdd reverse

Extracts SDD specs from legacy codebases.

## Overview

`sdd reverse` analyzes existing code and automatically generates SDD spec drafts. Useful when introducing SDD to legacy projects.

## Workflow

```
scan → extract → review → finalize
```

## Subcommands

### scan

Scans and analyzes project structure.

```bash
sdd reverse scan                    # Scan entire project
sdd reverse scan src/               # Scan specific directory only
sdd reverse scan --json             # Output as JSON
```

**Output:**
- Directory structure
- Language distribution statistics
- Estimated domain list
- File/symbol counts

### extract

Extracts spec drafts from code based on scan results.

```bash
sdd reverse extract                 # Extract all
sdd reverse extract --domain auth   # Extract specific domain only
sdd reverse extract --depth deep    # Deep analysis (includes scenarios)
sdd reverse extract --dry-run       # Preview only
```

**Options:**

| Option | Description |
|--------|-------------|
| `--domain <name>` | Extract specific domain only |
| `--depth <level>` | Analysis depth (shallow, medium, deep) |
| `--min-confidence <n>` | Minimum confidence (0-100) |
| `--dry-run` | Preview without creating files |

### review

Reviews and approves/rejects extracted spec drafts.

```bash
sdd reverse review                  # Show pending review list
sdd reverse review auth/login       # View specific spec details
```

**Review statuses:**
- `pending`: Awaiting review
- `approved`: Approved
- `rejected`: Rejected
- `needs_revision`: Needs revision

### finalize

Converts approved specs to official SDD specs.

```bash
sdd reverse finalize --all          # Finalize all approved specs
sdd reverse finalize auth/login     # Finalize specific spec only
```

## Output Files

| File | Description | Created By |
|------|-------------|------------|
| `.sdd/.reverse-meta.json` | Scan result metadata | `scan` |
| `.sdd/.reverse-drafts/<domain>/<spec>.json` | Spec drafts | `extract` |
| `.sdd/specs/<domain>/<spec>/spec.md` | Finalized specs (v1.3.0) | `finalize` |

::: tip v1.3.0 Path Change
Finalized specs are now saved in `<domain>/<feature>/spec.md` format.
Example: `.sdd/specs/auth/login/spec.md`
:::

## Usage Examples

### Basic Workflow

```bash
# 1. Scan project
sdd reverse scan
# → Directory structure, language distribution, domain estimation

# 2. Extract specs
sdd reverse extract --depth deep
# → Drafts created in .sdd/.reverse-drafts/

# 3. Review
sdd reverse review
# → Approve/reject/revise each spec

# 4. Finalize
sdd reverse finalize --all
# → Official specs created in .sdd/specs/<domain>/<feature>/spec.md
```

### Extract Specific Domain Only

```bash
sdd reverse scan src/auth/
sdd reverse extract --domain auth
sdd reverse review auth/login
sdd reverse finalize auth/login
```

## Confidence Scores

Extracted specs include confidence scores:

| Factor | Weight | Description |
|--------|--------|-------------|
| documentation | 25% | JSDoc/comment quality |
| naming | 20% | Naming convention compliance |
| structure | 20% | Code structure quality |
| testCoverage | 20% | Estimated test coverage |
| typing | 15% | Type information quality |

## Serena MCP Integration

When Serena MCP is connected, precise symbol-level analysis is available:

- Class/function/interface extraction
- Reference relationship analysis
- Dependency graph generation

Basic file scanning works even without Serena.

## References

- [Reverse Spec Extraction Guide](/roadmap/reverse-extraction)
- [Domain Management](/guide/workflow-constitution)
