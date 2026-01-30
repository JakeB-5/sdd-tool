# sdd context

Sets and manages the working context.

## Usage

```bash
sdd context <command> [options]
```

## Commands

### set

Sets the context.

```bash
sdd context set <domain...> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--include-deps` | Include dependent domains |
| `--read-only` | Set as read-only |

**Examples:**

```bash
# Single domain
sdd context set auth

# Multiple domains
sdd context set auth order payment

# Include dependencies
sdd context set auth --include-deps
```

### show

Displays the current context.

```bash
sdd context show [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--json` | JSON format output |

**Output example:**

```
📍 Current Context

Active Domains:
  ✏️  auth (editable)
  ✏️  order (editable)

Read-only:
  📖 core

Spec Count: 12
Set Time: 2025-12-29 10:30:00
```

### add

Adds a domain to the context.

```bash
sdd context add <domain...> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--read-only` | Add as read-only |

**Examples:**

```bash
sdd context add payment
sdd context add notification --read-only
```

### remove

Removes a domain from the context.

```bash
sdd context remove <domain...>
```

**Examples:**

```bash
sdd context remove order
sdd context remove order payment
```

### clear

Clears the context.

```bash
sdd context clear
```

### specs

Displays specs within the context.

```bash
sdd context specs [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--status` | Filter by status (draft, approved, implemented) |
| `--domain` | Filter by domain |
| `--json` | JSON format output |

**Examples:**

```bash
sdd context specs
sdd context specs --status draft
sdd context specs --domain auth
```

**Output example:**

```
📋 Context Specs (12 items)

auth (4):
  ✅ user-login
  ✅ oauth-google
  🔄 session-management
  📝 mfa-setup

order (5):
  ✅ create-order
  ✅ update-order
  ✅ cancel-order
  🔄 payment
  📝 refund

core (3) [read-only]:
  ✅ data-model
  ✅ validation
  ✅ utils
```

### history

Displays context change history.

```bash
sdd context history [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--limit`, `-n` | Number of items to show | 10 |

**Output example:**

```
📜 Context History

1. 2025-12-29 10:30:00  set auth, order
2. 2025-12-29 09:15:00  add payment
3. 2025-12-29 09:00:00  set core --include-deps
4. 2025-12-28 16:00:00  clear
```

### save / load

Saves and loads contexts.

```bash
sdd context save <name>
sdd context load <name>
sdd context list-saved
```

**Examples:**

```bash
# Save current context
sdd context save payment-feature

# Load saved context
sdd context load payment-feature

# List saved contexts
sdd context list-saved
```

## Global Options

| Option | Description |
|--------|-------------|
| `--help`, `-h` | Show help |
| `--quiet`, `-q` | Minimal output |

## Context File

State is stored in `.sdd/.context.json`:

```json
{
  "active_domains": ["auth", "order"],
  "read_only_domains": ["core"],
  "updated_at": "2025-12-29T10:30:00Z",
  "saved_contexts": {
    "payment-feature": {
      "active_domains": ["order", "payment"],
      "read_only_domains": ["core", "auth"]
    }
  }
}
```

## Context with Other Commands

### sdd new

Automatically detects domain when context is set:

```bash
sdd context set auth
sdd new user-login     # → auth/user-login created
```

If multiple domains are set, selection is requested:

```bash
sdd context set auth order
sdd new payment
# Select domain: [auth] [order]
```

### sdd list

Filtered by context scope:

```bash
sdd context set auth
sdd list               # Shows auth domain specs only
sdd list --all         # Shows all specs
```

### sdd validate

Validates within context scope:

```bash
sdd context set auth
sdd validate           # Validates auth-related specs only
sdd validate --all     # Validates all
```

## Warnings

A warning is displayed when modifying domains outside the context:

```
⚠️ Warning: payment domain is not in the current context.
Continue? [y/N]
```

Use the `--force` option to bypass:

```bash
sdd new payment/refund --force
```

## Related Documentation

- [Context Guide](../guide/context.md)
- [Domain System](../guide/domains.md)
- [sdd domain](./domain.md)
