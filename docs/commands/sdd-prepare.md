# /sdd.prepare

Check the subagents and skills needed for implementation.

## Usage

```
/sdd.prepare [feature-id]
```

## Arguments

| Argument | Description |
|----------|-------------|
| feature-id | Feature ID (defaults to most recently written spec if omitted) |

## Behavior

1. Analyze tasks.md
2. Detect required tools
3. Check existence
4. Suggest creating missing tools

## Detection Keywords

| Keyword | Subagent | Skill |
|---------|----------|-------|
| test | test-runner | test |
| api, rest | api-scaffold | gen-api |
| component | component-gen | gen-component |
| database | - | db-migrate |
| doc | - | gen-doc |
| review | code-reviewer | review |

## Example

```
/sdd.prepare user-auth

AI: Analyzing user-auth tasks to check required tools.

    Required tools:
    ✓ test-runner (exists)
    ✗ api-scaffold (missing)

    Create api-scaffold subagent? [Y/n]
```

## Generated Tools

### Subagents

```
.claude/agents/api-scaffold.md
```

### Skills

```
.claude/skills/gen-api/SKILL.md
```

## Check Report

```
.sdd/specs/<feature-id>/prepare.md
```

```markdown
# Tool Check Results

## Analyzed Tasks
- T3: Password hashing utility -> test needed
- T4: JWT service -> test needed
- T5: Login service -> api, test needed

## Required Tools

| Tool | Type | Status |
|------|------|--------|
| test-runner | agent | ✓ exists |
| api-scaffold | agent | ✗ created |
| test | skill | ✓ exists |
```

## Next Steps

After tool check:

```
/sdd.implement  -> Start implementation
```
