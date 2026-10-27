# sdd context

Sets and manages the working context (the domains you are currently working on).

## Usage

```bash
sdd context <command> [options]
```

## Commands

### set

Sets the context.

```bash
sdd context set <domains...> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--no-include-deps` | Do not add dependent domains (they are added as read-only by default) |

**Examples:**

```bash
# Single domain
sdd context set auth

# Multiple domains
sdd context set auth order payment

# Without dependent domains
sdd context set auth --no-include-deps
```

If `billing` depends on `auth` (`sdd domain depends billing --on auth`), `sdd context set billing`
makes `billing` active (editable) and `auth` read-only.

### show

Displays the current context.

```bash
sdd context show [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--json` | JSON format output |

**Output example (CLI output is Korean):**

```
현재 컨텍스트:

  활성 도메인 (편집 가능):
    billing - billing 도메인 (1 specs)

  읽기 전용 도메인 (의존성):
    auth - auth 도메인 (2 specs)

요약:
  총 도메인: 2
  총 스펙: 3
```

### add

Adds a domain to the context.

```bash
sdd context add <domain> [--no-include-deps]
```

### remove

Removes a domain from the context. Fails if the domain is not in the context.

```bash
sdd context remove <domain>      # alias: rm
```

### clear

Clears the context.

```bash
sdd context clear
```

### specs

Lists the specs included in the context (active specs and read-only specs).

```bash
sdd context specs [--json]
```

## What the context affects

The context is only used for the **default domain of `sdd new`**:

```bash
sdd context set auth
sdd new user-login     # → auth/user-login created
```

- Exactly one active domain: `sdd new <feature>` creates the spec in that domain.
- No context, or several active domains: `sdd new <feature>` falls back to the `common` domain. Name the domain
  explicitly instead: `sdd new auth/user-login` or `sdd new user-login -d auth`.
- An explicit `<domain>/<feature>` or `-d` always wins over the context, and a domain that does not exist yet is created.
  There is no "outside the context" warning or confirmation prompt, and `--force` does not bypass anything here
  (it overwrites existing files, see [sdd new](/cli/new)).

`sdd list`, `sdd validate` and the other commands do **not** filter by context; use `sdd context specs`
to see the specs in scope, and `sdd validate --domain <domain>` / `sdd status --domain <domain>` to scope a command.

## Context File

State is stored in `.sdd/.context.json`:

```json
{
  "activeDomains": ["auth", "order"],
  "readOnlyDomains": ["core"],
  "updatedAt": "2025-12-29T10:30:00.000Z",
  "includeDependencies": true
}
```

## Related Documentation

- [Context Guide](../guide/context.md)
- [Domain System](../guide/domains.md)
- [sdd domain](./domain.md)
