# sdd change

Manages change proposals for existing specs.

## Usage

```bash
sdd change [id] [options]        # no id: create a proposal, with id: show details
sdd change <subcommand> <id>
```

## Subcommands

| Command | Description |
|---------|-------------|
| `apply <id>` | Mark the proposal as `applied` (spec files are not modified automatically) |
| `archive <id>` | Move a completed change to `.sdd/archive/YYYY-MM/YYYY-MM-DD-<id>/` |
| `diff <id>` | Summarize ADDED/MODIFIED/REMOVED from delta.md |
| `validate <id>` | Validate proposal.md and delta.md (exit code 2 on failure) |

## Options

| Option | Description |
|--------|-------------|
| `-l, --list` | List pending changes |
| `-t, --title <title>` | Change proposal title |
| `-s, --spec <spec>` | Target spec (`<domain>/<feature>`). Repeat the option (`-s a -s b`) or comma-separate (`-s a,b`) to target several specs |

## Change Workflow

```
create → write delta.md → validate → edit specs → apply → archive
```

1. **create** (`sdd change -t "..." -s <spec>`): generates `proposal.md` and `delta.md`. The proposal lists
   every target spec, and `delta.md` gets one `MODIFIED` block (`### <spec>` with Before/After) per spec.
   IDs account for both pending and archived changes, so an ID is never reused after archiving.
2. **write delta.md**: fill in the ADDED / MODIFIED / REMOVED sections
3. **validate**: check the format
4. **edit specs**: the user or the AI edits the spec files following delta.md
5. **apply**: marks the proposal as `applied` — it does not rewrite specs
6. **archive**: moves the change to the archive (dates use local time)

## Examples

```bash
sdd change -t "Login Feature Enhancement" -s auth/login   # creates CHG-001
sdd change -t "Auth and billing" -s auth/login -s billing/pay   # several specs (or -s auth/login,billing/pay)
sdd change -l                                             # list
sdd change CHG-001                                        # details (exit code 2 if proposal.md fails to parse)
sdd change validate CHG-001
sdd change apply CHG-001
sdd change archive CHG-001
```

## delta.md Format

~~~markdown
---
proposal: CHG-001
created: 2025-01-07
---

# Delta: Login Feature Enhancement

## ADDED

### REQ-10: OAuth login

The system SHALL support OAuth 2.0.

## MODIFIED

### auth/login

#### Before

```markdown
old content
```

#### After

```markdown
new content
```

### auth/logout

#### Before
...

## REMOVED

### REQ-01: Legacy login
~~~

- Only `## ` headings end a section; `###` sub-headings inside ADDED/REMOVED stay in the section.
- MODIFIED is parsed into one item per `### <target>`, each with its own Before/After
  (the code block after `#### Before` or `**Before:**`).
- `## ` lines inside code blocks are not treated as headings.

## Related Documentation

- [sdd impact](./impact) - Change impact analysis (`impact simulate` reads delta.md)
- [CLI Reference](./) - All commands
