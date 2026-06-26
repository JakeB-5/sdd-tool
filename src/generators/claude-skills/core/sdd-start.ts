/**
 * sdd-start skill definition — entry point for the SDD workflow.
 */
import type { SkillDefinition } from '../types.js';

export const sddStartSkill: SkillDefinition = {
  name: 'sdd-start',
  description: 'Entry point for the SDD workflow — analyze project state and run the initial setup wizard',
  allowedTools: ['Read', 'Glob', 'Bash(sdd *)'],
  context: 'inline',
  content: `# SDD Start

## Core Principles

**Initial setup always takes priority over workflow suggestions.**
- Do not suggest workflows (reverse extraction, new spec, etc.) until initial setup is complete.
- Always run the setup wizard first; only guide the user to the next workflow after setup is fully done.

---

## Step 1: Project Analysis (automatic)

Automatically analyze the following items and display results as a table:

| Item | How to Check |
|------|-------------|
| SDD initialized | Whether the \`.sdd/\` directory exists |
| Spec files | Count of \`.sdd/specs/**/*.md\` files |
| Existing code | Whether \`src/\`, \`lib/\`, or \`app/\` directories exist |
| Git repository | Whether \`.git/\` directory exists |
| Git hooks | Whether \`.git/hooks/pre-commit\` exists |
| CI/CD | Whether \`.github/workflows/sdd-*.yml\` exists |

---

## Step 2: Setup Wizard (highest priority)

**Run the setup wizard first if any of the following conditions apply:**

1. No \`.sdd/\` directory → SDD initialization required
2. No \`.git/hooks/pre-commit\` → Git hooks installation required
3. No \`.github/workflows/sdd-*.yml\` → CI/CD configuration required

### Running the Wizard

Use the \`AskUserQuestion\` tool with **multiSelect: true**:

\`\`\`
Question: "Your project needs initial setup. Select the items to configure."
Options:
- Initialize SDD (create .sdd directory)
- Install Git hooks (automatic validation on commit)
- Set up GitHub Actions CI/CD
\`\`\`

### Execute Selected Items

Run each selected item **sequentially and immediately**:

| Item | Command |
|------|---------|
| Initialize SDD | \`sdd init --skip-git-setup\` |
| Git hooks | \`sdd git hooks install\` |
| CI/CD | \`sdd cicd setup github\` |

For each item:
- Starting: "Setting up [item]..."
- Done: "[item] configured successfully"

---

## Step 3: Workflow Guidance (only after setup is complete)

**Only suggest the next workflow once all setup items are complete:**

| Project State | Recommended Workflow |
|--------------|---------------------|
| Existing code + no specs (brownfield) | \`/sdd-reverse\` |
| No existing code (greenfield) | \`/sdd-new\` |
| Specs already exist | \`/sdd-status\` or \`/sdd-implement\` |

---

## Brownfield Projects (existing codebase)

When adopting SDD on a project that already has code:

1. **Reverse extraction**: Run \`/sdd-reverse scan\` to analyze the project structure
2. **Extract specs**: Run \`/sdd-reverse extract\` to generate spec drafts from existing code
3. **Review and finalize**: \`/sdd-reverse review\` → \`/sdd-reverse finalize\`
4. For new features going forward, use \`/sdd-new\`

**Brownfield detection criteria:**
- Source directories such as \`src/\`, \`lib/\`, or \`app/\` exist
- Few or no spec files under \`.sdd/specs/\`
- Project config files such as \`package.json\` or \`requirements.txt\` exist

---

## Git Workflow Details

### Installed Git Hooks

| Hook | Trigger | Function |
|------|---------|----------|
| pre-commit | Before commit | Validate changed specs |
| commit-msg | After writing commit message | Validate message format |
| pre-push | Before push | Validate all specs |

### Generated GitHub Actions

| Workflow | Function |
|----------|----------|
| sdd-validate.yml | Auto-validate specs on PR / push |
| sdd-labeler.yml | Auto-add domain labels to PRs |
`,
};
