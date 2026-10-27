# sdd transition

Manages transitions between the new-feature and change workflows.

## Usage

```bash
sdd transition <subcommand> [options]
```

## Subcommands

| Command | Description |
|---------|-------------|
| `new-to-change <spec-id>` | Turn work on a new feature into a change proposal for an existing spec |
| `change-to-new <change-id>` | Turn a change proposal into a new feature spec |
| `guide` | Print the transition guide |

## Options

| Subcommand | Option | Description |
|------------|--------|-------------|
| `new-to-change` | `-t, --title <title>` | Change proposal title |
| `new-to-change` | `-r, --reason <reason>` | Reason for the transition |
| `change-to-new` | `-n, --name <name>` | New feature name |
| `change-to-new` | `-r, --reason <reason>` | Reason for the transition |

## When Workflow Transition is Needed

### new to change Transition

- When you find an overlap with an existing spec while writing a new one
- When extending an existing feature is more appropriate
- When the dependency analysis shows an existing spec must change

### change to new Transition

- When the change scope is too large and needs to be split into a new feature
- When it grows into a feature independent of the existing spec

## Examples

### Transition from new to change

```bash
sdd transition new-to-change auth/login -r "extends the existing login"
```

Creates the next `CHG-XXX` change proposal (`proposal.md`, `delta.md` and `tasks.md`) for `auth/login`:

```
✓ 전환 완료! 변경 제안이 생성되었습니다.

ℹ 변경 ID: CHG-002
ℹ 위치: .sdd/changes/CHG-002/
```

Then edit the proposal and delta, run `sdd change validate CHG-002` and `sdd change apply CHG-002`.

### Transition from change to new

```bash
sdd transition change-to-new CHG-002 -n new-login
```

Creates the spec `.sdd/specs/common/new-login/spec.md` (plus plan.md and tasks.md) and marks the original change as `transitioned`.
Continue by editing them (`sdd new plan` / `sdd new tasks` would refuse because the files exist; add `--force` only to regenerate).

Without `-n` the feature name is the proposal title, lowercased with spaces turned into hyphens. The command
fails (exit code 1) when that name is not a single path segment (a title like `Auth/Login v2` contains `/`) or the spec
already exists (`스펙이 이미 존재합니다`); pass `-n <name>` then. For non-English or otherwise odd titles, pass `-n`
with a kebab-case name anyway so the id is a valid feature name.

### Print the Guide

```bash
sdd transition guide
```

## Transition Notes

1. **new to change**: The original spec is preserved. The generated proposal gets the next `CHG-XXX` id
   (archived ids are never reused) and uses the proposal schema fields (`id`, `target`), so
   `sdd change validate` / `sdd impact change` can read it.
2. **change to new**: The `transitioned` state is written only to `.sdd/changes/<id>/.status` (with the new feature name
   and a timestamp). `proposal.md` keeps `status: draft`, so `sdd list changes` and `sdd change -l` still show the
   change as `[draft]`.
3. Rule of thumb: prefer a change when ≤ 3 specs are affected and the work extends existing behavior;
   prefer a new feature when more specs are affected, a new concept or domain is introduced, or it can be tested independently.

## Related Documentation

- [sdd new](/cli/new) - Create new feature
- [sdd change](/cli/change) - Change management
- [Workflow Guide](/guide/workflow)
