# sdd domain

Manages domains and visualizes dependency graphs.

## Usage

```bash
sdd domain <command> [options]
```

## Commands

### create

Creates a new domain.

```bash
sdd domain create <name> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `-d, --description <text>` | Domain description |
| `-p, --path <path>` | Source code path |
| `--depends-on <domains...>` | Domains this domain uses |
| `--extends <domains...>` | Domains this domain extends |
| `--implements <domains...>` | Domains this domain implements |

`owner`, `tags` and `defaults` are not CLI options; set them in `.sdd/domains.yml`.
`sdd new <domain>/<feature>` also creates a missing domain automatically (same as `sdd domain create <domain>`).

**Examples:**

```bash
# Basic creation
sdd domain create auth

# With detailed options
sdd domain create auth \
  --description "Authentication and authorization" \
  --path "src/auth" \
  --depends-on core

# Multiple dependencies
sdd domain create order --depends-on core auth
```

### list

Lists domains.

```bash
sdd domain list [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--tree` | Display as dependency tree |
| `--json` | JSON format output |
| `--has-specs` | Only domains that have specs |
| `--orphan` | Only domains without specs |

**Examples:**

```bash
sdd domain list
sdd domain list --tree
sdd domain list --json
```

**Output example:**

```
📁 Domain List (5 items)

  core       Core features and common utilities     3 specs
  auth       Authentication and authorization       4 specs  → core
  user       User management                        2 specs  → core, auth
  order      Orders and payments                    5 specs  → core, auth
  payment    Payment processing                     3 specs  → core, order
```

### show

Displays domain details.

```bash
sdd domain show <name>
```

**Output example:**

```
📁 Domain: auth

Description: Authentication and authorization
Path: src/auth
Owner: @security-team

Specs (4):
  ✅ user-login
  ✅ oauth-google
  🔄 session-management
  📝 mfa-setup

Dependencies:
  Uses: core
  Used by: user, order

Tags: security, authentication
```

### link

Links specs to a domain.

```bash
sdd domain link <domain> <spec>
```

**Examples:**

```bash
sdd domain link auth user-login
sdd domain link auth oauth-google oauth-apple
```

### unlink

Unlinks specs from a domain.

```bash
sdd domain unlink <domain> <spec>
```

**Examples:**

```bash
sdd domain unlink auth legacy-login
```

### depends

Manages domain dependencies.

```bash
sdd domain depends <domain> --on <target> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--on` | Target domain |
| `--remove` | Remove dependency |

**Examples:**

```bash
# Add dependency
sdd domain depends order --on auth

# Remove dependency
sdd domain depends order --on legacy --remove
```

### graph

Generates dependency graph.

```bash
sdd domain graph [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--format` | Output format (mermaid, dot, json) | mermaid |
| `--output`, `-o` | Save to file | - |
| `--direction` | Direction (TD, LR, BT, RL); applies to Mermaid and DOT (`TD` → `rankdir=TB`) | LR |

Domain ids and descriptions are quoted/escaped in DOT and Mermaid output, so hyphenated ids
(`user-profile`) and descriptions containing `"` produce valid graphs.

**Examples:**

```bash
sdd domain graph
sdd domain graph --format dot
sdd domain graph --output graph.md
sdd domain graph --direction TD
```

**Mermaid output:**

```mermaid
graph LR
    core --> auth
    core --> order
    auth --> order
    auth --> user
    order --> payment
```

### delete

Deletes a domain.

```bash
sdd domain delete <name> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `-f, --force` | Delete even when specs are linked (the links in domains.yml are removed with the domain) |
| `--unlink-specs` | Also delete when specs are linked, and remove the `domain` field from those specs' frontmatter |

Without either option, a domain with linked specs is not deleted. Spec files are never deleted.

**Examples:**

```bash
sdd domain delete legacy
sdd domain delete legacy --force
sdd domain delete legacy --unlink-specs
```

### rename

Renames a domain. The spec folder `.sdd/specs/<old>/` is moved to `.sdd/specs/<new>/` and the
`domain` field of affected specs is updated. Fails without changing anything if `.sdd/specs/<new>/` already exists.

```bash
sdd domain rename <old-name> <new-name>
```

**Examples:**

```bash
sdd domain rename auth authentication
```

### update

Updates a domain's description or source path.

```bash
sdd domain update <name> [-d, --description <text>] [-p, --path <path>]
```

### validate

Validates the domain structure (circular dependencies, dependency rules, missing domains). Exits with code 2
(`VALIDATION_FAILED`) when it is invalid.

```bash
sdd domain validate
```

## Configuration File

Domains are stored in `.sdd/domains.yml`:

```yaml
version: "1.0"
domains:
  core:
    description: "Core features"
    path: "src/core"
    specs:
      - data-model
      - validation

  auth:
    description: "Authentication and authorization"
    path: "src/auth"
    specs:
      - user-login
      - oauth-google
    dependencies:
      uses: [core]
    owner: "@security-team"
```

## Related Documentation

- [Domain System Guide](../guide/domains.md)
- [sdd context](./context.md)
- [sdd validate](./validate.md)
