# sdd start

Starts the SDD workflow.

## Usage

```bash
sdd start [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--new` | Start new feature workflow |
| `--change` | Start change workflow |
| `--continue` | Continue in-progress work |

## Behavior

`sdd start` analyzes project status and guides you to the appropriate next step:

1. **New project**: Guide to constitution writing
2. **No constitution**: Recommend constitution creation
3. **Work in progress**: Offer continue option
4. **Existing project**: Workflow selection menu

## Examples

### Basic Start

```bash
sdd start
```

Output (new project):
```
=== SDD Workflow Start ===

🔍 Analyzing project status...

📋 Project Status:
  • Constitution: ❌ None
  • Specs: 0
  • Domains: 0

💡 Recommended Next Step:
  1. Write Constitution: sdd constitution

Would you like to write a constitution? (y/n):
```

Output (existing project):
```
=== SDD Workflow Start ===

🔍 Analyzing project status...

📋 Project Status:
  • Constitution: ✅ v1.2.0
  • Specs: 12 (draft: 3, approved: 9)
  • Domains: 4
  • Work in progress: None

🚀 Select Workflow:
  1. Write new feature spec (/sdd-spec)
  2. Change existing spec (/sdd-spec)
  3. Check project status (sdd status)
  4. Quality analysis (sdd quality)

Select (1-4):
```

Output (work in progress):
```
=== SDD Workflow Start ===

🔍 Analyzing project status...

⚠️  You have work in progress:

📄 user-auth (auth domain)
   Status: draft
   Last modified: 2 hours ago
   Progress: plan complete, tasks pending

Would you like to continue? (y/n):
```

### Start New Feature Workflow Directly

```bash
sdd start --new
```

### Start Change Workflow Directly

```bash
sdd start --change
```

### Continue In-Progress Work

```bash
sdd start --continue
```

## Workflow Flow

```
sdd start
    │
    ├── No Constitution
    │   └── sdd constitution
    │
    ├── New Feature
    │   └── sdd new → sdd plan → sdd tasks → sdd implement
    │
    └── Change
        └── sdd change → sdd impact → sdd apply
```

## Slash Command

In Claude Code, use the `/sdd-start` slash command:

```
/sdd-start
```

## Related Documentation

- [sdd constitution](/cli/constitution) - Constitution management
- [sdd new](/cli/new) - Create new feature
- [sdd change](/cli/change) - Change management
- [Getting Started Guide](/guide/getting-started)
