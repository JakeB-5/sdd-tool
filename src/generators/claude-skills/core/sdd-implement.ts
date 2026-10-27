/**
 * sdd-implement skill definition — execute tasks sequentially with TDD discipline.
 */
import type { SkillDefinition } from '../types.js';

export const sddImplementSkill: SkillDefinition = {
  name: 'sdd-implement',
  description:
    "Implement a feature's tasks.md one task at a time with TDD (red, green, refactor) and per-task commits. Use when tasks are ready and the user wants to start or continue implementing a spec.",
  argumentHint: '<feature-id>',
  allowedTools: [
    'Read',
    'Write',
    'Edit',
    'Glob',
    'Grep',
    'Bash(npm *)',
    'Bash(pnpm *)',
    'Bash(yarn *)',
    'Bash(git *)',
    'Bash(sdd status*)',
    'Bash(sdd validate*)',
    'Bash(sdd sync*)',
    'Bash(sdd new task *)',
    'Bash(sdd new status *)',
    'WebFetch',
  ],
  content: `# SDD Implement

## Instructions

1. Run \`sdd status\` to review current progress
2. Read the feature's \`spec.md\` and \`tasks.md\`; pick the first task that is not completed and whose dependencies are completed
3. Implement it with the workflow below, strictly test-first

## Implementation Rules

- Work on one task at a time
- Tests come first: never write implementation code before a failing test for it exists
- Change task status only with \`sdd new task <feature> <task-id> <status>\` (pending, in-progress, completed, blocked);
  do not hand-edit status lines or the progress counts
- Include the task ID in every commit message
- Follow the principles in \`.sdd/constitution.md\`
- Work on the feature branch created together with the spec (or the current working branch); do not create a branch per task

## Workflow

1. \`sdd new task <domain>/<feature> <task-id> in-progress\`
2. **Red**: turn the task's GIVEN-WHEN-THEN scenarios into tests and run them; confirm they fail
3. **Green**: write the minimum code that makes the tests pass
4. **Refactor**: clean up while keeping all tests green
5. Add traceability references (see below)
6. \`sdd new task <domain>/<feature> <task-id> completed\`
7. Commit: \`feat(<feature>): <task-id> - <description>\`

## Traceability

Reference every requirement you implement with the qualified form \`<domain>/<feature>#REQ-xx\`,
in the code and in the tests:

\`\`\`typescript
/**
 * @spec auth/login#REQ-01
 */
export function login(email: string, password: string) { ... }

it('auth/login#REQ-01: issues a token for valid credentials', () => { ... });
\`\`\`

A bare \`REQ-01\` is ambiguous once several specs define \`REQ-01\` and is then ignored by \`sdd sync\`.

## Commit Messages

The SDD commit-msg hook accepts \`<type>(<scope>): <message>\` with a Conventional Commits type
(\`feat\`, \`fix\`, …) or a spec type (\`spec\`, \`plan\`, \`tasks\`, …); the full list is in the AGENTS.md SDD block.

## Delegation

SDD setup also generates the \`sdd-implementer\` subagent. For a self-contained task
you may delegate it to that subagent (name it and pass the feature id and task id).
The subagent sets the task to \`in-progress\` and reports; it does not mark it completed or commit.
Review its changes and test results, then mark the task completed and commit (workflow steps 6-7).

## Completion Criteria

Once all tasks are complete:
1. Run \`sdd validate\` for a final validation pass
2. Run \`sdd sync <domain>/<feature>\`: every requirement SHOULD be covered, with no ignored-reference warnings
3. \`sdd new status <domain>/<feature> implemented\`
4. Commit and open a PR or merge
5. Run \`/sdd-status\` to review overall progress
`,
};
