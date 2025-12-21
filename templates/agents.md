# AGENTS.md

> AI 에이전트 워크플로우 지침서

---

## 프로젝트 개요

**프로젝트**: {{PROJECT_NAME}}
**설명**: {{PROJECT_DESCRIPTION}}

---

## 디렉토리 구조

```
.sdd/
├── constitution.md    # 프로젝트 헌법
├── specs/             # 스펙 문서
│   └── <feature>/
│       └── spec.md
├── changes/           # 변경 제안
│   └── <id>/
│       ├── proposal.md
│       └── delta.md
└── templates/         # 템플릿
```

---

## 워크플로우

### 신규 기능

1. `/sdd:new` - 스펙 초안 작성
2. `/sdd:plan` - 구현 계획 수립
3. `/sdd:tasks` - 작업 분해
4. 구현 및 테스트
5. 리뷰 및 머지

### 변경 제안

1. `/sdd:change` - 제안서 작성
2. `/sdd:impact` - 영향도 분석
3. 리뷰 및 승인
4. `/sdd:apply` - 변경 적용
5. `/sdd:archive` - 아카이브

---

## 컨벤션

- 모든 스펙은 RFC 2119 키워드 사용
- 모든 요구사항은 GIVEN-WHEN-THEN 시나리오 포함
- 변경 시 반드시 영향도 분석 수행

---

## 참조

- [Constitution](./constitution.md)
- [Specs](./specs/)
