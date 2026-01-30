# sdd search

Searches specs.

## Usage

```bash
sdd search <query> [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-d, --domain <domain>` | Filter by domain |
| `-s, --status <status>` | Filter by status |
| `--tag <tag>` | Filter by tag |
| `--json` | Output in JSON format |
| `--limit <n>` | Limit results (default: 20) |
| `--content` | Search content as well |

## Search Targets

- Spec ID
- Spec title
- Requirement content
- Scenario content
- Tags

## Examples

### Basic Search

```bash
sdd search "login"
```

Output:
```
=== Search Results: "login" ===

📄 user-auth (auth domain)
   Title: User Authentication
   Status: approved
   Match: "The system SHALL support login functionality"

📄 social-login (auth domain)
   Title: Social Login
   Status: draft
   Match: "Social login SHALL use OAuth 2.0"

Total: 2 results
```

### Filter by Domain

```bash
sdd search "authentication" --domain auth
```

### Filter by Status

```bash
sdd search "payment" --status approved
```

### Filter by Tag

```bash
sdd search --tag "critical"
```

### Search Content

```bash
sdd search "JWT" --content
```

### JSON Output

```bash
sdd search "authentication" --json
```

```json
{
  "query": "authentication",
  "results": [
    {
      "id": "user-auth",
      "title": "User Authentication",
      "domain": "auth",
      "status": "approved",
      "matches": [
        {
          "type": "requirement",
          "content": "The system SHALL support user authentication"
        }
      ]
    }
  ],
  "total": 1
}
```

### Combined Filters

```bash
sdd search "API" --domain api --status draft --limit 5
```

## Search Tips

### Exact Phrase Search

Wrap in quotes for exact phrase matching:

```bash
sdd search "\"login failure\""
```

### Wildcard Search

```bash
sdd search "user-*"
```

### RFC Keyword Search

```bash
sdd search "SHALL NOT"
```

## Related Documentation

- [sdd list](/cli/list) - List items
- [sdd status](/cli/status) - Status check
