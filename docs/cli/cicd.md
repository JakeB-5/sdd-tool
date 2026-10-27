# sdd cicd

Sets up CI/CD pipeline integration.

## Usage

```bash
sdd cicd <subcommand> [options]
```

## Subcommands

### setup

Creates CI workflow files.

```bash
# GitHub Actions
sdd cicd setup github

# GitLab CI
sdd cicd setup gitlab

# All platforms
sdd cicd setup all
```

**Generated files:**

| Platform | File |
|----------|------|
| GitHub | `.github/workflows/sdd-validate.yml` |
| GitHub | `.github/workflows/sdd-labeler.yml` |
| GitLab | `.gitlab-ci-sdd.yml` |

### hooks

Sets up Git hooks (husky style).

```bash
sdd cicd hooks
sdd cicd hooks pre-commit
sdd cicd hooks --install
```

::: tip
If you prefer direct Git hooks, use `sdd git hooks install` instead.
:::

### check

Checks the project structure and validates every spec in the CI environment (the same checks as `sdd validate`).
Exits with code `2` (VALIDATION_FAILED) when validation fails.

```bash
sdd cicd check
sdd cicd check --strict
sdd cicd check --fail-on-warning
```

An unsupported platform or hook name is rejected with an error and no files are written.

## Options

### setup Options

| Option | Description |
|--------|-------------|
| `--strict` | Strict mode (treat warnings as errors) |

### check Options

| Option | Description |
|--------|-------------|
| `--strict` | Strict mode |
| `--fail-on-warning` | Fail on warnings |

## Examples

```bash
# Set up GitHub Actions
sdd cicd setup github

# Set up with strict mode
sdd cicd setup github --strict

# Validate in CI environment
sdd cicd check
```

## Workflow Contents

### sdd-validate.yml

```yaml
on:
  pull_request:
    paths:
      - '.sdd/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install -g sdd-tool
      - run: sdd validate
```

### sdd-labeler.yml

Automatically adds labels to PRs:
- `spec:<domain>` - Changed domain
- `constitution` - Constitution changes
- `spec:new` - New spec added
- `spec:update` - Spec modified
- `spec:remove` - Spec removed

## Related Documentation

- [CI/CD Setup Guide](/guide/cicd-setup)
- [Commit Convention](/guide/commit-convention)
- [Branch Strategy](/guide/branch-strategy)
