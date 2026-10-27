# /sdd-implement

기능의 `tasks.md`를 작업 하나씩, 테스트 우선으로 구현하고 작업마다 커밋합니다.

## 사용법

```
/sdd-implement <feature>      # Claude Code
$sdd-implement <feature>      # Codex
```

## 인수

| 인수 | 설명 |
|------|------|
| feature | `<domain>/<feature>`(예: `auth/login`) 또는 프로젝트에서 유일한 기능 이름(예: `login`) |

## 동작

1. `sdd status`로 현재 진행 상황 확인
2. 기능의 `spec.md`와 `tasks.md`를 읽고, 완료되지 않았고 의존 작업이 모두 완료된 첫 번째 작업 선택
3. 아래 워크플로우대로, 엄격하게 테스트 우선으로 구현

## 규칙

- 한 번에 작업 하나
- 테스트 우선: 실패하는 테스트가 있기 전에는 구현 코드를 작성하지 않음
- 작업 상태는 `sdd new task <feature> <task-id> <status>`로만 변경(`pending`, `in-progress`, `completed`, `blocked`). 상태 줄이나 진행 집계를 손으로 고치지 않음 — 실행할 때마다 작업을 다시 파싱해 집계를 재계산
- 모든 커밋 메시지에 작업 ID 포함
- `.sdd/constitution.md`의 원칙 준수
- 스펙과 함께 만든 기능 브랜치(또는 현재 작업 브랜치)에서 작업하고, 작업마다 브랜치를 만들지 않음

## 작업별 워크플로우

1. `sdd new task <feature> <task-id> in-progress`
2. **Red**: 작업의 GIVEN-WHEN-THEN 시나리오를 테스트로 만들고 실행해 실패를 확인
3. **Green**: 테스트를 통과시키는 최소한의 코드 작성
4. **Refactor**: 모든 테스트를 통과시킨 채로 정리
5. `@spec` 추적성 참조 추가
6. `sdd new task <feature> <task-id> completed`
7. 커밋: `feat(<name>): <task-id> - <설명>` (`<name>`은 도메인을 뺀 기능 이름)

## 작업 ID와 상태

작업은 `.sdd/specs/<domain>/<feature>/tasks.md`의 `### <name>-task-NNN: 제목` 헤딩(예: `login-task-001`) 아래에 있으며, 각각 `**상태:**` 줄을 가집니다(영문 `**Status:**`도 파싱됩니다):

| 상태 | `**상태:**` 값 | `sdd new task` 인수 |
|------|----------------|---------------------|
| 대기 | 대기 | `pending` |
| 진행 중 | 진행 중 | `in-progress` |
| 완료 | 완료 | `completed` |
| 차단됨 | 차단됨 | `blocked` |

값은 파일이 이미 쓰고 있는 언어로 기록됩니다. [`sdd new task`](/ko/cli/new#sdd-new-task)를 참고하세요.

## 추적성

구현하는 모든 요구사항을 코드와 테스트에서 한정 형식 `<domain>/<feature>#REQ-xx`로 참조합니다:

```typescript
/**
 * @spec auth/login#REQ-01
 */
export function login(email: string, password: string) { ... }

it('auth/login#REQ-01: 유효한 자격 증명에 토큰을 발급한다', () => { ... });
```

여러 스펙이 `REQ-01`을 정의하면 한정하지 않은 `REQ-01`은 모호하므로 `sdd sync`가 무시합니다.

## 커밋 메시지

SDD commit-msg 훅은 Conventional Commits 타입(`feat`, `fix`, ...) 또는 스펙 타입(`spec`, `plan`, `tasks`, ...)을 쓴 `<type>(<scope>): <message>` 형식을 허용합니다. 전체 목록은 `AGENTS.md`의 SDD 블록에 있습니다.

## 위임

SDD 설정은 `sdd-implementer` 서브에이전트도 생성합니다. 독립적인 작업은 서브에이전트 이름과 함께 기능 ID·작업 ID를 넘겨 위임할 수 있습니다. 서브에이전트는 작업을 `in-progress`로 설정하고 결과를 보고하며, 작업을 완료 처리하거나 커밋하지는 않습니다. 변경 사항과 테스트 결과를 검토한 뒤 직접 작업을 완료 처리하고 커밋합니다(워크플로우 6~7단계).

## 예시

예시 대화입니다(요약본):

```
/sdd-implement auth/login

AI: sdd status: login 작업 1/4 완료.
    다음 작업: login-task-002 - 비밀번호 해싱 유틸리티

    $ sdd new task auth/login login-task-002 in-progress
    Red: tests/password.test.ts ('auth/login#REQ-02: ...') -> 실패 2건
    Green: src/password.ts -> 통과 2건
    $ sdd new task auth/login login-task-002 completed
    커밋: feat(login): login-task-002 - 비밀번호 해싱 유틸리티
```

## 완료 기준

모든 작업이 완료되면:

1. `sdd validate`로 최종 검증
2. `sdd sync <feature>` 실행: 모든 요구사항이 커버되어야 하며(SHOULD), 무시된 참조 경고가 없어야 함
3. `sdd new status <feature> implemented`
4. 커밋 후 PR을 열거나 머지
5. `/sdd-status`로 전체 진행 상황 확인

## 관련 명령어

- [`sdd new`](/ko/cli/new) - `sdd new task`, `sdd new status`
- [`sdd sync`](/ko/cli/sync) - `@spec` 커버리지 확인
- [`/sdd-tasks`](/ko/commands/sdd-tasks) - 작업 분해
- [`/sdd-validate`](/ko/commands/sdd-validate) - 스펙 검증
