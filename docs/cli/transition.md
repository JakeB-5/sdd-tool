# sdd transition

Manages transitions between new and change workflows.

## Usage

```bash
sdd transition [command] [options]
```

## Subcommands

| Command | Description |
|---------|-------------|
| `to-change <spec-id>` | Transition from new to change workflow |
| `to-new <change-id>` | Transition from change to new workflow |
| `status` | Check current workflow status |

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview without actual changes |
| `--force` | Force transition ignoring warnings |

## When Workflow Transition is Needed

### new to change Transition

- When changes are needed to an already implemented feature
- When improvements are needed based on existing specs
- When bug fixes or refactoring is required

### change to new Transition

- When the change scope is too large and needs to be split into a new feature
- When a completely different approach is needed from the existing spec

## Examples

### Transition from new to change

```bash
sdd transition to-change user-auth
```

Output:
```
🔄 Workflow Transition: new → change

📄 Original Spec: user-auth
   Status: approved
   Domain: auth

Change proposal to be created:
  • ID: CHG-005
  • Path: .sdd/changes/CHG-005/

Proceed with transition? (y/n): y

✅ Transition complete!
   Change Proposal: CHG-005
   Next step: sdd change show CHG-005
```

### Transition from change to new

```bash
sdd transition to-new CHG-003
```

Output:
```
🔄 Workflow Transition: change → new

📋 Original Change: CHG-003
   Title: Complete API Response Format Overhaul
   Affected Specs: 5

⚠️  Warning: This change affects 5 specs.
   Splitting into a new feature will cancel the original change proposal.

Continue? (y/n): y

Spec to be created:
  • ID: api-v2-response
  • Path: .sdd/specs/api/api-v2-response/

✅ Transition complete!
   New Spec: api-v2-response
   Original change (CHG-003) has been marked as cancelled.
```

### Check Current Status

```bash
sdd transition status
```

Output:
```
=== Workflow Status ===

📋 New Workflow:
  • In Progress: 2 specs
    - user-profile (draft)
    - payment-gateway (plan)

📋 Change Workflow:
  • In Progress: 1 change
    - CHG-004: Login UX Improvement (review)

💡 Transition Candidates:
  • user-profile → can transition to change (already approved status)
  • CHG-004 → can transition to new (large change scope)
```

### Preview (dry-run)

```bash
sdd transition to-change user-auth --dry-run
```

Output:
```
🔍 [DRY-RUN] Workflow Transition Preview

📄 Original Spec: user-auth

Files to be created:
  • .sdd/changes/CHG-005/proposal.md
  • .sdd/changes/CHG-005/delta.md

Files to be modified:
  • None

(No actual files were changed)
```

## Transition Notes

1. **new to change**: Original spec is preserved
2. **change to new**: Original change proposal is marked as cancelled
3. **Work in progress**: Warning is displayed if there is work in progress

## Related Documentation

- [sdd new](/cli/new) - Create new feature
- [sdd change](/cli/change) - Change management
- [Workflow Guide](/guide/workflow)
