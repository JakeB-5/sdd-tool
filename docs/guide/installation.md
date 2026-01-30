# Installation

## Requirements

- **Node.js**: 20.0.0 or higher
- **Claude Code**: Latest version recommended

## Install with npm

```bash
npm install -g sdd-tool
```

## Install with pnpm

```bash
pnpm add -g sdd-tool
```

## Verify Installation

```bash
sdd --version
```

## Claude Code Setup

SDD Tool collaborates with AI through Claude Code slash commands.

### Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

### Start Claude Code in Your Project

```bash
claude
```

## Initialize Project

In a new project:

```bash
cd your-project
sdd init
```

Structure created after initialization:

```
your-project/
├── .sdd/
│   ├── constitution.md     # Project constitution
│   ├── AGENTS.md           # AI workflow guide
│   └── specs/              # Feature specs
└── .claude/
    └── commands/           # Slash commands (29 total)
```

## Update

```bash
npm update -g sdd-tool
```

## Troubleshooting

### Permission Error

```bash
sudo npm install -g sdd-tool
```

Or change npm global install path to user directory:

```bash
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Node.js Version Error

Node.js 20 or higher is required. When using nvm:

```bash
nvm install 20
nvm use 20
```
