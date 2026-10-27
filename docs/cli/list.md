# sdd list

Lists items.

## Usage

```bash
sdd list                       # project summary
sdd list <subcommand> [options]
```

Alias: `sdd ls`.

## Subcommands

| Command | Description |
|---------|-------------|
| `features` (`f`) | List features with their status |
| `changes` (`c`) | List change proposals |
| `specs` (`s`) | List spec files as a tree |
| `templates` (`t`) | List the templates in `.sdd/templates/` |

## Options

| Subcommand | Option | Description |
|------------|--------|-------------|
| `features` | `--status <status>` | Only one status: `draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated` |
| `changes` | `--pending` | Only pending changes |
| `changes` | `--archived` | Only archived changes |

## Examples

```bash
# Summary (feature, pending and archived change counts)
sdd list

# All features
sdd list features

# Only implemented features
sdd list features --status implemented

# Pending change proposals
sdd list changes --pending

# Spec files as a tree
sdd list specs
```

## Output Example

```
📋 기능 목록
──────────────────────────────────────────────────
📝 login (auth/login) - draft
✅ pay (billing/pay) - implemented
```

## Related Commands

- [`sdd status`](/cli/status) - Project status
- [`sdd validate`](/cli/validate) - Validate specs
