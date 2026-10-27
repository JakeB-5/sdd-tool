/**
 * sdd-tasks skill definition — break an implementation plan into actionable tasks.
 */
import type { SkillDefinition } from '../types.js';

export const sddTasksSkill: SkillDefinition = {
  name: 'sdd-tasks',
  description:
    'Break a plan.md into actionable tasks.md entries with priorities, dependencies, and acceptance criteria. Use when a plan exists and the user wants a task breakdown before implementing.',
  argumentHint: '<feature>',
  allowedTools: [
    'Read',
    'Write',
    'Edit',
    'Bash(sdd new tasks*)',
    'Bash(sdd new task *)',
    'Bash(sdd new status *)',
  ],
  content: `# SDD Tasks

## Instructions

1. Read the feature's \`spec.md\` and \`plan.md\` and review the implementation phases
2. Write the tasks in the feature's \`tasks.md\`:
   - A feature created with \`--all\` (the \`/sdd-spec\` default) already has \`tasks.md\` with placeholder tasks: edit it in place. Do not re-run \`sdd new tasks\`
   - Only if it is missing, run \`sdd new tasks <feature>\` to generate the template
   - \`--force\` regenerates the file from scratch and discards its content; use it only when asked
3. Replace the placeholder tasks with the real breakdown; give each task a priority, dependencies, and the pending status
4. Refresh the counts for the new task list without changing any status: re-run
   \`sdd new task <feature> <first-task-id> pending\` (it reports when only the counts were rewritten)
5. Optionally record the stage: \`sdd new status <feature> tasked\`

## Task Decomposition Rules

- Break work into tasks completable within 2–4 hours
- Task ids are \`<name>-task-NNN\`, where \`<name>\` is the feature name without its domain
  (\`login-task-001\`, \`login-task-002\`, …), each under a \`### <task-id>: Title\` heading
- Clearly mark dependencies between tasks (task ids, or \`none\`)
- Priority levels: HIGH (🔴), MEDIUM (🟡), LOW (🟢)
- Implementation tasks are test-first: the task writes failing tests for its scenarios, then the code.
  Do not add a separate "write tests" task after the implementation

## Task Structure

This is the form \`sdd new tasks\` writes (labels: status, priority, description, dependencies):

\`\`\`markdown
### <name>-task-001: [Task title]

- **상태:** 대기
- **우선순위:** 🔴 HIGH
- **설명:** [What to build, test-first; the requirements (REQ-xx) it covers]
- **의존성:** 없음
\`\`\`

\`\`\`text
대기 = pending   진행 중 = in-progress   완료 = completed   차단됨 = blocked   없음 = none
\`\`\`

English labels (\`**Status:**\`, \`**Priority:**\`, \`**Description:**\`, \`**Dependencies:**\`) with the
English values are parsed too; keep the form the file already uses. Statuses and the progress
counts are updated with \`sdd new task <feature> <task-id> <status>\` during implementation
(see \`/sdd-implement\`), not by hand. Each run recomputes the counts (frontmatter
\`total:\` / \`completed:\`, the task-total line and the progress block) from the tasks it parses,
also when the status is unchanged.

After completing the task list, begin implementation with \`/sdd-implement\`.
`,
};
