# Multiple Spec Change Workflow

Workflow for changing multiple related specs together.

## When to Use

- **Breaking Changes**: One spec change affects other specs
- **Feature Bundle**: Develop multiple related specs together
- **Large-scale Refactoring**: Domain structure changes

---

## Overview

```
Create bundle branch → Write multiple specs → Impact analysis → Commit → PR → Review → Merge
```

---

## Step-by-Step Guide

### 1. Create Bundle Branch

```bash
git checkout main
git pull origin main
git checkout -b spec-bundle/payment-v2
```

**Naming convention**: `spec-bundle/<descriptive-name>`

### 2. Write Related Specs

```bash
# Create/modify multiple specs
sdd new billing/payment-gateway-v2
sdd new billing/refund-policy-v2

# Modify existing specs
# Edit .sdd/specs/billing/checkout/spec.md
# Edit .sdd/specs/billing/subscription/spec.md
```

### 3. Impact Analysis

```bash
# Check impact of changed specs
sdd impact billing/payment-gateway-v2

# Check all dependencies
sdd deps check

# Check for circular dependencies
sdd deps check --cycles
```

**Example output**:
```
📊 Impact Analysis: billing/payment-gateway-v2

Direct Impact:
  ├── billing/checkout (depends)
  ├── billing/subscription (depends)
  └── billing/invoice (references)

Indirect Impact:
  └── order/order-complete (via billing/checkout)

⚠️  Potential Breaking Changes: 3 specs
```

### 4. Commit per Spec

Separate each spec into individual commits:

```bash
# New spec commit
git add .sdd/specs/billing/payment-gateway-v2/
git commit -m "spec(billing/payment-gateway-v2): add new payment gateway specification

New PG integration spec:
- Stripe, Toss support
- Webhook handling definition
- Error recovery scenarios"

# Modified spec commit
git add .sdd/specs/billing/checkout/
git commit -m "spec-update(billing/checkout): update for payment-gateway-v2

Payment flow changes:
- Apply new PG interface
- Improve payment failure handling

Breaking-Spec: billing/invoice"

# Additional spec commit
git add .sdd/specs/billing/refund-policy-v2/
git commit -m "spec(billing/refund-policy-v2): add refund policy specification

Refund policy spec:
- Auto refund conditions
- Manual review cases
- Partial refund handling"
```

### 5. Final Validation

```bash
# Full validation
sdd validate

# Constitution compliance check
sdd validate --constitution

# Final dependency check
sdd deps check
```

### 6. Push & Create PR

```bash
git push -u origin spec-bundle/payment-v2

gh pr create \
  --title "spec-bundle: Payment System v2" \
  --body "$(cat <<EOF
## Overview
Complete overhaul of payment system

## Change Scope
### New
- billing/payment-gateway-v2: New PG integration
- billing/refund-policy-v2: Refund policy

### Modified
- billing/checkout: Payment flow changes
- billing/subscription: Billing cycle changes

### Impact
- billing/invoice: Invoice format change needed
- order/order-complete: Payment confirmation logic change needed

## Breaking Changes
- checkout spec payment_method field structure change
- subscription spec billing_cycle enum addition

## Migration Guide
See docs/migration/payment-v2.md

## Checklist
- [x] sdd validate passed
- [x] Impact analysis complete
- [x] Breaking Changes documented
- [ ] Affected team review
EOF
)"
```

### 7. Review

Bundle PRs require more careful review:

- **Affected teams**: Review by each domain owner
- **Architect**: Overall structure review
- **Breaking Changes**: Migration plan confirmation

### 8. Merge & Cleanup

```bash
# Merge (squash or merge commit)
gh pr merge --merge  # Preserving commit history recommended

# Cleanup
git checkout main
git pull
git branch -d spec-bundle/payment-v2
```

---

## Breaking Change Handling

### Identification

```bash
# Identify through impact analysis
sdd impact billing/payment-gateway --code

# Specify in footer
Breaking-Spec: billing/checkout, billing/invoice
```

### Documentation

```markdown
<!-- Include in PR body -->
## Breaking Changes

### billing/checkout
- `payment_method` field structure change
  - Before: `string`
  - After: `{ type: string, provider: string }`

### billing/subscription
- `billing_cycle` enum addition
  - New values: `WEEKLY`, `BIWEEKLY`
```

### Migration Guide

```bash
# Create migration document
mkdir -p docs/migration
```

```markdown
<!-- docs/migration/payment-v2.md -->
# Payment System v2 Migration

## Change Summary
...

## Migration Steps
1. Implement payment-gateway-v2 interface
2. Update checkout logic
3. Modify invoice generation logic
4. Migrate existing data

## Rollback Plan
...
```

---

## Best Practices

### Bundle Composition

- **Related specs only**: Include only logically connected specs
- **Appropriate size**: 3-7 specs recommended, split if too large
- **Clear scope**: Specify change scope in PR description

### Commit Strategy

- **Commit per spec**: Separate commits for each spec change
- **Logical order**: Commit in dependency order
- **Detailed messages**: Specify Breaking Changes

### Review Request

- **Early review**: Get feedback first with Draft PR
- **Assign owners**: Include affected domain owners
- **Sufficient time**: Allow extra time for complex changes

---

## Related Documentation

- [Single Spec Workflow](./workflow-single-spec.md)
- [Constitution Changes](./workflow-constitution.md)
- [Commit Convention](./commit-convention.md)
