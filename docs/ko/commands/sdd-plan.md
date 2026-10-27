# /sdd-plan

기존 스펙의 구현 계획(`plan.md`)을 작성합니다.

## 사용법

```
/sdd-plan <feature>      # Claude Code
$sdd-plan <feature>      # Codex
```

## 인수

| 인수 | 설명 |
|------|------|
| feature | `<domain>/<feature>`(예: `auth/login`) 또는 프로젝트에서 유일한 기능 이름(예: `login`) |

## 동작

1. `.sdd/specs/`를 살펴 계획할 기능을 확인
2. 기능의 `spec.md`를 읽고 요구사항을 분석
3. 기능의 `plan.md`에 계획 작성:
   - `--all`로 만든 기능(`/sdd-spec` 기본값)에는 이미 `plan.md`가 있으므로 제자리에서 편집하고 `sdd new plan`을 다시 실행하지 않음
   - 파일이 없을 때만 `sdd new plan <feature>`로 템플릿을 생성
   - `--force`는 파일을 처음부터 다시 생성하며 내용이 사라지므로, 요청받았을 때만 사용
4. 선택적으로 단계를 기록: `sdd new status <feature> planned`

## 계획 작성 규칙

- 각 기술 결정과 그 근거를 명시
- 작업을 명확한 구현 단계(Phase)로 나눔
- 단계별 예상 산출물 나열
- 리스크 분석과 완화 전략 포함
- 테스트 전략 정의

## 대상 파일

```
.sdd/specs/<domain>/<feature>/plan.md
```

## 계획 구조

```markdown
## Technical Decisions
### Decision 1: [Title]
**Rationale:** [Why this technology or approach was chosen]

## Implementation Phases
### Phase 1: Foundation
[Description]
**Deliverables:**
- [ ] Deliverable 1
- [ ] Deliverable 2

### Phase 2: Core Logic
[Description]
**Deliverables:**
- [ ] Deliverable 1

## Risk Analysis
| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| [risk] | High/Medium/Low | [strategy] |

## Testing Strategy
[Describe unit, integration, and e2e coverage approach]
```

섹션 제목은 스킬이 사용하는 영문 구조를 그대로 따릅니다.

## 예시

예시 대화입니다(요약본):

```
/sdd-plan auth/login

AI: .sdd/specs/auth/login/spec.md를 읽었습니다 (요구사항 3개).
    기존 plan.md를 편집합니다:
    - 결정: 비밀번호 해싱은 bcrypt, JWT는 httpOnly 쿠키
    - Phase 1: 데이터 모델 / Phase 2: 인증 서비스 / Phase 3: API 엔드포인트
    - 리스크: 토큰 탈취 (High) -> 짧은 만료 + 리프레시 토큰
    - 테스트: REQ별 단위 테스트, 로그인 엔드포인트 통합 테스트
    $ sdd new status auth/login planned
```

## 다음 단계

계획을 작성한 후 작업으로 분해합니다:

```
/sdd-tasks <feature>  -> 작업 분해
```

## 관련 명령어

- [`sdd new`](/ko/cli/new) - `sdd new plan`, `sdd new status`
- [`/sdd-spec`](/ko/commands/sdd-spec) - 스펙 작성
- [`/sdd-tasks`](/ko/commands/sdd-tasks) - 작업 분해
