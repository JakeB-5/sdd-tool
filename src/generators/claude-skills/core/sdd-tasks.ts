/**
 * sdd-tasks skill definition — break an implementation plan into actionable tasks.
 */
import type { SkillDefinition } from '../types.js';

export const sddTasksSkill: SkillDefinition = {
  name: 'sdd-tasks',
  description: 'Break an implementation plan into actionable tasks with priorities and dependencies',
  allowedTools: ['Read', 'Write', 'Edit'],
  context: 'inline',
  content: `# SDD Tasks

## Instructions

1. Read the feature's \`plan.md\` and review the implementation phases
2. Run \`sdd new tasks <feature-id>\` to generate a task list
3. Assign a priority and status to each task

## Task Decomposition Rules

- Break work into tasks completable within 2–4 hours
- Clearly mark dependencies between tasks
- Priority levels: HIGH (🔴), MEDIUM (🟡), LOW (🟢)
- Status values: pending, in-progress, completed, blocked

## Task Structure

\`\`\`markdown
### <feature>-task-001: [Task Title]

- **Status:** pending
- **Priority:** 🔴 HIGH
- **Dependencies:** none

#### Description
[Detailed description of the task]

#### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
\`\`\`

After completing the task list, begin implementation with \`/sdd-implement\`.
`,
};
