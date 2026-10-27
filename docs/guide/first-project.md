# First Project

This guide walks you through creating a simple todo management feature using SDD Tool.

## 1. Initialize Project

```bash
mkdir todo-app
cd todo-app
npm init -y
sdd init
```

## 2. Start Claude Code

```bash
claude
```

## 3. Write Constitution

Define the core principles of your project:

```
/sdd-constitution React-based todo management app
```

The AI will help you write the project principles through conversation.

### Example Constitution

```markdown
# Todo App Constitution

## Core Principles
- User experience is the top priority
- Must work offline

## Technical Principles
- Use React + TypeScript
- Store data in local storage

## Forbidden
- No external API dependencies
```

## 4. Write Feature Spec

```
/sdd-spec Add todo feature
```

The AI will help you write the spec through conversation. Behind the scenes it runs `sdd new <domain>/<feature> --all`,
which creates the domain if it is missing (`common` when you give none), switches to a `feature/<id>` git branch
(`--no-branch` skips that) and writes spec.md, plan.md, tasks.md and checklist.md. Existing files are never overwritten
without `--force`.

::: tip Codex
Everything in this guide works in Codex too: skills are invoked as `$sdd-spec`, `$sdd-plan`, ... instead of `/sdd-spec`, `/sdd-plan`, ...
:::

### Example Spec

```markdown
---
id: add-todo
title: "Add Todo"
status: draft
created: 2026-10-27
depends: []
---

# Add Todo

## Requirements

### REQ-01: Todo Input
- The system SHALL support todo text input
- Empty text SHALL be rejected

## Scenarios

### Scenario 1: Successful Todo Addition
- **GIVEN** the user is on the todo input form
- **WHEN** they enter "Buy milk" and click the add button
- **THEN** "Buy milk" is added to the todo list
```

## 5. Implementation Plan

```
/sdd-plan
```

The AI will edit the plan.md that `sdd new --all` already created into a technical implementation plan.

## 6. Task Breakdown

```
/sdd-tasks
```

The AI will fill in the tasks.md that was already created, breaking the work into executable task units. Each task is a
`### add-todo-task-001: Title` heading followed by `**상태:**` (status), `**우선순위:**`, `**설명:**` and `**의존성:**` lines.

## 7. Tool Check

```
/sdd-prepare
```

Verify and create necessary subagents and skills.

## 8. Implementation

```
/sdd-implement
```

The AI guides sequential, test-first implementation:

1. Set the task to in progress: `sdd new task add-todo add-todo-task-001 in-progress`
2. Write a failing test (reference the requirement with `@spec <domain>/add-todo#REQ-01`)
3. Implement code until the test passes
4. Mark the task done: `sdd new task add-todo add-todo-task-001 completed`
5. Move to next task

`sdd new task` also recounts the progress block and the `completed:` / `total:` fields in tasks.md.

## 9. Validation

```
/sdd-validate
```

Validate that the spec is correctly written, then check traceability and close the spec:

```bash
sdd validate
sdd sync                              # every REQ-xx should be referenced by code or a test
sdd new status add-todo implemented   # spec status: draft → ... → implemented
```

## Complete!

Your first SDD-based feature is finished.

## Next Steps

- [Understanding Workflow](/guide/workflow)
- [Best Practices](/guide/best-practices)
