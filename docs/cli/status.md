# sdd status

Displays project status.

## Usage

```bash
sdd status
```

## Description

Displays the current SDD project status:

- Number of spec files
- Distribution by phase
- Distribution by status (draft, review, approved, implemented)
- Constitution version

## Output Example

```
📊 Project Status

Specs: 12
├── Phase 1: 4
├── Phase 2: 5
└── Phase 3: 3

Status:
├── draft: 3
├── review: 2
├── approved: 4
└── implemented: 3

Constitution: v1.0.0
```

## Related Commands

- [`sdd list`](/cli/list) - List items
- [`sdd validate`](/cli/validate) - Validate specs
