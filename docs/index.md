---
layout: home

hero:
  name: SDD Tool
  text: Spec-Driven Development CLI
  tagline: AI-Powered Specification Workflow with Claude Code
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/JakeB-5/sdd-tool

features:
  - icon: 📋
    title: Specification First
    details: Write specifications before code. Specs are the source of truth, code is just an expression of specs.
  - icon: 🤖
    title: AI Collaboration
    details: Automate your workflow with Claude Code skills. AI assists in writing specs and implementing features.
  - icon: ✅
    title: RFC 2119 Keywords
    details: Use standard keywords (SHALL, MUST, SHOULD, MAY) to clearly define requirement levels.
  - icon: 🎯
    title: GIVEN-WHEN-THEN
    details: Define requirements using scenario-based approach for better clarity and testability.
  - icon: 📊
    title: Sync Verification
    details: Track alignment between specifications and code. Measure and improve your sync rate.
  - icon: 🔄
    title: Reverse Extraction
    details: Extract specifications from existing codebases. Perfect for brownfield projects.
---

## Quick Start

```bash
# Install
npm install -g sdd-tool

# Initialize project
sdd init

# Create your first spec (domain auto-created; spec, plan, tasks, checklist)
sdd new auth/user-authentication --all

# Validate specs
sdd validate

# Track progress while implementing
sdd new task user-authentication user-authentication-task-001 in-progress
sdd status

# Finish: verify @spec <domain>/<feature>#REQ-01 coverage and mark implemented
sdd sync
sdd new status auth/user-authentication implemented
```

`sdd new` also creates and switches to a `feature/<name>` git branch (skip with `--no-branch`) and never overwrites existing files (`--force` regenerates). Requirements are the `### REQ-01: Title` headings of a spec, and dependencies for `sdd impact` come only from the frontmatter `depends: [<domain>/<feature>]` list.

## Skills (Slash Commands)

Use these skills in Claude Code:

| Skill | Description |
|-------|-------------|
| `/sdd-start` | Start SDD workflow |
| `/sdd-constitution` | Define project principles |
| `/sdd-spec` | Create/modify specification (`sdd new <domain>/<feature> --all`) |
| `/sdd-plan` | Write the implementation plan (plan.md) |
| `/sdd-tasks` | Break down into tasks (tasks.md) |
| `/sdd-implement` | Implement test-first (`sdd new task ...` per task; at the end `sdd validate`, `sdd sync`, `sdd new status <feature> implemented`) |
| `/sdd-validate` | Validate specifications (`sdd validate`, plus `sdd sync` for implemented features) |

[View all skills →](/commands/)

`sdd init` generates 30 `sdd-*` skills under `.claude/skills/sdd-*/SKILL.md`, and Claude Code exposes each as a `/sdd-*` slash command. Skills are authored in English and include frontmatter (`allowed-tools`, `context`, etc.) for model-routing accuracy. Legacy `.claude/commands/` files are only written with `sdd init --legacy-commands`.
