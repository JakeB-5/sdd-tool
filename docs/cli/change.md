# sdd change

Manages change proposals for existing specs.

## Usage

```bash
sdd change [command] [options]
```

## Subcommands

| Command | Description |
|---------|-------------|
| `create` | Create new change proposal |
| `list` | List pending changes |
| `show <id>` | Show change details |
| `apply <id>` | Apply change |
| `archive <id>` | Archive completed change |

## Options

| Option | Description |
|--------|-------------|
| `-t, --title <title>` | Change proposal title |
| `-s, --spec <spec-id>` | Affected spec ID |
| `--dry-run` | Preview without applying |

## Change Workflow

```
create → review → apply → archive
```

1. **create**: Generates proposal.md and delta.md files
2. **review**: Team review and modifications
3. **apply**: Apply changes to existing specs
4. **archive**: Move completed changes to archive

## Examples

### Create New Change Proposal

```bash
sdd change create --title "Login Feature Enhancement" --spec user-auth
```

Output:
```
✅ Change proposal created.
   ID: CHG-001
   Path: .sdd/changes/CHG-001/

Generated files:
  - proposal.md (change proposal)
  - delta.md (change contents)
```

### List Pending Changes

```bash
sdd change list
```

Output:
```
=== Pending Changes ===

CHG-001: Login Feature Enhancement [draft]
CHG-002: API Response Format Change [review]

Total: 2
```

### Show Change Details

```bash
sdd change show CHG-001
```

### Apply Change

```bash
sdd change apply CHG-001
```

### Archive Change

```bash
sdd change archive CHG-001
```

## Generated Files

### proposal.md

```markdown
---
id: CHG-001
title: "Login Feature Enhancement"
status: draft
created: 2025-01-07
---

# Change Proposal: Login Feature Enhancement

## Reason for Change

[Explain why this change is needed]

## Affected Specs

- user-auth

## Change Summary

[Summarize the main changes]
```

### delta.md

```markdown
---
proposal_id: CHG-001
---

# Delta: Login Feature Enhancement

## ADDED

- [Newly added requirements]

## MODIFIED

- [Modified requirements]

## REMOVED

- [Removed requirements]
```

## Related Documentation

- [sdd impact](./impact) - Change impact analysis
- [CLI Reference](./) - All commands
