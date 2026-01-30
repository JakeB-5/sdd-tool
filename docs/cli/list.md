# sdd list

Lists items.

## Usage

```bash
sdd list [type]
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `type` | List type (specs, changes, all) | `specs` |

## Options

| Option | Description |
|--------|-------------|
| `--phase <n>` | Show specific phase only |
| `--status <status>` | Show specific status only |
| `--json` | JSON format output |

## Examples

```bash
# List all specs
sdd list

# Specs for specific phase
sdd list --phase 1

# List change proposals
sdd list changes

# JSON output
sdd list --json
```

## Output Example

```
📋 Spec List (12 items)

Phase 1:
  ✅ user-auth (implemented)
  ✅ data-model (implemented)
  📝 api-design (review)
  📄 error-handling (draft)

Phase 2:
  ✅ search-feature (approved)
  ...
```

## Related Commands

- [`sdd status`](/cli/status) - Project status
- [`sdd validate`](/cli/validate) - Validate specs
