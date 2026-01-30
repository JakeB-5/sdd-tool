# sdd watch

Monitors spec file changes in real-time and auto-validates.

## Usage

```bash
sdd watch [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--no-validate` | Disable auto-validation |
| `--impact` | Include impact analysis |
| `-q, --quiet` | Suppress success output |
| `--debounce <ms>` | Debounce time (default: 500ms) |

## Behavior

1. Watches the `.sdd/specs/` directory
2. Automatically runs validation on file changes
3. Displays validation results in real-time
4. Exit with `Ctrl+C`

## Examples

### Basic Execution

```bash
sdd watch
```

Output:
```
👁️  Watch mode started
   Path: .sdd/specs
   Debounce: 500ms
   Validation: enabled

Watching for file changes... (Ctrl+C to exit)

✅ Watch ready

[14:30:15] Change detected: 1 modified
  ✏️ user-auth/spec.md

🔍 Running validation...
✅ Validation passed (5 specs)

[14:32:45] Change detected: 1 added
  ➕ new-feature/spec.md

🔍 Running validation...
⚠️  Validation complete: 1 warning
   - new-feature: missing depends field

^C
Stopping watch mode...

📊 Session Summary:
   Validations run: 2
   Errors occurred: 0
```

### Disable Validation

```bash
sdd watch --no-validate
```

Only detects changes without running auto-validation.

### Quiet Mode

```bash
sdd watch --quiet
```

Suppresses output on validation success. Only shows errors and warnings.

### Include Impact Analysis

```bash
sdd watch --impact
```

Also displays impact analysis results for changed specs:

```
[14:35:20] Change detected: 1 modified
  ✏️ user-auth/spec.md

🔍 Running validation...
✅ Validation passed

📊 Impact Analysis:
  • Direct dependencies: user-profile, order-checkout
  • Indirect dependencies: payment-flow
```

### Adjust Debounce Time

```bash
sdd watch --debounce 2000
```

Runs validation 2 seconds after consecutive changes.

## Event Types

| Icon | Type | Description |
|------|------|-------------|
| ➕ | add | New file added |
| ✏️ | change | File modified |
| ❌ | unlink | File deleted |

## Use Cases

### Real-time Feedback During Development

Get real-time validation results while writing specs:

```bash
# Terminal 1: watch mode
sdd watch

# Terminal 2: edit specs
code .sdd/specs/user-auth/spec.md
```

### Pre-CI Validation

Validate all changes locally before creating a PR:

```bash
sdd watch --quiet
# Edit specs in editor
# Commit if no errors
```

## Related Documentation

- [sdd validate](/cli/validate) - Spec validation
- [sdd sync](/cli/sync) - Sync validation
- [sdd impact](/cli/impact) - Impact analysis
