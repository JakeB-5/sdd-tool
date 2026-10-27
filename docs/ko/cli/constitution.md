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
| `version` | 현재 헌법 버전 표시 |
| `bump` | 헌법 버전 업데이트 |
| `validate` | 헌법 유효성 검증 |
| `history` | 헌법 변경 이력 |

## 옵션

| 커맨드 | 옵션 | 설명 |
|--------|------|------|
| `show` | `--json` | JSON 형식으로 출력 |
| `bump` | `--major` / `--minor` / `--patch` | 올릴 버전 부분 (핵심 원칙 변경 / 새 원칙 추가 / 문구 수정). 버전 부분은 필수 |
| `bump` | `-m, --message <message>` | 변경 사유 |
| `history` | `-n, --count <count>` | 표시할 항목 수 (기본: 10) |

```bash
sdd constitution bump --minor -m "보안 원칙 추가"
```

## 헌법(Constitution)이란?

프로젝트의 핵심 원칙과 규칙을 정의한 문서입니다. 스펙은 `constitution_version`으로 이 문서의 버전을 참조하며,
`sdd validate`가 둘을 비교합니다([sdd validate](./validate) 참고).

### 구성 요소

- **핵심 원칙** (`## 핵심 원칙`): 번호가 붙은 `### N. 제목` 항목과 `-` 규칙
- **기술 스택** (`## 기술 스택`)과 **품질 기준** (`## 품질 기준`): `-` 줄
- **금지 사항** (`## 금지 사항`): `SHALL NOT` / `MUST NOT`이 들어 있는 규칙

## 예시

### 헌법 조회

```bash
sdd constitution show
```

출력:
```
ℹ Constitution: My Project
ℹ 버전: 1.0.0
ℹ 설명: One-line description of the project's principles.

ℹ 핵심 원칙:
• P1. User First
  • User experience SHALL be the basis of all decisions
• P2. Data Protection
  • User data safety SHALL be the top priority

ℹ 금지 사항:
• The `any` type SHALL NOT be used
• Hardcoded secrets MUST NOT be committed
```

### 헌법 검증

```bash
sdd constitution validate
```

출력:
```
✓ Constitution 검증 통과
ℹ 프로젝트: My Project
ℹ 버전: 1.0.0
ℹ 원칙 수: 2
ℹ 금지 사항 수: 2
```

파일을 파싱할 수 없으면(예: `# Constitution: <name>` 제목 없음) 종료 코드 2로 끝납니다.

### 버전 올리기와 이력 조회

```bash
sdd constitution bump --minor -m "테스트 커버리지 기준 추가"
# ✓ Constitution 버전 업데이트: 1.0.0 → 1.1.0
sdd constitution history
```

`bump`는 frontmatter의 `version:` / `updated:`를 갱신하고 변경 내용을 `.sdd/CHANGELOG.md`에 기록합니다.

## 헌법 파일 구조

```markdown
---
version: 1.0.0
created: 2025-01-01
updated: 2025-01-07
---

# Constitution: my-project

> 한 줄 설명.

## 핵심 원칙

### 1. 품질 우선

- 코드 품질은 타협할 수 없다(SHALL)
- 테스트 없는 코드는 배포해서는 안 된다(SHALL NOT)

## 기술 스택

- 언어: TypeScript

## 품질 기준

- 테스트 커버리지는 80% 이상이어야 한다(SHALL)

## 금지 사항

- `any` 타입을 사용해서는 안 된다(SHALL NOT)
- 프로덕션 코드에 console.log를 남겨서는 안 된다(MUST NOT)
```

자세한 작성법은 [Constitution 작성 가이드](/ko/spec-writing/constitution)를 참고하세요.

## 관련 문서

- [sdd validate](./validate) - 스펙 검증
- [sdd start](./start) - 워크플로우 시작
- [CLI 참고 문서](./) - 전체 명령어
