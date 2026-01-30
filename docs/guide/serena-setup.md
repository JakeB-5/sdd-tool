# Serena MCP Installation and Setup Guide

> Serena is a semantic code analysis MCP server supporting 30+ programming languages.

## Overview

The `sdd reverse` command uses Serena MCP to extract specs from existing codebases.
Serena provides the following capabilities:

- **Symbol Analysis**: Extract code symbols like classes, functions, interfaces
- **Reference Tracking**: Analyze dependency relationships between symbols
- **Pattern Search**: Regex-based code search
- **Multi-language**: 30+ programming language support

## Supported Languages

### Major Languages
- TypeScript / JavaScript
- Python
- Java / Kotlin
- Go
- Rust

### System Languages
- C / C++
- C#
- Zig
- Nim

### Functional Languages
- Haskell
- OCaml / F#
- Clojure
- Elixir / Erlang

### Scripting
- Ruby
- PHP
- Perl
- Lua
- R / Julia

### Others
- Swift
- Scala
- Dart
- Crystal
- V / Odin

## Installation

### 1. Install Serena MCP

#### Python Users
```bash
pip install serena-mcp
```

#### Node.js Users
```bash
npm install -g @serena-ai/mcp
```

#### Install from Source
```bash
git clone https://github.com/serena-ai/serena-mcp
cd serena-mcp
pip install -e .
```

### 2. Claude Code MCP Configuration

Add the Serena MCP server in Claude Code settings.

#### Method A: Settings UI
1. Run Claude Code
2. Settings -> MCP Servers
3. Click "Add Server"
4. Enter Serena server info

#### Method B: Config File
`~/.claude/mcp_settings.json`:
```json
{
  "mcpServers": {
    "serena": {
      "command": "serena-mcp",
      "args": ["--project", "."],
      "env": {}
    }
  }
}
```

### 3. Activate Project

To use Serena tools in Claude Code, you need to activate the project:

```
mcp__serena__activate_project project_path
```

## Verify Setup

### Check Connection Status
```bash
# In SDD CLI
sdd reverse --check-serena

# In Claude Code
mcp__serena__get_current_config
```

### Basic Test
```bash
# List directory
mcp__serena__list_dir .

# Analyze file symbols
mcp__serena__get_symbols_overview src/index.ts
```

## Key Tools

### File System

| Tool | Description |
|------|-------------|
| `list_dir` | List directory contents |
| `find_file` | Find files (glob pattern) |
| `read_file` | Read file |

### Symbol Analysis

| Tool | Description |
|------|-------------|
| `get_symbols_overview` | File symbol overview |
| `find_symbol` | Search symbols |
| `find_referencing_symbols` | Find referencing symbols |

### Search

| Tool | Description |
|------|-------------|
| `search_for_pattern` | Regex pattern search |

## sdd reverse Workflow

### 1. Scan Project
```bash
sdd reverse scan
```

Uses Serena to analyze project structure and estimate domains.

### 2. Extract Specs
```bash
sdd reverse extract src/auth/
```

Extract spec drafts from code:
- Class/function signatures
- Type information
- Comments/documentation
- Dependency relationships

### 3. Review and Modify
```bash
sdd reverse review
```

Review and modify extracted specs.

### 4. Finalize
```bash
sdd reverse finalize
```

Convert approved specs to official specs.

## Troubleshooting

### Serena Connection Failure

**Symptom**: `Serena MCP required` error

**Solution**:
1. Check Serena installation: `pip show serena-mcp`
2. Check MCP settings: `~/.claude/mcp_settings.json`
3. Restart Claude Code

### Project Activation Failure

**Symptom**: `Cannot activate project` error

**Solution**:
1. Check project path
2. Check language server installation (for target language)
3. Check status with `mcp__serena__get_current_config`

### Symbol Not Found

**Symptom**: `Symbol not found` error

**Solution**:
1. Check language support
2. Verify file is included in project
3. Check `.gitignore` patterns

## Reference Links

- [Serena MCP GitHub](https://github.com/serena-ai/serena-mcp)
- [Serena Documentation](https://docs.serena.ai/mcp)
- [SDD CLI Documentation](/cli/reverse)
- [Reverse Extraction Guide](/guide/reverse-extraction)

## Development/Test Mode

To test without Serena:

```bash
# Skip check with environment variable
SDD_SKIP_SERENA_CHECK=true sdd reverse scan

# Skip check with CLI option
sdd reverse scan --skip-serena-check
```

> Warning: This mode is for development/testing only. Actual spec extraction requires Serena.
