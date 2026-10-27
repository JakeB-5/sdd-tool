# /sdd-context

A skill for managing the working context (active domains).

## Overview

`/sdd-context` sets the scope of domains you're currently working with. In large projects, narrowing the context to one or more domains lets you focus on the relevant specs without noise from other parts of the project. The skill runs the matching `sdd context` CLI command.

## Usage

```
/sdd-context [set|show|add|remove|clear|specs] [domain...]   # Claude Code
$sdd-context [set|show|add|remove|clear|specs] [domain...]   # Codex
```

```
/sdd-context set <domain...>  # Set context
/sdd-context show             # Show current context
/sdd-context add <domain>     # Add a domain
/sdd-context remove <domain>  # Remove a domain
/sdd-context clear            # Clear context
/sdd-context specs            # List specs in context
```

## Subcommands

### set

Set the active domain context. Dependent domains are included by default (as read-only domains).

```bash
sdd context set auth
sdd context set auth payment order
sdd context set auth --no-include-deps   # Exclude dependent domains
```

### show

Display the currently active context.

```bash
sdd context show
sdd context show --json
```

### add / remove

Add or remove a domain from the active context.

```bash
sdd context add order
sdd context add order --no-include-deps
sdd context remove payment
```

### clear

Clear the active context entirely.

```bash
sdd context clear
```

### specs

List all specs within the active context. Use `--json` to pass the list to other tools.

```bash
sdd context specs
sdd context specs --json
```

## Context Effects

The context is read only when creating a spec: when exactly one domain is active, a new spec without an explicit domain (`/sdd-spec <feature>`, i.e. `sdd new <feature>`) defaults to that domain. With several active domains no default is applied.

`sdd validate` and `sdd list` ignore the context. To validate a single domain, use `sdd validate -d <domain>`.

## Example

Illustrative output (abbreviated):

```
/sdd-context set payment

AI: $ sdd context set payment

    Active domains (editable):
      payment (3 specs)
    Read-only domains (dependencies):
      auth (5 specs)
```

## Next Steps

- After setting context: run `/sdd-spec` to author specs within scope
- After finishing work: run `/sdd-context clear` to reset the scope

## Related Commands

- [`sdd context`](/cli/context) - CLI version
- [`/sdd-domain`](/commands/sdd-domain) - Domain management
- [Context Guide](/guide/context)
