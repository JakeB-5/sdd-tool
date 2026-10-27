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
| `pre-commit` | Before commit | When files under `.sdd/specs/` are staged, run `sdd validate` (all specs) |
| `commit-msg` | After commit message | Validate the first line: `<type>(<scope>): <message>` ([Commit Convention](/guide/commit-convention)) |
| `pre-push` | Before push | Validate all specs |

Hooks are POSIX-sh scripts. `uninstall` only removes hooks carrying the SDD marker, `--force` replaces an existing
hook (the original is backed up once), and hooks outside the repository (`core.hooksPath`) are refused.

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
- Commit message template (`.gitmessage`) installation

## Options

| Option | Description |
|--------|-------------|
| `-f, --force` | Overwrite existing hooks / configuration (`sdd git hooks install`, `sdd git setup`) |
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
