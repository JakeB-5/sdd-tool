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

Writes the hook scripts to `.husky/` (`pre-commit` and `pre-push`, or only the one you name). With `--install` it also
prints the husky installation steps first (`npm install -D husky`, `npx husky init`); it does not run them. Install
husky yourself for the scripts to take effect.

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
  push:
    branches: [main, master, develop]
    paths: ['.sdd/**']
  pull_request:
    branches: [main, master, develop]
    paths: ['.sdd/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g sdd-tool@2.1.0   # pinned to the version that generated the file
      - run: sdd validate
      - run: sdd constitution validate
      - run: sdd impact report --json > impact-report.json   # uploaded as an artifact
```

The install step pins `sdd-tool@<version>` of the CLI that ran `sdd cicd setup` (the same applies to the GitLab file
and the workflows written by `sdd init`); change the version when you upgrade. The generated workflows run
`sdd validate` only; add `sdd sync --ci --threshold 80` yourself if CI should gate on spec-code traceability
(it exits with code 2 below the threshold, see [sdd sync](/cli/sync)).

### sdd-labeler.yml

Automatically adds labels to PRs (the workflow declares `permissions`: `contents: read`, `pull-requests: write`,
`issues: write`):
- `spec:<domain>` - Changed domain
- `constitution` - Constitution changes

## Related Documentation

- [CI/CD Setup Guide](/guide/cicd-setup)
- [Commit Convention](/guide/commit-convention)
- [Branch Strategy](/guide/branch-strategy)
