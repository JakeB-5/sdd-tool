# /sdd-tasks

구현 계획을 실행 가능한 작업 단위로 분해합니다.

## 사용법

```
/sdd-tasks <feature>
```

Codex에서는 `$sdd-tasks <feature>`로 호출합니다.

## 인수

| 인수 | 설명 |
|------|------|
| feature | `<domain>/<feature>` 또는 프로젝트에서 유일한 기능 이름 (예: `auth/login` 또는 `login`) |

## 동작

1. 기능의 `spec.md`와 `plan.md`를 읽고 구현 단계를 검토
2. 기능의 `tasks.md`에 작업 작성:
   - `--all`로 만든 기능(`/sdd-spec` 기본)은 이미 플레이스홀더 작업이 든 `tasks.md`가 있습니다. 그 파일을 편집하고, `sdd new tasks`를 다시 실행하지 않습니다
   - 파일이 없을 때만 `sdd new tasks <feature>`로 템플릿 생성
   - `--force`는 파일을 처음부터 다시 만들며 내용을 버립니다. 요청받았을 때만 사용합니다
3. 플레이스홀더 작업을 실제 분해 결과로 교체하고, 각 작업에 우선순위, 의존성, 대기 상태를 지정
4. 상태는 바꾸지 않고 새 목록의 집계만 갱신: `sdd new task <feature> <first-task-id> pending`
5. 필요하면 단계 기록: `sdd new status <feature> tasked`

## 생성 파일

```
.sdd/specs/<domain>/<feature>/tasks.md
```

## 작업 규칙

- 각 작업은 2-4시간 내에 완료 가능해야 합니다
- 작업 ID는 `<name>-task-NNN`이며 `<name>`은 도메인을 뺀 기능 이름입니다 (`login-task-001`, `login-task-002`, ...). 제목은 `### <task-id>: 제목` 헤딩에 적습니다
- 의존성은 작업 ID 또는 `없음`
- 우선순위: HIGH (🔴), MEDIUM (🟡), LOW (🟢)
- 구현 작업은 테스트 우선입니다. 작업이 시나리오에 대한 실패 테스트를 먼저 쓰고 코드를 작성합니다. 구현 뒤에 별도의 "테스트 작성" 작업을 두지 않습니다

## 작업 형식

```markdown
### login-task-001: 비밀번호 해싱 유틸리티

- **상태:** 대기
- **우선순위:** 🔴 HIGH
- **설명:** REQ-01 시나리오에 대한 실패 테스트를 먼저 작성한 뒤 해싱 구현
- **의존성:** 없음
```

상태 값: `대기`(pending), `진행 중`(in-progress), `완료`(completed), `차단됨`(blocked), `없음`(none). 영어 라벨(`**Status:**`, `**Priority:**`, `**Description:**`, `**Dependencies:**`)과 영어 값도 파싱됩니다. 파일이 이미 쓰는 형식을 유지하세요.

## 상태와 집계 갱신

작업 상태와 진행 집계는 직접 고치지 않습니다. 구현 중에는(`/sdd-implement` 참고):

```bash
sdd new task login login-task-001 in-progress   # pending | in-progress | completed | blocked
sdd new task login login-task-001 completed
```

`sdd new task`는 실행할 때마다, 상태가 그대로여도, 파싱한 작업으로 집계(frontmatter `total:` / `completed:`, `> 총 N개 작업` 줄, `## 진행 상황` 블록)를 다시 계산합니다. 작업 목록을 편집한 뒤에는 작업의 현재 상태로 다시 실행해 집계만 갱신하세요.

## 예시

```
/sdd-tasks auth/login

AI: spec.md와 plan.md를 읽습니다.
    -> tasks.md가 이미 있습니다(sdd new --all로 생성). 그대로 편집합니다.
    -> 플레이스홀더 작업 3개를 작업 5개(login-task-001 ... login-task-005)로 교체했습니다.
    -> 실행: sdd new task login login-task-001 pending   (집계 갱신)
```

## 다음 단계

```
/sdd-prepare    -> 도구 점검 (선택)
/sdd-implement  -> 구현 시작
```

## 관련 명령어

- [`sdd new`](/ko/cli/new) - `sdd new task` / `sdd new status`
- [`/sdd-plan`](/ko/commands/sdd-plan) - 구현 계획
- [`/sdd-implement`](/ko/commands/sdd-implement) - 구현
