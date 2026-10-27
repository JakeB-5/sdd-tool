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

# Create your first spec
sdd new user-authentication

# Validate specs
sdd validate
```

## Skills (Slash Commands)

Use these skills in Claude Code:

| Skill | Description |
|-------|-------------|
| `/sdd-start` | Start SDD workflow |
| `/sdd-spec` | Create/modify specification |
| `/sdd-plan` | Generate implementation plan |
| `/sdd-tasks` | Break down into tasks |
| `/sdd-implement` | Implement with AI assistance |
| `/sdd-validate` | Validate specifications |

[View all skills →](/commands/)

`sdd init` generates 30 `sdd-*` skills under `.claude/skills/sdd-*/SKILL.md`, and Claude Code exposes each as a `/sdd-*` slash command. Skills are authored in English and include frontmatter (`allowed-tools`, `context`, etc.) for model-routing accuracy. Legacy `.claude/commands/` files are only written with `sdd init --legacy-commands`.
