# Branch Strategy

Recommended Git branch strategy for SDD projects.

## Branch Structure

```
main (or master)
  │
  ├── spec/auth/user-login        # Individual spec work
  ├── spec/billing/subscription
  │
  ├── spec-bundle/q1-features     # Related specs bundle
  │
  └── constitution/v2.0           # Constitution changes
```

---

## Branch Naming Conventions

### Patterns

| Pattern | Purpose | Example |
|---------|---------|---------|
| `spec/<domain>/<name>` | Individual spec | `spec/auth/user-login` |
| `spec-bundle/<name>` | Spec bundle | `spec-bundle/payment-v2` |
| `constitution/<version>` | Constitution | `constitution/v2.0` |
| `sdd-infra/<name>` | SDD config/structure | `sdd-infra/add-billing-domain` |

### Rules

- Use **lowercase letters** only
- Use **hyphens** (`-`) to separate words
- Use **slashes** (`/`) to separate hierarchy
- Concise and **descriptive** names

### Examples

```bash
# Good examples
spec/auth/user-login
spec/billing/subscription-management
spec-bundle/payment-system-v2
constitution/v2.0

# Examples to avoid
spec/UserLogin          # Uppercase
spec_auth_login         # Underscore
spec/auth/login/oauth   # Too deep hierarchy
```

---

## Workflow

### Basic Flow

```
1. Create branch
   main ──→ spec/auth/user-login

2. Write spec & review
   Work on spec/auth/user-login
   Create PR → Review → Approve

3. Merge
   spec/auth/user-login ──→ main
   (squash merge recommended)

4. Delete branch
   Delete spec/auth/user-login
```

### Creating Branches

```bash
# Individual spec
git checkout -b spec/auth/user-login

# Spec bundle (multiple related specs)
git checkout -b spec-bundle/payment-v2

# Constitution change
git checkout -b constitution/v2.0

# SDD config change
git checkout -b sdd-infra/add-billing-domain
```

### Merging

```bash
# Squash merge recommended (clean history)
git checkout main
git merge --squash spec/auth/user-login
git commit

# Or use Squash and merge on GitHub PR
```

---

## Protection Rules

### main Branch

```yaml
# GitHub Branch Protection
main:
  # Required reviews
  required_reviews: 2
  dismiss_stale_reviews: true

  # Required status checks
  required_status_checks:
    - sdd-validate
    - sdd-lint

  # No direct push
  allow_force_push: false
  allow_deletions: false
```

### spec/* Branches

```yaml
# Spec branches are flexible
spec/*:
  required_reviews: 0    # No review required during work
  allow_force_push: true # Allow history cleanup
```

### constitution/* Branches

```yaml
# Constitution is strict
constitution/*:
  required_reviews: 3           # More reviewers
  required_reviewers:
    - tech-leads
    - architects
  allow_force_push: false
```

---

## GitHub Setup

### Branch Protection Rules

1. **Settings** → **Branches** → **Add rule**
2. **Branch name pattern**: `main`
3. Set options:
   - Require a pull request before merging
   - Require approvals (2)
   - Dismiss stale pull request approvals
   - Require status checks to pass
   - Require branches to be up to date

### Adding Status Checks

1. **Settings** → **Branches** → Edit `main` rule
2. Enable "Require status checks to pass"
3. Add checks:
   - `sdd-validate`
   - `sdd-lint` (if available)

---

## Branch-Specific Recommendations

### spec/* (Individual Spec)

- **Lifespan**: Short (1-3 days)
- **Commits**: Freely, squash at the end
- **Review**: Conducted in PR
- **After merge**: Delete

```bash
# Start work
git checkout -b spec/auth/mfa-setup

# During work (multiple commits OK)
git commit -m "wip: mfa draft"
git commit -m "wip: add scenarios"
git commit -m "wip: organize requirements"

# After PR creation, squash merge
```

### spec-bundle/* (Spec Bundle)

- **Lifespan**: Medium (1-2 weeks)
- **Purpose**: Work on multiple related specs together
- **Commits**: Separate by spec
- **Review**: Review entire bundle

```bash
# When there are Breaking Changes
git checkout -b spec-bundle/payment-v2

# Work on related specs
git commit -m "spec(billing/payment-gateway-v2): add new PG spec"
git commit -m "spec-update(billing/checkout): update payment flow"
git commit -m "spec(billing/refund-v2): add refund policy"
```

### constitution/* (Constitution)

- **Lifespan**: Medium (review period)
- **Purpose**: Project principle changes
- **Commits**: Carefully
- **Review**: Entire team required

```bash
# Constitution change
git checkout -b constitution/v2.0

# Make changes and update version
# Modify constitution.md

# Impact analysis
sdd validate --constitution

# Detailed commit message
git commit -m "constitution: v2.0 - add API design principles

New principles:
- API response format standardization (MUST)
- Error code system (MUST)
- Version management policy (SHOULD)

Breaking: 12 existing API specs need updates"
```

---

## Conflict Resolution

### Spec File Conflicts

Spec files should be **resolved manually** as a rule.

```bash
# When conflict occurs
git merge main
# CONFLICT in .sdd/specs/auth/user-login/spec.md

# Resolve manually
# 1. Open file and check conflict markers
# 2. Merge content (semantically)
# 3. Validate
sdd validate auth/user-login

# Complete resolution
git add .sdd/specs/auth/user-login/spec.md
git commit
```

### Constitution Conflicts

Constitution conflicts must be resolved **after team discussion**.

```bash
# When conflict occurs
# 1. Team discussion
# 2. Modify with agreed content
# 3. Full validation
sdd validate --constitution
```

---

## Automation

### Branch Creation Helper

```bash
# Create branch with SDD CLI (future support)
sdd branch spec auth/user-login
# → git checkout -b spec/auth/user-login

sdd branch constitution v2.0
# → git checkout -b constitution/v2.0
```

### Auto-Delete After Merge

Set up auto-delete on GitHub:
1. **Settings** → **General**
2. **Automatically delete head branches**

---

## Related Documentation

- [Commit Convention](./commit-convention.md)
- [Single Spec Workflow](./workflow-single-spec.md)
- [Multiple Spec Workflow](./workflow-bundle-spec.md)
- [Constitution Changes](./workflow-constitution.md)
