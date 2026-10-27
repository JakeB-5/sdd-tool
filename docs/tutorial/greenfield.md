# Getting Started with Greenfield Projects

A tutorial for starting new projects with the SDD methodology.

## Overview

A greenfield project is one that starts from scratch. By applying SDD from the beginning, you can create a high-quality codebase where specifications and implementation stay aligned.

> **Note**: This tutorial is based on an interactive workflow using slash commands in Claude Code.

## Scenario

Let's create a simple todo management API.

## Step 1: Project Initialization

### Create Project

```bash
mkdir todo-api
cd todo-api
npm init -y
```

### SDD Initialization

Run the `sdd init` command in your terminal:

```bash
sdd init
```

Output (the CLI prints Korean; abridged):

```
✓ SDD 프로젝트가 초기화되었습니다.

ℹ 생성된 구조:
• .sdd/
  • constitution.md
  • specs/
  • changes/
  • archive/
  • templates/
• .claude/ (Claude Code)
  • skills/ (30개)
  • agents/ (3개)
• .agents/skills/ (Codex 스킬 30개)
• .codex/agents/ (Codex 서브에이전트 3개)
• AGENTS.md (SDD 워크플로우 지침 블록)
• CLAUDE.md (AGENTS.md import)

ℹ 다음 단계:
• constitution.md를 수정하여 프로젝트 원칙을 정의하세요
• /sdd-spec (Codex: $sdd-spec) 으로 첫 번째 기능 명세를 작성하세요
```

Generated structure:

```
todo-api/
├── .sdd/
│   ├── constitution.md     # Project principles
│   ├── specs/              # Spec repository
│   ├── changes/            # Change proposals
│   ├── archive/            # Archive
│   └── templates/          # Templates
├── AGENTS.md               # AI guidelines (sdd:begin/end block)
├── CLAUDE.md               # Imports @AGENTS.md
├── .claude/
│   ├── skills/             # 30 sdd-* skills
│   └── agents/             # sdd-* subagents
├── .agents/skills/         # Codex skills
├── .codex/agents/          # Codex subagents
└── package.json
```

### Start in Claude Code

Now open the project in Claude Code (or Codex) and run `/sdd-start` (`$sdd-start`):

```
/sdd-start
```

`/sdd-start` checks the setup (`.sdd/`, Git hooks, CI workflow, existing source). Missing items go through a setup wizard
(`sdd init`, `sdd git hooks install`, `sdd cicd setup github`); only then does it recommend the next skill. With no
existing code and no specs (this project) that is `/sdd-spec`; define the principles first with `/sdd-constitution`.

## Step 2: Define Project Constitution

```
/sdd-constitution
```

Claude will interactively establish project principles:

```
Constitution Setup

Project name: todo-api
Version: 1.0.0

Define core principles:

1. Tech Stack:
   -> TypeScript, Express, Prisma

2. Code Principles:
   -> Functions follow single responsibility principle
   -> Errors are handled explicitly
   -> All public APIs require tests

3. Naming Conventions:
   -> Files: kebab-case
   -> Functions: camelCase
   -> Types: PascalCase

Constitution saved: .sdd/constitution.md
```

## Step 3: Domain Design

### Identify Domains

Design the main domains for the todo API:

```
/sdd-domain
```

Design domains through conversation with Claude:

```
User: Design the domains needed for a todo API

Claude: Domain Design

I suggest the following domains for the todo API:

1. core
   Description: Common utilities and types
   Path: src/core/

2. todo
   Description: Todo CRUD operations
   Path: src/todo/
   Dependencies: core

3. user (optional)
   Description: User management
   Path: src/user/
   Dependencies: core

Create these domains? [Y/n]
```

Once approved, domains are created:

```
Domain creation complete

- core: src/core/
- todo: src/todo/ (depends: core)

domains.yml has been updated.
```

## Step 4: Write First Spec

### Create New Spec

```
/sdd-spec Create todo functionality
```

Claude will interactively write the spec:

```
Writing new spec: todo/create-todo

Please provide more details about the functionality:
- What data is needed?
- What validations are required?
- What are the error cases?

User: Title is required (1-200 chars), description is optional, due date is optional.
      Error if title is missing or exceeds 200 chars.

Claude: Spec Draft

## todo/create-todo

Creates a new todo item.

### REQ-01: Create a todo

The system SHALL create a todo from a title (1-200 chars), an optional description and an optional due date.

### REQ-02: Reject invalid titles

The system SHALL reject a missing or over-long title with a 400 error.

### Scenario 1: Successful creation (REQ-01)

- **GIVEN** valid todo data (title: "Test", description: "Description")
- **WHEN** a create request is sent
- **THEN** a new todo is created and its ID is returned

### Scenario 2: Missing title (REQ-02)

- **GIVEN** data without a title
- **WHEN** a create request is sent
- **THEN** a 400 error (TITLE_REQUIRED) is returned

### Scenario 3: Title too long (REQ-02)

- **GIVEN** a title with 201+ characters
- **WHEN** a create request is sent
- **THEN** a 400 error (TITLE_TOO_LONG) is returned

The spec depends on `core/validation` (frontmatter `depends: [core/validation]`).

### Contract

Input:
  interface CreateTodoInput {
    title: string;        // 1-200 chars, required
    description?: string; // optional
    dueDate?: Date;       // optional
  }

Output:
  interface Todo {
    id: string;
    title: string;
    description?: string;
    dueDate?: Date;
    completed: boolean;
    createdAt: Date;
  }

Save this spec? [Y/n]
```

When saved:

```
Spec saved

File: .sdd/specs/todo/create-todo/spec.md
Status: draft
Domain: todo

Next steps:
- Write additional specs with /sdd-spec
- Create implementation plan with /sdd-plan
```

## Step 5: Add Related Specs

Write the remaining specs:

```
/sdd-spec Input validation utility
```

```
/sdd-spec Get todo
/sdd-spec Update todo
/sdd-spec Delete todo
/sdd-spec List todos
```

For each spec, define scenarios and contracts through conversation with Claude.

## Step 6: Validate Specs

```
/sdd-validate
```

The skill runs `sdd validate`, which checks format (frontmatter, uppercase RFC 2119 keywords, GIVEN-WHEN-THEN
scenarios, leftover placeholders, constitution version). Output with all six specs filled in (Korean; abridged):

```
✓ core/validation/spec.md
✓ todo/create-todo/spec.md
✓ todo/delete-todo/spec.md
✓ todo/get-todo/spec.md
✓ todo/list-todos/spec.md
✓ todo/update-todo/spec.md

결과: 6개 통과, 0개 실패
```

Dependencies are declared in each spec's frontmatter `depends` (for example `depends: [core/validation]` in create-todo
and update-todo); `sdd impact core/validation` lists the specs that depend on it.

## Step 7: Implementation Plan

```
/sdd-plan create-todo
```

Claude will write the implementation plan:

```
Implementation Plan: create-todo

## Overview
Implement todo creation using TDD methodology.

## Dependencies
- validation (must be implemented first)

## Implementation Order

1. Type definitions
   - CreateTodoInput interface
   - Todo interface

2. Validation logic
   - validateTitle() function
   - Utilize core/validation

3. Business logic
   - createTodo() function
   - ID generation, timestamp addition

4. API endpoint
   - POST /todos
   - Request/response mapping

## Expected Files
- src/todo/types.ts
- src/todo/create-todo.ts
- src/todo/create-todo.test.ts
- src/todo/routes.ts

Save this plan? [Y/n]
```

## Step 8: Task Breakdown

```
/sdd-tasks create-todo
```

```
Task Breakdown: create-todo (written to .sdd/specs/todo/create-todo/tasks.md)

### create-todo-task-001: Type definitions
- **상태:** 대기
- **우선순위:** 🔴 HIGH
- **설명:** CreateTodoInput and Todo interfaces
- **의존성:** 없음

### create-todo-task-002: Write failing tests (Red)
- **상태:** 대기
- **우선순위:** 🔴 HIGH
- **설명:** Successful creation, missing title, title too long (REQ-01, REQ-02)
- **의존성:** create-todo-task-001

### create-todo-task-003: Validation and business logic (Green)
- **상태:** 대기
- **우선순위:** 🔴 HIGH
- **설명:** validateTitle (core/validation) and createTodo
- **의존성:** create-todo-task-002

### create-todo-task-004: Refactor and API endpoint
- **상태:** 대기
- **우선순위:** 🟡 MEDIUM
- **설명:** Code cleanup and POST /todos route
- **의존성:** create-todo-task-003
```

Each task is a `### <feature>-task-NNN: Title` heading with a `**상태:**` line (`대기`, `진행 중`, `완료`, `차단됨`; English
`pending`, `in-progress`, `completed`, `blocked` are accepted too). The progress block and the `total:` / `completed:`
frontmatter are kept up to date by `sdd new task`.

## Step 9: Implementation

```
/sdd-implement create-todo
```

Claude will implement using TDD methodology:

```
Starting implementation: create-todo

$ sdd new task todo/create-todo create-todo-task-001 in-progress

## Task 1/4: Type definitions

src/todo/types.ts:

  export interface CreateTodoInput {
    title: string;
    description?: string;
    dueDate?: Date;
  }

  export interface Todo {
    id: string;
    title: string;
    description?: string;
    dueDate?: Date;
    completed: boolean;
    createdAt: Date;
  }

Type definitions complete

$ sdd new task todo/create-todo create-todo-task-001 completed

## Task 2/4: Write failing tests

$ sdd new task todo/create-todo create-todo-task-002 in-progress

src/todo/create-todo.test.ts:

  import { describe, it, expect } from 'vitest';
  import { createTodo } from './create-todo';

  // @spec todo/create-todo#REQ-01, todo/create-todo#REQ-02
  describe('createTodo', () => {
    it('creates a todo with valid data', () => {
      const input = { title: 'Test todo' };
      const result = createTodo(input);

      expect(result.title).toBe('Test todo');
      expect(result.completed).toBe(false);
      expect(result.id).toBeDefined();
    });

    it('throws error when title is missing', () => {
      expect(() => createTodo({ title: '' }))
        .toThrow('TITLE_REQUIRED');
    });

    it('throws error when title exceeds 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      expect(() => createTodo({ title: longTitle }))
        .toThrow('TITLE_TOO_LONG');
    });
  });

Running tests... 3/3 failed (as expected)

## Task 3/4: Implementation...
```

When all tasks are completed, finish the spec from the terminal. `sdd status` does not change the spec status
automatically; it suggests this step:

```bash
sdd validate
sdd sync todo/create-todo     # REQ-01 and REQ-02 are referenced by the tests: 100%
sdd new status todo/create-todo implemented
# ✅ todo/create-todo 스펙 상태: draft → implemented
```

```
Implementation complete: create-todo

Tests: 3/3 passed
Files:
  - src/todo/types.ts
  - src/todo/create-todo.ts
  - src/todo/create-todo.test.ts

Spec status: draft -> implemented

Next tasks:
- Implement other specs with /sdd-implement
- Ask "What should I implement next?" -> Claude will recommend the next spec based on status and dependencies
```

## Step 10: Iteration

Implement remaining specs the same way:

```
What should I implement next?
```

Claude checks spec status and dependencies:

```
Next Implementation Recommendation

Based on dependency order:

1. validation (no dependencies)
   - create-todo, update-todo depend on it

2. get-todo (after validation)
   - Simple query, quick to implement

3. list-todos (after get-todo)
   - Includes pagination

Recommendation: Implement validation first.
Say "Implement validation" to proceed.
```

## Check Progress

```
/sdd-status
```

The skill runs `sdd status`. After the first two specs are implemented and a third is started (Korean; abridged):

```
📋 기능 목록:
   ✅ validation (core/validation)
   ✅ create-todo (todo/create-todo) — 작업 3/3
   📝 delete-todo (todo/delete-todo)
   🔨 get-todo (todo/get-todo) — 작업 0/3
   📝 list-todos (todo/list-todos)
   📝 update-todo (todo/update-todo)

💡 다음 단계:
   todo/delete-todo: 명세 완성 후 계획 작성 — sdd new plan todo/delete-todo (Claude Code /sdd-plan · Codex $sdd-plan)
   todo/get-todo: 명세 완성 후 계획 작성 — sdd new plan todo/get-todo (Claude Code /sdd-plan · Codex $sdd-plan)
   ...
```

Icons follow the spec status (📝 draft, 🔨 implementing, ✅ implemented); `— 작업 n/m` counts completed tasks.
The next step is computed per feature from its files, status and task progress.

## Check Domain Graph

```
/sdd-domain graph
```

`sdd domain graph` prints the domain dependency graph (Mermaid by default):

```mermaid
graph LR
  core["Common utilities and types"]
  todo["Todo CRUD operations"]
  todo -->|uses| core
```

For spec-level dependencies use `sdd impact <spec> --graph`.

## Next Steps

- [Spec Writing Guide](/spec-writing/)
- [Workflow Guide](/guide/workflow)
- [CI/CD Setup](/guide/cicd-setup)

## Summary

1. Initialize project with `sdd init` (CLI)
2. Check project status with `/sdd-start` (Claude Code)
3. Define principles with `/sdd-constitution`
4. Design domains with `/sdd-domain`
5. Write specs with `/sdd-spec`
6. Validate with `/sdd-validate`
7. Plan with `/sdd-plan`, `/sdd-tasks`
8. Implement with TDD using `/sdd-implement`
9. Track progress with `/sdd-status`
