# sdd sync

Validates synchronization between specs and code.

## Usage

```bash
sdd sync [specId] [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `specId` | Specific spec ID (all if omitted) |

## Options

| Option | Description |
|--------|-------------|
| `--ci` | CI mode (returns exit code) |
| `--threshold <n>` | Sync rate threshold (default: 80) |
| `--json` | JSON format output |
| `--markdown` | Markdown report |

## Sync Methods

### Referencing Specs in Code

```typescript
/**
 * @spec REQ-01
 * User login handling
 */
function login() {}
```

### Referencing Specs in Tests

```typescript
describe('REQ-01: Login', () => {
  it('should authenticate user', () => {});
});
```

## Examples

### Check All Synchronization

```bash
sdd sync
```

### Check Specific Spec Only

```bash
sdd sync user-auth
```

### Use in CI

```bash
sdd sync --ci --threshold 80
```

### JSON Output

```bash
sdd sync --json
```

## Output Example

```
SDD Sync

┌──────────┬─────────────┬──────────┬──────────┐
│ Spec ID  │ Requirements│ Code     │ Tests    │
├──────────┼─────────────┼──────────┼──────────┤
│ auth     │ 5           │ 4 (80%)  │ 5 (100%) │
│ profile  │ 3           │ 3 (100%) │ 2 (67%)  │
└──────────┴─────────────┴──────────┴──────────┘

Overall sync rate: 85%
```

## CI/CD Integration

```yaml
- name: Check spec sync
  run: sdd sync --ci --threshold 80
```
