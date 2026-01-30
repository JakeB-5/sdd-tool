# sdd git

Sets up Git workflow.

## Usage

```bash
sdd git <subcommand> [options]
```

## Subcommands

### hooks

Installs or removes Git hooks.

```bash
# Install hooks
sdd git hooks install

# Remove hooks
sdd git hooks uninstall
```

**Installed hooks:**

| Hook | Timing | Action |
|------|--------|--------|
| `pre-commit` | Before commit | Validate changed specs |
| `commit-msg` | After commit message | Validate message format |
| `pre-push` | Before push | Validate all specs |

### template

Installs the commit message template.

```bash
sdd git template install
```

The `.gitmessage` template is registered in Git configuration.

### setup

Sets up the entire Git workflow at once.

```bash
sdd git setup
```

**Setup includes:**
- Git hooks installation
- Commit message template installation
- `.gitignore.sdd` merge
- `.gitattributes.sdd` merge

## Options

| Option | Description |
|--------|-------------|
| `--help` | Show help |

## Examples

```bash
# Full setup (recommended)
sdd git setup

# Install hooks only
sdd git hooks install

# Remove specific hooks
sdd git hooks uninstall
```

## Related Documentation

- [Commit Convention](/guide/commit-convention)
- [Branch Strategy](/guide/branch-strategy)
- [CI/CD Setup](/guide/cicd-setup)
