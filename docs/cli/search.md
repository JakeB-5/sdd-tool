# sdd search

Searches specs.

## Usage

```bash
sdd search [query] [options]
```

The query is optional when at least one filter is given.

## Options

| Option | Description |
|--------|-------------|
| `--status <status>` | Status filter, comma-separated (`draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated`) |
| `--phase <phase>` | Phase filter, comma-separated |
| `--author <author>` | Author filter |
| `--tags <tags>` | Tag filter, comma-separated |
| `--created-after <date>` / `--created-before <date>` | Created date range (YYYY-MM-DD) |
| `--updated-after <date>` / `--updated-before <date>` | Updated date range (YYYY-MM-DD) |
| `--depends-on <specId>` | Specs that depend on the given spec |
| `--limit <n>` | Maximum number of results |
| `--sort-by <field>` | `relevance`, `created`, `updated`, `title`, `status` |
| `--sort-order <order>` | `asc` or `desc` |
| `-r, --regex` | Treat the query as a regular expression |
| `-c, --case-sensitive` | Case-sensitive search |
| `--json` | Output in JSON format |

Invalid `--limit`, `--sort-by`, `--sort-order`, dates and statuses are rejected. Specs without a `created` date never match
`--created-*` filters.

## Search Targets

The full text of every spec (frontmatter, requirements, scenarios). Matches are shown with their line numbers.

## Examples

### Basic Search

```bash
sdd search "login"
```

Output (CLI output is Korean):
```
🔍 검색 결과: "login"
   2개 발견 (8ms)

📝 auth/login
   제목: login
   상태: draft | Phase: unknown | 점수: ██████████ 100%
   매칭:
     L2: id: **login**
```

### Filter by Status

```bash
sdd search "payment" --status approved,implemented
```

### Filter by Tag

```bash
sdd search --tags critical
```

### Regular Expression

```bash
sdd search "user-.*" --regex
```

### Spec Dependents

```bash
sdd search --depends-on auth/login
```

### JSON Output

```bash
sdd search "authentication" --json --limit 5
```

### RFC Keyword Search

```bash
sdd search "SHALL NOT" --case-sensitive
```

## Related Documentation

- [sdd list](/cli/list) - List items
- [sdd status](/cli/status) - Status check
