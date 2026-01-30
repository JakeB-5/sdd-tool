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
/sdd.constitution React-based todo management app
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
/sdd.spec Add todo feature
```

The AI will help you write the spec through conversation.

### Example Spec

```markdown
---
id: add-todo
title: "Add Todo"
status: draft
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
/sdd.plan
```

The AI will create a technical implementation plan.

## 6. Task Breakdown

```
/sdd.tasks
```

The AI will break down the work into executable task units.

## 7. Tool Check

```
/sdd.prepare
```

Verify and create necessary subagents and skills.

## 8. Implementation

```
/sdd.implement
```

The AI guides sequential TDD-style implementation:

1. Write tests
2. Implement code
3. Verify tests pass
4. Move to next task

## 9. Validation

```
/sdd.validate
```

Validate that the spec is correctly written.

## Complete!

Your first SDD-based feature is finished.

## Next Steps

- [Understanding Workflow](/guide/workflow)
- [Best Practices](/guide/best-practices)
