# /sdd-plan

Write the implementation plan (`plan.md`) for an existing spec.

## Usage

```
/sdd-plan <feature>      # Claude Code
$sdd-plan <feature>      # Codex
```

## Arguments

| Argument | Description |
|----------|-------------|
| feature | `<domain>/<feature>` (e.g. `auth/login`) or the feature name when it is unique in the project (e.g. `login`) |

## Behavior

1. Browse `.sdd/specs/` to identify the feature you want to plan
2. Read the feature's `spec.md` and analyze its requirements
3. Write the plan in the feature's `plan.md`:
   - A feature created with `--all` (the `/sdd-spec` default) already has `plan.md`: the skill edits it in place and does not re-run `sdd new plan`
   - Only if it is missing, it runs `sdd new plan <feature>` to generate the template
   - `--force` regenerates the file from scratch and discards its content; it is used only when you ask
4. Optionally records the stage: `sdd new status <feature> planned`

## Plan Authoring Rules

- State each technical decision and its rationale
- Divide the work into clearly defined implementation phases
- List expected deliverables for each phase
- Include a risk analysis and mitigation strategies
- Define a testing strategy

## Target File

```
.sdd/specs/<domain>/<feature>/plan.md
```

## Plan Structure

```markdown
## Technical Decisions
### Decision 1: [Title]
**Rationale:** [Why this technology or approach was chosen]

## Implementation Phases
### Phase 1: Foundation
[Description]
**Deliverables:**
- [ ] Deliverable 1
- [ ] Deliverable 2

### Phase 2: Core Logic
[Description]
**Deliverables:**
- [ ] Deliverable 1

## Risk Analysis
| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| [risk] | High/Medium/Low | [strategy] |

## Testing Strategy
[Describe unit, integration, and e2e coverage approach]
```

## Example

```
/sdd-plan auth/login

AI: Reading .sdd/specs/auth/login/spec.md (3 requirements).
    Editing the existing plan.md:
    - Decision: bcrypt for password hashing, JWT in httpOnly cookies
    - Phase 1: data model / Phase 2: auth service / Phase 3: API endpoints
    - Risk: token theft (High) -> short expiry + refresh token
    - Testing: unit tests per REQ, integration test for the login endpoint
    $ sdd new status auth/login planned
```

## Next Steps

After creating the plan, decompose the work into tasks:

```
/sdd-tasks <feature>  -> Task breakdown
```

## Related Commands

- [`sdd new`](/cli/new) - `sdd new plan` and `sdd new status`
- [`/sdd-spec`](/commands/sdd-spec) - Spec authoring
- [`/sdd-tasks`](/commands/sdd-tasks) - Task breakdown
