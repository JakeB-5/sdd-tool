# /sdd.constitution

Define the core principles (Constitution) for your project.

## Usage

```
/sdd.constitution [project description]
```

## Arguments

| Argument | Description |
|----------|-------------|
| project description | A brief description of the project |

## Behavior

The AI writes project principles through conversation:

1. Understand project purpose
2. Derive core principles
3. Define technical principles
4. List forbidden practices

## Constitution Structure

```markdown
# [Project Name] Constitution

## Core Principles
- User data protection is the top priority
- Accuracy is more important than performance

## Technical Principles
- Use TypeScript strict mode
- Type definitions required for all functions
- Maintain test coverage above 80%

## Forbidden
- No use of `any` type
- No console.log in production code
- No indiscriminate addition of external dependencies
```

## Example

```
/sdd.constitution React-based todo management app

AI: I'll write the Constitution for your todo management app.
    I have a few questions:

    1. Who are the main users of the app?
    2. Do you need offline support?
    3. What data storage method do you prefer?
```

## Version Management

Increment the version when the Constitution changes:

```yaml
version: 1.0.0  ->  1.1.0
```

Reference in specs:

```yaml
constitution_version: 1.0.0
```
