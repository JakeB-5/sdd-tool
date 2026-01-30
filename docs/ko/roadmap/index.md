# 로드맵

> SDD Tool의 발전 계획과 현재 상태를 확인하세요.

## 문서 구조

```
┌─────────────────────────────────────────────────────────────┐
│  현재 상태                                                   │
│  └─ current-limits.md (현재 한계점 및 적정 규모)             │
├─────────────────────────────────────────────────────────────┤
│  메인 로드맵                                                 │
│  └─ overview.md (v2 로드맵 - Phase 0~6 전체)                 │
├─────────────────────────────────────────────────────────────┤
│  상세 계획                                                   │
│  ├─ scaling.md (Phase 0 Git 워크플로우 상세)                │
│  └─ reverse-extraction.md (Phase 1-R 역추출 상세)           │
├─────────────────────────────────────────────────────────────┤
│  참고 문서                                                   │
│  └─ enterprise.md (대규모 확장 - 참고용)                    │
└─────────────────────────────────────────────────────────────┘
```

## 빠른 링크

### 현재 상태

- [현재 한계점](./current-limits.md) - 도구의 현실적 한계와 적정 규모

### 메인 로드맵

- [로드맵 v2 (개요)](./overview.md) - **핵심 문서**, Phase별 계획 전체

### Phase별 상세

| Phase | 문서 | 설명 |
|-------|------|------|
| **Phase 0** | [Git 워크플로우](./scaling.md#phase-0-협업-기반-git-워크플로우) | 커밋 컨벤션, 브랜치 전략 |
| **Phase 1-G** | [도메인 설정](./overview.md#phase-1-g-greenfield-수동-도메인-설정) | Greenfield 수동 설정 |
| **Phase 1-R** | [역방향 추출](./reverse-extraction.md) | Brownfield 코드→스펙 |
| **Phase 2** | [코드 연결](./overview.md#phase-2-코드-컨텍스트-연결) | spec ↔ code 링크 |
| **Phase 3** | [태스크 DAG](./overview.md#phase-3-태스크-그래프-dag) | 의존성 기반 태스크 |
| **Phase 4** | [변경 기반](./overview.md#phase-4-변경-기반-작업-유도) | 스펙 diff → 태스크 |

### 참고 문서

- [엔터프라이즈 로드맵](./enterprise.md) - 대규모 확장 계획 (참고용, 범위 초과)

---

## 프로젝트 유형별 가이드

### Greenfield (신규 프로젝트)

```
시작 → Phase 0 → Phase 1-G → Phase 2 → Phase 3-4
```

1. [Git 워크플로우](./scaling.md) 설정
2. [도메인 수동 설정](./overview.md#phase-1-g-greenfield-수동-도메인-설정)
3. 스펙 작성 및 개발

### Brownfield (레거시 프로젝트)

```
시작 → Phase 0 → Phase 1-R → Phase 2 → Phase 3-4
```

1. [Git 워크플로우](./scaling.md) 설정
2. [역방향 스펙 추출](./reverse-extraction.md) (Serena MCP 활용)
3. 추출된 스펙 검토 및 확정
4. 이후 Greenfield와 동일

---

## 마일스톤

| 버전 | 내용 | 상태 |
|------|------|------|
| v1.x | 기본 CLI, 스펙 검증, Constitution | ✅ 완료 |
| v2.0 | Phase 0 + 1-G (도메인 시스템) | 예정 |
| v2.1 | Phase 1-R (역추출, Serena) | 예정 |
| v2.5 | Phase 2 + 3 (코드 연결, DAG) | 예정 |
| v3.0 | Phase 4 (변경 기반 작업) | 예정 |

상세 마일스톤은 [로드맵 v2](./overview.md#마일스톤) 참조.

---

## 핵심 메시지

```
이 도구의 정체성:
✅ Claude 사고 구조화 도구
✅ 소규모~중규모 신규 개발 최강
❌ 엔터프라이즈 플랫폼 아님
```

자세한 철학과 방향성은 [로드맵 v2](./overview.md#도구의-본질-재정의) 참조.
