# CI/CD Setup Guide

How to integrate CI/CD with your SDD project.

## Quick Start

```bash
# GitHub Actions setup
sdd cicd setup github

# Files created:
# .github/workflows/sdd-validate.yml
# .github/workflows/sdd-labeler.yml
```

---

## GitHub Actions

### Automatic Setup

```bash
sdd cicd setup github
```

### Generated Workflows

#### 1. sdd-validate.yml

Automatically validates specs on PR and push.

**Triggers**:
- Changes to `.sdd/` directory
- main, master, develop branches

**Actions**:
- Spec validation (`sdd validate`)
- Constitution validation
- Impact report generation

#### 2. sdd-labeler.yml

Automatically adds labels to PRs.

**Label types**:
- `spec:domain-name` - Changed domain
- `constitution` - Constitution changes
- `spec:new` - New spec added
- `spec:update` - Spec modified
- `spec:remove` - Spec deleted

### Manual Setup

To create workflows manually:

```yaml
# .github/workflows/sdd-validate.yml
name: SDD Validate

on:
  pull_request:
    paths:
      - '.sdd/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install SDD
        run: npm install -g sdd-tool

      - name: Validate Specs
        run: sdd validate --ci
```

### Customization

#### Strict Mode

```bash
sdd cicd setup github --strict
```

Treats warnings as errors.

#### Adding Notifications

```yaml
# Slack notification on failure
- name: Notify Slack on Failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {"text": "SDD validation failed: ${{ github.event.pull_request.html_url }}"}
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## GitLab CI

### Automatic Setup

```bash
sdd cicd setup gitlab
```

### Generated File

`.gitlab-ci-sdd.yml` file is created.

Include it in your existing `.gitlab-ci.yml`:

```yaml
# .gitlab-ci.yml
include:
  - local: '.gitlab-ci-sdd.yml'
```

---

## Status Check Setup

### Connect to GitHub Branch Protection

1. Settings → Branches → Edit main rule
2. Enable "Require status checks to pass"
3. Search for `Validate Specs`
4. Add check

Now PR merging requires spec validation to pass.

### Required Checks List

| Check Name | Description | Recommended |
|------------|-------------|-------------|
| `Validate Specs` | Spec validation | Required |
| `Add Labels` | Label addition | Optional |

---

## Git Hooks Integration

To run validation locally:

```bash
# Install Git hooks
sdd git hooks install
```

### Hook Types

| Hook | Timing | Validation |
|------|--------|------------|
| `pre-commit` | Before commit | Validates only changed specs |
| `commit-msg` | After commit message | Validates message format |
| `pre-push` | Before push | Validates all specs |

---

## CI Environment Check

Check if running in CI environment:

```bash
# Run in CI environment (simplified output)
sdd validate --ci

# CI check
sdd cicd check
sdd cicd check --strict
```

---

## Troubleshooting

### "Status check not found"

If status check is not visible:

1. Workflow must run at least once
2. Create PR with `.sdd/` path changes
3. Check workflow file name

### Validation Failure

```bash
# Validate locally first
sdd validate

# Verbose output
sdd validate --verbose
```

### Permission Error

If label addition fails in GitHub Actions:

1. Settings → Actions → General
2. "Workflow permissions" section
3. Select "Read and write permissions"

---

## Related Documentation

- [Commit Convention](./commit-convention.md)
- [Branch Strategy](./branch-strategy.md)
- [Git Hooks Setup](/cli/git)
