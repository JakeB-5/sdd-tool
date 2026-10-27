# /sdd-validate

`sdd validate`로 스펙을 검증하고 보고된 에러를 고칩니다.

## 사용법

```
/sdd-validate [path] [--strict]
```

Codex에서는 `$sdd-validate`로 호출합니다.

## 인수

| 인수 | 설명 |
|------|------|
| path | 검증할 스펙 파일 또는 디렉토리 (생략 시 전체) |
| --strict | 경고도 에러로 처리 |

## 동작

스킬이 CLI를 실행하고 보고된 문제를 고칩니다:

```bash
# 전체 스펙 검증
sdd validate

# 특정 파일 검증 (도메인 기반 경로)
sdd validate .sdd/specs/auth/login/spec.md

# 엄격 모드 (경고도 에러로 처리)
sdd validate --strict
```

검증이 실패하면 스킬이 지적된 파일을 열어 보고된 에러를 수정하고(각 메시지에 해결 방법이 있습니다) `sdd validate`를 다시 실행합니다.

더 깊은 읽기 전용 리뷰(RFC 2119 사용, 시나리오 커버리지, Constitution 준수)가 필요하면 `sdd init`이 생성하는 `sdd-spec-reviewer` 서브에이전트에 위임할 수 있습니다. 이 서브에이전트는 파일을 수정하지 않고 문제만 보고합니다.

## 검증 항목

### 에러

- YAML frontmatter 형식
- 필수 메타데이터: id, title, status
- 마크다운 문법

### 경고

- RFC 2119 키워드 사용 (SHALL, MUST, SHOULD, MAY, ...)
- GIVEN-WHEN-THEN 시나리오 형식
- 요구사항 ID 형식 (`### REQ-01: 제목`)
- `[요구사항 제목]` 같은 템플릿 플레이스홀더 잔존

### Constitution

- `constitution_version` 일치
- 금지 사항 위반 (`--no-constitution`으로 건너뜀)

## 예시

```
/sdd-validate

AI: sdd validate를 실행합니다.

    ✓ auth/user-auth/spec.md
    ⚠ auth/profile/spec.md
      - RFC 2119 키워드 없음
    ✗ common/settings/spec.md
      - 필수 필드 'id' 없음

    결과: 1개 통과, 1개 실패, 1개 경고
    -> common/settings/spec.md와 auth/profile/spec.md를 수정하고 sdd validate를 다시 실행합니다.
```

## 검증 통과 후

이미 구현된 기능이라면 `sdd sync`도 실행해 모든 요구사항이 코드나 테스트에서 참조되는지(`@spec <domain>/<feature>#REQ-xx`) 확인하세요.

1. `git add .sdd/` - 스펙 변경 스테이징
2. `git commit -m "spec: <설명>"` - 커밋
3. PR을 열고 리뷰 요청

커밋 메시지는 commit-msg 훅 형식 `<type>(<scope>): <message>`를 따릅니다. type은 스펙 타입(`spec`, `spec-update`, `spec-status`, `plan`, `tasks`, `constitution`, `sdd-config`) 또는 Conventional Commits 타입(`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, ...)입니다. scope는 생략할 수 있고, `Merge ...` / `Revert ...` 메시지도 허용됩니다.

## CI/CD 연동

```bash
sdd validate --strict --quiet
```

에러나 경고가 있으면 종료 코드 1을 반환합니다.

## 관련 명령어

- [`sdd validate`](/ko/cli/validate) - CLI 레퍼런스
- [`sdd sync`](/ko/cli/sync) - 스펙-코드 추적성
- [`/sdd-spec`](/ko/commands/sdd-spec) - 스펙 작성/수정
