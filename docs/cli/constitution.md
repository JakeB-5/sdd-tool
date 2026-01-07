# sdd constitution

프로젝트 헌법(Constitution)을 관리합니다.

## 사용법

```bash
sdd constitution [command] [options]
```

## 서브커맨드

| 커맨드 | 설명 |
|--------|------|
| `show` | 현재 헌법 표시 |
| `validate` | 헌법 유효성 검증 |
| `history` | 헌법 변경 이력 |
| `diff` | 헌법 변경사항 비교 |

## 옵션

| 옵션 | 설명 |
|------|------|
| `--json` | JSON 형식으로 출력 |
| `--verbose` | 상세 정보 출력 |

## 헌법(Constitution)이란?

프로젝트의 핵심 원칙과 규칙을 정의한 문서입니다. 모든 스펙은 헌법을 준수해야 합니다.

### 구성 요소

- **Core Principles**: 핵심 원칙 (불변)
- **Technical Principles**: 기술 원칙
- **Forbidden**: 금지 사항
- **Guidelines**: 권장 사항

## 예시

### 헌법 표시

```bash
sdd constitution show
```

출력:
```
=== Constitution: my-project ===

📋 핵심 원칙 (Core Principles):
  • 품질 우선: 코드 품질은 타협 불가
  • 명세 우선: 코드보다 명세가 먼저

🔧 기술 원칙 (Technical Principles):
  • TypeScript 사용
  • ESLint + Prettier 적용
  • 테스트 커버리지 80% 이상

🚫 금지 사항 (Forbidden):
  • any 타입 사용 금지
  • console.log 프로덕션 코드 금지
```

### 헌법 검증

```bash
sdd constitution validate
```

출력:
```
🔍 헌법 검증 중...

✅ 필수 섹션 존재
✅ RFC 2119 키워드 사용
✅ 원칙 정의 완료

검증 결과: 유효함
```

### 헌법 변경 이력

```bash
sdd constitution history
```

출력:
```
=== 헌법 변경 이력 ===

v1.2.0 (2025-01-05)
  - 테스트 커버리지 기준 70% → 80% 상향

v1.1.0 (2024-12-20)
  - ESLint flat config 마이그레이션

v1.0.0 (2024-12-01)
  - 초기 헌법 정의
```

## 헌법 파일 구조

```markdown
---
version: 1.0.0
created: 2025-01-01
updated: 2025-01-07
---

# Constitution: my-project

## Core Principles

프로젝트의 핵심 원칙을 정의합니다.

### 품질 우선

- 코드 품질은 타협할 수 없습니다(SHALL)
- 테스트 없는 코드는 배포하지 않습니다(MUST)

## Technical Principles

기술적 결정 사항을 정의합니다.

### 언어 및 도구

- TypeScript를 사용해야 합니다(SHALL)
- ESLint와 Prettier를 적용해야 합니다(SHOULD)

## Forbidden

금지되는 패턴을 명시합니다.

- any 타입 사용(SHALL NOT)
- console.log 프로덕션 코드(MUST NOT)
```

## 관련 문서

- [sdd validate](/cli/validate) - 스펙 검증
- [sdd start](/cli/start) - 워크플로우 시작
- [헌법 작성 가이드](/guide/constitution)
