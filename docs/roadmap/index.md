# Roadmap

> Check SDD Tool's development plans and current status.

## Document Structure

```
+-------------------------------------------------------------+
|  Current Status                                              |
|  +-- current-limits.md (Current limitations and scale)       |
+-------------------------------------------------------------+
|  Main Roadmap                                                |
|  +-- overview.md (v2 Roadmap - Full Phase 0~6)              |
+-------------------------------------------------------------+
|  Detailed Plans                                              |
|  +-- scaling.md (Phase 0 Git Workflow details)              |
|  +-- reverse-extraction.md (Phase 1-R Reverse extraction)   |
+-------------------------------------------------------------+
|  Reference Documents                                         |
|  +-- enterprise.md (Large-scale expansion - reference)      |
+-------------------------------------------------------------+
```

## Quick Links

### Current Status

- [Current Limitations](./current-limits.md) - Realistic limitations and appropriate scale

### Main Roadmap

- [Roadmap v2 (Overview)](./overview.md) - **Core document**, complete Phase-by-Phase plan

### Phase Details

| Phase | Document | Description |
|-------|----------|-------------|
| **Phase 0** | [Git Workflow](./scaling.md#phase-0-collaboration-based-git-workflow) | Commit conventions, branch strategy |
| **Phase 1-G** | [Domain Setup](./overview.md#phase-1-g-greenfield-manual-domain-setup) | Greenfield manual setup |
| **Phase 1-R** | [Reverse Extraction](./reverse-extraction.md) | Brownfield code->spec |
| **Phase 2** | [Code Connection](./overview.md#phase-2-code-context-connection) | spec <-> code linking |
| **Phase 3** | [Task DAG](./overview.md#phase-3-task-graph-dag) | Dependency-based tasks |
| **Phase 4** | [Change-based](./overview.md#phase-4-change-based-work-guidance) | Spec diff -> tasks |

### Reference Documents

- [Enterprise Roadmap](./enterprise.md) - Large-scale expansion plan (reference only, out of scope)

---

## Guide by Project Type

### Greenfield (New Projects)

```
Start -> Phase 0 -> Phase 1-G -> Phase 2 -> Phase 3-4
```

1. Set up [Git Workflow](./scaling.md)
2. [Manual Domain Setup](./overview.md#phase-1-g-greenfield-manual-domain-setup)
3. Write specs and develop

### Brownfield (Legacy Projects)

```
Start -> Phase 0 -> Phase 1-R -> Phase 2 -> Phase 3-4
```

1. Set up [Git Workflow](./scaling.md)
2. [Reverse Spec Extraction](./reverse-extraction.md) (using Serena MCP)
3. Review and finalize extracted specs
4. Same as Greenfield afterwards

---

## Milestones

| Version | Content | Status |
|---------|---------|--------|
| v1.x | Basic CLI, Spec validation, Constitution | Complete |
| v2.0 | Phase 0 + 1-G (Domain system) | Planned |
| v2.1 | Phase 1-R (Reverse extraction, Serena) | Planned |
| v2.5 | Phase 2 + 3 (Code connection, DAG) | Planned |
| v3.0 | Phase 4 (Change-based work) | Planned |

See [Roadmap v2](./overview.md#milestones) for detailed milestones.

---

## Core Message

```
This tool's identity:
  Claude thought structuring tool
  Best for small to medium new development
  NOT an enterprise platform
```

See [Roadmap v2](./overview.md#redefining-the-tools-essence) for detailed philosophy and direction.
