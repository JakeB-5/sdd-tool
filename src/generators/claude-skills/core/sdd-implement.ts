/**
 * sdd-implement skill definition — execute tasks sequentially with TDD discipline.
 */
import type { SkillDefinition } from '../types.js';

export const sddImplementSkill: SkillDefinition = {
  name: 'sdd-implement',
  description: 'Execute tasks sequentially with TDD discipline (red → green → refactor)',
  allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash(npm*,pnpm*,yarn*,git*,sdd*)', 'WebFetch'],
  context: 'inline',
  content: `# SDD Implement

## Instructions

1. Run \`sdd status\` to review current progress
2. Read the feature's \`tasks.md\` and identify the next task
3. Implement the task, then update its status when done

## Implementation Rules

- Work on one task at a time
- Write tests after completing each task
- Include the task ID in every commit message
- Follow the principles in \`.sdd/constitution.md\`

## Workflow

1. Set task status to "in-progress"
2. Implement the code
3. Write and run tests (red → green → refactor)
4. Set task status to "completed"
5. Commit: \`feat(<feature>): <task-id> - <description>\`

## TDD Cycle

\`\`\`
Red:    Write a failing test that describes the expected behavior
Green:  Write the minimum code to make the test pass
Refactor: Clean up the code while keeping all tests green
\`\`\`

## Completion Criteria

Once all tasks are complete:
1. Run \`sdd validate\` for a final validation pass
2. Commit and open a PR or merge
3. Run \`/sdd-status\` to review overall progress
`,
};
