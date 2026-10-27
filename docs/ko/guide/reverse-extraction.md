# 역추출 가이드

기존(브라운필드) 코드베이스에서 SDD 스펙 초안을 작성하는 방법입니다.

## 개요

역추출은 현재 코드의 동작을 SDD 스펙으로 옮기는 과정입니다. 역할은 다음과 같이 나뉩니다:

| 주체 | 역할 |
|------|------|
| `sdd reverse` CLI | 결정적인 작업: 구조 스캔, 초안 검증, 리뷰 상태, 확정 |
| AI (`sdd-reverse` 스킬 / `/sdd.reverse`) | 코드를 읽고 스펙 초안 작성 |
| 사용자 | 초안별 승인 또는 거부 |

별도의 외부 분석 서버는 필요하지 않습니다.

## 워크플로우

```
scan → 코드 읽기 → 초안 작성 → validate → review → finalize
```

Claude Code에서 `sdd-reverse` 스킬(또는 `/sdd.reverse`)을 실행하면 Claude가 모든 단계를
진행하며, 확정 전에 반드시 사용자 승인을 받습니다. 아래는 내부에서 일어나는 단계입니다.

### 1. 스캔

```bash
sdd reverse scan --json
```

스캔은 실제 수치만 보고합니다: 파일/라인 수, 언어 분포, 도메인 후보와 파일 목록, 도메인에
배정되지 않은 소스 파일. 도메인 후보는 `src/`, `lib/`, `packages/`, `modules/`, `apps/`의
하위 디렉토리와 그 밖의 최상위 디렉토리(예: `app/`)에서 추정합니다. 출발점으로만 사용하고, 코드 구조에 맞게
도메인을 합치거나 나누거나 이름을 바꾸세요.

유용한 옵션:

```bash
sdd reverse scan src/payments/ --json          # 하위 트리만
sdd reverse scan --json --exclude "*.test.ts"  # 파일 목록에서 테스트 제외
sdd reverse scan --json --language py          # 특정 언어만
sdd reverse scan --depth 2                     # 얕은 개요
```

### 2. 코드 읽기

AI가 도메인별 진입점, 공개 API, 데이터 모델, 검증/에러 처리, 그리고 의도된 동작의 가장 좋은
근거인 기존 테스트를 읽고 기능 단위로 묶습니다. 스펙 하나는 기능 하나를 기술합니다.

### 3. 초안 작성

초안은 `.sdd/.reverse-drafts/<domain>/<feature>/spec.md`에 `sdd new`와 같은 형식으로 작성합니다:

```markdown
---
id: login
title: 로그인
status: draft
created: 2026-10-27
domain: auth
depends: []
---

# 로그인

> 사용자 이름과 비밀번호로 사용자를 인증한다.

## 개요

`src/auth/login.ts`에 구현됨. 불확실: 잠금 카운터가 초기화되지 않음.

## 요구사항

### REQ-01: 자격 증명 확인

시스템은 비밀번호가 일치하지 않으면 로그인을 거부해야 한다(SHALL).

## 시나리오

### Scenario 1: 잘못된 비밀번호

- **GIVEN** 등록된 사용자
- **WHEN** 잘못된 비밀번호를 제출하면
- **THEN** 로그인이 거부된다
```

초안 규칙:

- 관찰된 동작만 기술하고 요구사항을 만들어내지 않습니다.
- 의도가 불분명하면 추측하지 말고 개요에 불확실하다고 표시합니다.
- `<domain>`은 유효한 도메인 ID(영문 소문자로 시작, 소문자/숫자/하이픈)여야 합니다.
- RFC 2119 키워드는 대문자로, 요구사항 1개 이상과 GIVEN/WHEN/THEN 시나리오 1개 이상이 필요합니다.

초안을 직접 작성하거나 수정해도 CLI는 동일하게 처리합니다.

### 4. 검증

```bash
sdd validate .sdd/.reverse-drafts
```

### 5. 리뷰

```bash
sdd reverse review --list               # 모든 초안, 상태, 검증 결과
sdd reverse review auth/login           # 초안 상세
sdd reverse review auth/login --approve
sdd reverse review auth/logout --reject --reason "두 기능이 섞여 있음"
```

- 검증 에러가 있는 초안은 승인할 수 없습니다.
- 거부된 초안은 수정 후 다시 리뷰할 수 있도록 유지됩니다.
- 승인은 초안 내용의 해시에 묶여 있어, 리뷰 후 조금이라도 바뀌면(CRLF → LF 정규화 포함) 다시
  대기 상태가 되므로 승인은 항상 최종 내용을 기준으로 합니다.
- 결정은 `.sdd/.reverse-drafts/review.json`에 기록됩니다.

### 6. 확정

```bash
sdd reverse finalize                 # 승인된 모든 초안
sdd reverse finalize auth/login      # 특정 초안
sdd reverse finalize --force         # 기존 스펙 덮어쓰기
```

finalize는 승인된 초안을 `.sdd/specs/<domain>/<feature>/spec.md`로 이동하고, 없는 도메인을
`.sdd/domains.yml`에 등록하고, 스펙을 도메인에 연결한 뒤 초안을 삭제합니다. 기존 스펙은
`--force` 없이 덮어쓰지 않습니다.

## 모범 사례

- **도메인 단위로 진행하세요.** 하위 트리를 스캔하고 한 도메인의 초안 작성·리뷰·확정을 마친 뒤 다음으로 넘어갑니다.
- **테스트를 근거로 삼으세요.** 테스트로 뒷받침되는 요구사항이 가장 신뢰할 수 있습니다.
- **스펙을 작게 유지하세요.** 기능 하나당 스펙 하나가 리뷰와 이후 변경에 유리합니다.
- **불확실성을 기록하세요.** 확신에 찬 추측보다 "불확실: ..." 메모가 낫습니다.
- **확정 후 검증하세요.** `sdd validate`를 실행하고 `sdd domain`으로 도메인을 조정합니다.

## 문제 해결

| 문제 | 해결 |
|------|------|
| `검증에 실패한 초안은 승인할 수 없습니다` | `sdd reverse review <ref>`로 에러를 확인하고 초안을 고친 뒤 다시 승인 |
| finalize 시 `이미 스펙이 존재합니다` | 기존 스펙에 수동으로 병합하거나 `--force`로 다시 실행 |
| `review.json`이 손상되었다고 보고됨 | JSON을 고치거나 파일을 삭제 (모든 초안이 대기 상태가 됨) |
| 도메인 후보가 잘못됨 | 원하는 도메인 아래에 초안을 작성하면 finalize가 등록 |
| 초안이 목록에 없음 | `.sdd/.reverse-drafts/<domain>/<feature>/spec.md` 위치여야 함 |

## 관련 문서

- [sdd reverse CLI](/ko/cli/reverse)
- [/sdd.reverse](/ko/commands/sdd-reverse)
- [브라운필드 튜토리얼](/ko/tutorial/brownfield)
- [도메인](/ko/guide/domains)
