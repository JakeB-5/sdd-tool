# sdd diff

Displays spec changes visually.

## Usage

```bash
sdd diff [commit1] [commit2] [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `commit1` | Start commit (HEAD if omitted) |
| `commit2` | End commit |

## Options

| Option | Description |
|--------|-------------|
| `--staged` | Staged changes only |
| `--stat` | Statistics summary |
| `--json` | JSON format output |

## Examples

### Working Directory Changes

```bash
sdd diff
```

### Staged Changes

```bash
sdd diff --staged
```

### Compare Between Commits

```bash
sdd diff abc123 def456
```

### Statistics Summary

```bash
sdd diff --stat
```

## Output Examples

### Detailed Output

```
SDD Diff

.sdd/specs/user-auth/spec.md

  Requirement Changes:
  + REQ-03: Password Reset (newly added)
  ~ REQ-01: Login (keyword changed: SHOULD → SHALL)

  Scenario Changes:
  + Scenario 3: Password Reset Success
```

### Statistics Summary

```
SDD Diff --stat

  2 specs changed
  + 3 requirements added
  ~ 1 requirement modified
  - 0 requirements removed
  + 2 scenarios added
```

## Change Types

| Symbol | Meaning |
|--------|---------|
| `+` | Added |
| `-` | Removed |
| `~` | Modified |

## Keyword Change Detection

RFC 2119 keyword changes are specially highlighted:

```
REQ-01: Login
  Keyword: SHOULD → SHALL (strengthened)
```
