# /sdd.change

::: warning Deprecated
This command has been replaced by `/sdd.spec`.
`/sdd.spec` automatically determines whether you're writing a new feature or modifying an existing spec, and guides you to the appropriate workflow.
:::

Propose changes to an existing spec.

## Usage

```
/sdd.change <spec-id> [reason for change]
```

## Arguments

| Argument | Description |
|----------|-------------|
| spec-id | ID of the spec to change |
| reason for change | Reason for the change (optional) |

## Behavior

The AI writes a change proposal through conversation:

1. Analyze existing spec
2. Identify change scope
3. Generate delta (ADDED/MODIFIED/REMOVED)
4. Impact analysis

## Generated Files

```
.sdd/changes/<change-id>/
├── proposal.md      # Change proposal
├── delta.md         # Changes (ADDED/MODIFIED/REMOVED)
└── impact.md        # Impact analysis
```

## Example

```
/sdd.change user-auth Add OAuth login

AI: Writing change proposal for user-auth spec.
    Analyzing current spec...

    Existing requirements:
    - REQ-01: Email/password login

    Requirements to add:
    - REQ-02: Google OAuth login
    - REQ-03: GitHub OAuth login
```

## Next Steps

After writing the change proposal:

```
sdd change validate <change-id>  -> Validate proposal
sdd change apply <change-id>     -> Apply changes
```
