# Single Spec Change Workflow

Workflow for creating or modifying a single spec.

## Overview

```
Create branch → Write spec → Validate → Commit → PR → Review → Merge
```

---

## Step-by-Step Guide

### 1. Create Branch

```bash
# Create new branch from main
git checkout main
git pull origin main
git checkout -b spec/auth/user-login
```

### 2. Write Spec

```bash
# Create new spec on the branch you just created
sdd new auth/user-login --no-branch

# Or modify existing spec
# Edit .sdd/specs/auth/user-login/spec.md
```

`sdd new` creates a missing domain automatically and, **unless you pass `--no-branch`**, creates and switches to
a `feature/<id>` branch of its own. Since step 1 already created the working branch, use `--no-branch` here (or skip
step 1 and let `sdd new` create the branch). Add `--all` to also write plan.md, tasks.md and checklist.md; existing
files are never overwritten without `--force`.

### 3. Local Validation

```bash
# Validate one spec (validate takes a path)
sdd validate .sdd/specs/auth/user-login/spec.md

# Full validation
sdd validate

# Constitution compliance check
sdd validate --constitution
```

### 4. Commit

```bash
# Check changed files
git status

# Stage
git add .sdd/specs/auth/user-login/

# Commit (follow convention)
git commit -m "spec(auth/user-login): add user login specification

Email/password based login spec:
- Input validation rules
- Session creation policy
- Failure scenarios defined

Depends-On: core/user-model"
```

### 5. Push

```bash
git push -u origin spec/auth/user-login
```

### 6. Create PR

```bash
# Using GitHub CLI
gh pr create \
  --title "spec(auth): user-login specification" \
  --body "## Overview
User login feature specification

## Changes
- New spec: auth/user-login

## Checklist
- [x] sdd validate passed
- [x] Dependencies specified
- [ ] Reviewer approval"
```

### 7. Review & Revise

Reflect review feedback:

```bash
# Make modifications
# Edit spec.md

# Re-validate
sdd validate .sdd/specs/auth/user-login/spec.md

# Additional commit
git add .
git commit -m "spec-update(auth/user-login): address review feedback

- Clarified REQ-003
- Modified scenario 2"

git push
```

### 8. Merge

After PR approval:

```bash
# Squash and merge on GitHub
# Or via CLI
gh pr merge --squash
```

### 9. Cleanup

```bash
# Delete local branch
git checkout main
git pull
git branch -d spec/auth/user-login
```

---

## Command Summary

```bash
# 1. Create branch
git checkout main && git pull
git checkout -b spec/auth/user-login

# 2. Write spec
sdd new auth/user-login --no-branch

# 3. Validate
sdd validate .sdd/specs/auth/user-login/spec.md

# 4. Commit & push
git add .sdd/specs/auth/user-login/
git commit -m "spec(auth/user-login): add user login specification"
git push -u origin spec/auth/user-login

# 5. Create PR
gh pr create --title "spec(auth): user-login"

# 6. After merge, cleanup
gh pr merge --squash
git checkout main && git pull
git branch -d spec/auth/user-login
```

---

## Best Practices

### Writing Specs

- **One spec = One feature**: Keep scope clear
- **Specify dependencies**: Use the frontmatter `depends` field (`depends: [core/user-model]`, `[]` for none); mentioning another spec in the body is not a dependency
- **GIVEN-WHEN-THEN**: Be specific with scenarios

### Commits

- **Small units**: Logical change units
- **Follow convention**: `spec(scope): message` format
- **Use body**: Explain reasons for changes

### Review

- **Self-validate**: Run `sdd validate` before PR
- **Include explanation**: Provide context in PR body
- **Quick response**: Respond promptly to feedback

---

## Troubleshooting

### Validation Failure

```bash
# Check errors
sdd validate .sdd/specs/auth/user-login/spec.md

# Common causes:
# - Missing uppercase SHALL/MUST/SHOULD keywords
# - Unfilled template placeholders ([요구사항 제목], {{...}})
# - GIVEN-WHEN-THEN format errors
# - Dependency spec doesn't exist
```

### Commit Hook Failure

```bash
# Check commit message format
# Correct format: spec(auth/user-login): message

# Bypass hook (not recommended)
git commit --no-verify
```

### Conflict Occurred

```bash
# Update main
git fetch origin
git rebase origin/main

# After resolving conflicts
sdd validate .sdd/specs/auth/user-login/spec.md
git add .
git rebase --continue
```

---

## Related Documentation

- [Commit Convention](./commit-convention.md)
- [Branch Strategy](./branch-strategy.md)
- [Multiple Spec Workflow](./workflow-bundle-spec.md)
