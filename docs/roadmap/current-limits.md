# Current Limitations

An overview of SDD Tool's realistic limitations and appropriate usage scale.

## Appropriate Project Scale

| Scale | Developers | Specs | Suitability | Notes |
|-------|-----------|-------|-------------|-------|
| **Small** | 1-5 | ~50 | Optimal | All features work smoothly |
| **Medium** | 5-15 | 50-150 | Manageable | Requires discipline |
| **Large** | 15+ | 150+ | Reaches limits | Separation recommended |

## Structural Limitations

### 1. File-based System

```
Problem: All operations directly access file system
Impact: Performance degradation with 100+ specs
```

- Full spec parsing on every command execution
- No indexing/caching mechanism
- Response delays on large-scale searches

### 2. Manual Dependency Management

```yaml
# Current: Developer explicitly specifies
---
dependencies:
  - user-auth
  - data-model
---
```

- Possibility of missing dependencies
- Limited automatic detection of implicit references
- Difficult to manage complex dependency graphs

### 3. Single Constitution

```
.sdd/
└── constitution.md  # Single file for entire project
```

- Cannot separate domain-specific principles in multi-team environments
- Constitution becomes bloated in large projects
- Difficult to balance team autonomy with global consistency

### 4. Version Management Limitations

- Git-dependent version management
- No spec-level version history tracking
- No automatic breaking change detection
- No version compatibility validation between specs

## Workflow Limitations

### 1. Lack of Collaboration Features

| Feature | Current Status |
|---------|----------------|
| Concurrent editing | Depends on Git conflicts |
| Spec locking | Not supported |
| Review approval | Not supported |
| Comments/discussion | Not supported |

### 2. No External Tool Integration

- No Issue Tracker integration (GitHub Issues, Linear, Jira)
- No IDE plugins
- Basic CI/CD integration only
- No notification/webhook system

### 3. Limited Reporting

- No real-time dashboard
- No trend analysis
- Limited team/domain statistics

## Optimal Use Cases

### Suitable Cases

```
  Side projects / MVP
  Early-stage small startup products
  Microservices managed by single team
  AI pair programming focused development
  New feature development with clear scope
```

### Cases Requiring Caution

```
  Medium-scale SaaS (Phase/domain separation required)
  Main product for teams under 10 people
  Managing multiple microservices simultaneously
```

### Unsuitable Cases

```
  Enterprise systems
  Multi-team large projects
  Full documentation of legacy systems
  Projects in regulated industries requiring audit trails
  Geographically distributed teams
```

## Signs of Scale Limitations

When your project shows these signs, you've reached the limits:

### Performance Signs

- `sdd validate` execution time > 10 seconds
- Noticeable `sdd search` response delays
- Increasing `sdd impact` analysis time

### Management Signs

- Difficult to understand dependency graph
- Frequent spec duplicates/conflicts
- Inconsistent Constitution principle interpretation
- Specs changing without review

### Collaboration Signs

- Frequent Git conflicts
- Increasing "who modified this spec?" questions
- Time spent figuring out spec status

## Strategies for Handling Limitations

### Short-term Response

1. **Thorough Phase separation**: Clear Phase boundaries
2. **Stronger naming conventions**: Use domain prefixes (`auth-`, `billing-`)
3. **Regular cleanup**: Archive completed specs

### Medium-term Response

1. **Domain separation**: Separate `.sdd/` directories
2. **Automation scripts**: Custom validation/reporting
3. **Use external tools**: Use Notion/Linear for complex collaboration

### Long-term Response

1. **Tool extension**: See [Scaling Roadmap](./scaling.md)
2. **Project separation**: Independent SDD per microservice
3. **Alternative tool evaluation**: Enterprise-grade requirements management tools

## Related Documentation

- [Roadmap Overview](./overview.md) - Complete roadmap
- [Scaling Roadmap](./scaling.md) - Medium-scale expansion plan
- [Best Practices](/guide/best-practices.md) - Effective usage
