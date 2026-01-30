# /sdd.start

The unified entry point for the SDD workflow.

## Usage

```
/sdd.start
```

## Behavior

Analyzes project status and guides you to the next action.

### New Project

When no Constitution exists:

```
Project has been initialized.
Next step: Define project principles with /sdd.constitution
```

### Existing Project

Provides a workflow selection menu:

```
Select an SDD workflow:

1. Add new feature -> /sdd.spec
2. Modify existing feature -> /sdd.spec
3. Validate specs -> /sdd.validate
4. Project status -> /sdd.status
```

## Output Information

- Project initialization status
- Constitution existence
- Number of specs
- In-progress tasks
- Recommended next steps

## Example

```
/sdd.start

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SDD Tool v1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: my-app
Constitution: ✓ (v1.0.0)
Specs: 5 (3 approved, 2 draft)

In-progress tasks:
- user-auth: implementing (3/5 complete)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next step: /sdd.implement user-auth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
