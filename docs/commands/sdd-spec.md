# /sdd.spec

Create or modify feature specifications. (Unified entry point)

## Overview

`/sdd.spec` automatically determines whether you're writing a new feature (`/sdd.new`) or modifying an existing spec (`/sdd.change`), and guides you to the appropriate workflow.

## Usage

```
/sdd.spec [feature description]
```

## Arguments

| Argument | Description |
|----------|-------------|
| feature description | Description of the feature to create or modify |

## Behavior

1. Confirm domain name and feature name
2. Check if `.sdd/specs/<domain>/<feature-id>/spec.md` exists
3. **Automatic branching**:
   - If spec doesn't exist -> New feature creation workflow
   - If spec exists -> Branch based on change scope

### New Feature (No existing spec)

```bash
sdd new <domain>/<feature-id> --all
```

- Creates `.sdd/specs/<domain>/<feature-id>/` directory
- Creates `spec.md`, `plan.md`, `tasks.md`
- Writes specification using RFC 2119 keywords and GIVEN-WHEN-THEN format

### Modify Existing (Spec exists)

**Small modifications** (typos, wording fixes, adding 1-2 requirements):
- Directly edit the `spec.md` file
- Validate with `sdd validate`

**Large changes** (multiple requirement changes, structural changes, deletions):
- Create change proposal in `.sdd/changes/CHG-xxx.md`
- Review -> Approve -> Apply workflow

## Change Scope Criteria

| Scope | Example | Recommended Approach |
|-------|---------|---------------------|
| Small | Typo fixes, wording improvements | Direct edit |
| Medium | Adding 1-2 requirements | Direct edit |
| Large | Changing 3+ requirements | Change proposal |
| Large | Deleting existing requirements | Change proposal |
| Large | Structural scenario changes | Change proposal |

## Examples

### Creating a New Feature

```
/sdd.spec user authentication feature

AI: Checking .sdd/specs/...
    -> auth/user-auth spec not found.
    -> Creating as new feature.

    I have a few questions:
    1. What authentication method will you use? (JWT, session, OAuth)
    2. Do you need social login?
```

### Modifying an Existing Spec

```
/sdd.spec add social login to authentication

AI: Checking .sdd/specs/...
    -> auth/login/spec.md exists.
    -> Checking change scope.

    Adding 1 requirement, so editing directly.
    Adding REQ-03: Social Login to spec.md...
```

## Generated Files

For new features:

```
.sdd/specs/<domain>/<feature-id>/
├── spec.md    # Feature specification
├── plan.md    # Implementation plan
└── tasks.md   # Task breakdown
```

## Next Steps

- After creating new spec: `/sdd.plan` -> `/sdd.tasks` -> `/sdd.implement`
- After modifying spec: `sdd validate` -> commit

## Related Commands

| Command | Description |
|---------|-------------|
| `/sdd.plan` | Create implementation plan |
| `/sdd.tasks` | Task breakdown |
| `/sdd.validate` | Spec validation |
| `/sdd.impact` | Change impact analysis |
