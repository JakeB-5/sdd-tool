# sdd export

Exports specs to various formats.

## Usage

```bash
sdd export [specId...] [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `specId` | Spec IDs to export (multiple allowed) |

## Options

| Option | Description |
|--------|-------------|
| `--all` | Export all specs |
| `-f, --format <format>` | Format (html, json, markdown) |
| `-o, --output <path>` | Output path |
| `--theme <theme>` | Theme (light, dark) |
| `--no-toc` | Exclude table of contents |

## Formats

### HTML

Responsive styling, table of contents, RFC 2119 keyword highlighting included:

```bash
sdd export user-auth --format html
```

### JSON

Structured requirements/scenarios data:

```bash
sdd export user-auth --format json
```

### Markdown

Merge multiple specs into a single file:

```bash
sdd export --all --format markdown
```

## Examples

### Single Spec HTML

```bash
sdd export user-auth
```

### Export All Specs

```bash
sdd export --all
```

### Dark Theme

```bash
sdd export user-auth --theme dark
```

### Specify Output Path

```bash
sdd export --all -o ./docs/specs.html
```

### Exclude Table of Contents

```bash
sdd export user-auth --no-toc
```

## Output Examples

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>SDD Spec: user-auth</title>
  <style>/* embedded styles */</style>
</head>
<body>
  <nav class="toc">Table of Contents</nav>
  <main>
    <h1>user-auth</h1>
    <section id="requirements">Requirements</section>
    <section id="scenarios">Scenarios</section>
  </main>
</body>
</html>
```

### JSON Structure

```json
{
  "id": "user-auth",
  "title": "User Authentication",
  "requirements": [
    {
      "id": "REQ-001",
      "title": "Login",
      "keyword": "SHALL"
    }
  ],
  "scenarios": [
    {
      "id": "scenario-1",
      "given": ["Valid account"],
      "when": ["Login attempt"],
      "then": ["Success"]
    }
  ]
}
```
