# /sdd-start

The entry point for the SDD workflow: checks the project setup, runs the setup wizard, then recommends the next skill.

## Usage

```
/sdd-start
```

In Codex, invoke it as `$sdd-start`. It takes no arguments.

## Behavior

Setup always comes first. No workflow (reverse extraction, new spec, ...) is suggested until the initial setup is complete.

### 1. Project analysis

The skill checks the project and shows the result as a table:

| Item | How it is checked |
|------|-------------------|
| SDD initialized | `.sdd/` directory exists |
| Spec files | Count of `.sdd/specs/**/*.md` files |
| Existing code | `src/`, `lib/` or `app/` exists |
| Git repository | `.git/` exists |
| Git hooks | `.git/hooks/pre-commit` exists |
| CI/CD | `.github/workflows/sdd-*.yml` exists |

### 2. Setup wizard

If `.sdd/`, the pre-commit hook or the CI workflow is missing, the skill asks which items to configure (multiple selections allowed) and runs each selected one immediately:

| Item | Command |
|------|---------|
| Initialize SDD | `sdd init --skip-git-setup` |
| Git hooks | `sdd git hooks install` |
| CI/CD | `sdd cicd setup github` |

### 3. Workflow guidance

Only after setup is complete does the skill recommend the next step:

| Project state | Recommended skill |
|---------------|-------------------|
| Existing code, no specs (brownfield) | `/sdd-reverse` |
| No existing code (greenfield) | `/sdd-spec` |
| Specs already exist | `/sdd-status` or `/sdd-implement` |

Brownfield is detected by source directories (`src/`, `lib/`, `app/`), few or no specs under `.sdd/specs/`, and project config files such as `package.json`. In that case `/sdd-reverse` scans the code and drafts specs, and you approve and finalize them; new features afterwards use `/sdd-spec`.

## Installed Git Hooks

| Hook | Trigger | Function |
|------|---------|----------|
| pre-commit | Before commit | When specs under `.sdd/specs/` are staged, run a full `sdd validate` |
| commit-msg | After writing the message | Require `<type>(<scope>): <message>` (the scope is optional) with a spec type (`spec`, `plan`, `tasks`, `constitution`, ...) or a Conventional Commits type (`feat`, `fix`, ...) |
| pre-push | Before push | Validate all specs |

## Generated GitHub Actions

| Workflow | Function |
|----------|----------|
| `sdd-validate.yml` | On push / PR to `main`, `master` or `develop` that touches `.sdd/**`: installs the pinned `sdd-tool@<version>`, then runs `sdd validate`, `sdd constitution validate` and `sdd impact report` (uploaded as an artifact) |
| `sdd-labeler.yml` | Add domain labels to PRs |

## Related Commands

- [`sdd init`](/cli/init) - Initialize a project
- [`sdd git`](/cli/git) - Git hooks
- [`sdd cicd`](/cli/cicd) - CI/CD workflows
- [`/sdd-spec`](/commands/sdd-spec) - Write specs
- [`/sdd-reverse`](/commands/sdd-reverse) - Draft specs from existing code
