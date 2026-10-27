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

### 에러 (파일이 실패 처리됨)

- 닫히지 않았거나 잘못된 YAML frontmatter, 또는 메타데이터 타입/값 오류 (메타데이터 필드 자체, 즉 `id`, `title`, `status`는 선택이며 `status` 기본값은 `draft`)
- `# 제목` 헤딩 없음
- 대문자 RFC 2119 키워드(SHALL, MUST, SHOULD, MAY, ...)를 쓴 요구사항이 없음
- GIVEN-WHEN-THEN 시나리오가 없음
- 치명적(critical) Constitution 위반, `constitution_version`의 major 불일치

### 경고

- `created` 날짜 없음 (W001)
- 깨진 링크, `--check-links` 사용 시에만 (W002)
- 치명적이지 않은 Constitution 위반 (W003), `constitution_version`의 minor 불일치 (W004)
- `[요구사항 제목]` 같은 템플릿 플레이스홀더 잔존 (W005)
- 더 이상 쓰지 않는 `status` 별칭 (W006)
- Constitution 파싱 실패로 검사를 건너뜀 (W007)
- 소문자 RFC 2119 키워드 (W008)

Constitution 검사는 기본으로 실행되며 `--no-constitution`으로 건너뜁니다.

## 예시

```
/sdd-validate

AI: sdd validate를 실행합니다.

    ✓ billing/invoice/spec.md
    ✗ common/bad/spec.md
      - Requirement에 RFC 2119 키워드(SHALL, MUST, SHOULD, MAY)가 없습니다
      - Scenario에 GIVEN-WHEN-THEN 형식이 없습니다
      ⚠ RFC 2119 키워드는 대문자로 작성하세요 (소문자 발견: shall → SHALL)
      ⚠ YAML frontmatter에 created 날짜가 없습니다

    결과: 1개 통과, 1개 실패, 1개 경고
    -> common/bad/spec.md를 수정하고 sdd validate를 다시 실행합니다.
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

검증에 실패한 파일이 있으면 종료 코드 2를 반환하며, `--strict`에서는 경고만 있어도 2를 반환합니다. 종료 코드 1은 일반 오류입니다.

## 관련 명령어

- [`sdd validate`](/ko/cli/validate) - CLI 레퍼런스
- [`sdd sync`](/ko/cli/sync) - 스펙-코드 추적성
- [`/sdd-spec`](/ko/commands/sdd-spec) - 스펙 작성/수정
