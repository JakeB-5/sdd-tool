# sdd prompt

Prints the SDD prompt template for a workflow step, for reuse in other AI tools.

## Usage

```bash
sdd prompt [name]
sdd prompt --list
```

Running without a name, or with `--list`, prints the available prompts.
Any name that is not in the list is rejected with an error.

## Prompts

| Name | Description | Related skill / command |
|------|-------------|-------------------------|
| `new` | Write a new feature spec | `/sdd-spec` |
| `plan` | Write an implementation plan | `/sdd-plan` |
| `tasks` | Break a plan into tasks | `/sdd-tasks` |
| `change` | Write a change proposal | `/sdd-spec` |
| `apply` | Apply an approved change | `sdd change apply <id>` |
| `archive` | Archive a completed change | `sdd change archive <id>` |
| `impact` | Analyze change impact | `/sdd-impact` |
| `validate` | Validate a spec | `/sdd-validate` |

## Options

| Option | Description |
|--------|-------------|
| `-l, --list` | List available prompts |

## Examples

```bash
# List prompts
sdd prompt --list

# Print the change proposal prompt
sdd prompt change

# Save to a file
sdd prompt plan > ./prompts/plan.md
```

## Related Documentation

- [CLI Reference](./) - All commands
- [Best Practices](../guide/best-practices) - Usage patterns
