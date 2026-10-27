# sdd impact

Analyzes the impact of spec changes.

## Usage

```bash
sdd impact <spec> [options]
sdd impact report [--json]
sdd impact change <change-id> [--json]
sdd impact simulate <spec> <change-id> [--json]
```

`<spec>` is `<domain>/<feature>` or a unique `<feature>`.

## Options

| Option | Description |
|--------|-------------|
| `-g, --graph` | Output the dependency graph (Mermaid) |
| `-c, --code` | Code impact analysis |
| `--json` | JSON output — works on every subcommand; stdout carries only the JSON document |

## Subcommands

| Command | Description |
|---------|-------------|
| `report` | Project-wide dependency report |
| `change <id>` | Specs affected by a change proposal |
| `simulate <spec> <id>` | What-if prediction as if the change were applied |

## What Is Analyzed

- **Depends on**: specs the target uses (frontmatter `depends`)
- **Directly/indirectly affected specs**: specs that depend on the target
- **Risk score** and recommendations

### Dependencies vs. references

Dependencies come **only** from the frontmatter `depends` list (`depends: [pricing/cart]`, `[]` for none).
Mentioning another spec in the body — `` `pricing/cart` ``, a Markdown link to it, or a `specs/...` path —
is a **reference**: it is listed separately ("본문 참조 (의존성 아님)" in `sdd impact <spec>`, the reference
count in `sdd impact report`, a dotted `참조` arrow in `--graph`, `references` in `--graph --json`) and never
creates a dependency edge, a cycle, or a change to the health score or risk score.
Declare a real dependency in `depends` instead.

## simulate

`simulate` reads `.sdd/changes/<id>/delta.md` (proposal.md is used only for legacy changes without delta.md).

- `## ADDED` / `## REMOVED`: only explicit spec targets count — a list item starting with `` `spec-id` `` adds/removes
  that spec, and a `### <spec>` heading that resolves to an existing spec marks it modified. Requirement text
  (plain bullets, `### REQ-xx` headings) and `<!-- -->` placeholders are ignored
- `## MODIFIED`: for each `### <target spec>`, the `depends:` lines in Before/After are compared to
  compute added and removed dependencies (`newDependencies`, `removedDependencies`)
- `changes.addedEdges` / `changes.removedEdges` are the real edge differences between the current and projected graphs
- If no delta is found the command fails (exit code 1)

```bash
sdd impact simulate auth/login CHG-001 --json
```

## Examples

```bash
sdd impact auth/login              # impact analysis
sdd impact auth/login --graph      # Mermaid graph
sdd impact auth/login -c --json    # code impact (JSON)
sdd impact report --json           # project report (JSON)
sdd impact change CHG-001 --json   # change proposal impact (JSON)
```

## Related Documentation

- [sdd change](/cli/change) - Change management
- [sdd domain](/cli/domain) - Domain management
- [sdd sync](/cli/sync) - Spec-code sync
