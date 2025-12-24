# Contributing to SDD Tool

Thank you for your interest in contributing to SDD Tool! This document provides guidelines for contributing.

## Development Setup

### Prerequisites

- Node.js 20.0.0 or higher
- pnpm 9.x

### Installation

```bash
git clone https://github.com/JakeB-5/sdd-tool.git
cd sdd-tool
pnpm install
```

### Development Commands

```bash
# Build
pnpm run build

# Watch mode
pnpm run dev

# Run tests
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Lint
pnpm run lint

# Type check
pnpm run typecheck

# Documentation dev server
pnpm run docs:dev
```

## Project Structure

```
sdd-tool/
├── src/
│   ├── cli/              # CLI commands
│   │   ├── commands/     # Command implementations
│   │   └── index.ts      # CLI entry point
│   ├── core/             # Core business logic
│   │   ├── export/       # Export functionality
│   │   ├── sync/         # Sync functionality
│   │   └── diff/         # Diff functionality
│   ├── generators/       # Template generators
│   ├── parsers/          # Markdown/YAML parsers
│   └── index.ts          # Library entry point
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── docs/                 # VitePress documentation
├── templates/            # Project templates
└── bin/                  # CLI binary
```

## Contribution Workflow

### 1. Create an Issue

Before starting work, create an issue to discuss your proposed changes.

### 2. Fork and Branch

```bash
git checkout -b feature/your-feature
```

### 3. Make Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation if needed

### 4. Test

```bash
pnpm run test:coverage
pnpm run lint
pnpm run typecheck
```

Ensure:
- All tests pass
- Coverage remains above 80%
- No lint errors
- No type errors

### 5. Commit

Follow conventional commits:

```
feat: add new export format
fix: resolve Windows path issue
docs: update CLI reference
test: add sync command tests
```

### 6. Pull Request

- Fill out the PR template
- Link related issues
- Wait for CI to pass
- Request review

## Code Style

### TypeScript

- Use strict mode
- Explicit return types for public functions
- Prefer `interface` over `type` for objects
- Use Zod for runtime validation

### Testing

- Use Vitest
- Write unit tests for core logic
- Write integration tests for CLI commands
- Use descriptive test names

### Documentation

- Document public APIs with JSDoc
- Update docs/ for user-facing changes
- Include examples in documentation

## Release Process

Releases are automated via GitHub Actions:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a git tag: `git tag v1.0.0`
4. Push the tag: `git push origin v1.0.0`

The CI will automatically:
- Run tests
- Build the package
- Publish to npm
- Create GitHub release

## Questions?

- Open an issue for questions
- Check existing issues and discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
