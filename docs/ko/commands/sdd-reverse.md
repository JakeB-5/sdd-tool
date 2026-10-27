# /sdd.reverse

Claude Code로 기존 코드베이스에서 SDD 스펙 초안을 작성합니다 (스킬: `sdd-reverse`).

## 개요

`/sdd.reverse`(또는 `sdd-reverse` 스킬)는 Claude가 코드를 읽고 스펙 초안을 작성하게 하며,
`sdd reverse` CLI는 결정적인 부분(구조 스캔, 초안 검증, 리뷰 상태, 확정)을 담당합니다.
초안은 사용자가 승인한 후에만 정식 스펙이 됩니다.

## 워크플로우

```
scan → 코드 읽기 → 초안 작성 → validate → review (사용자 승인) → finalize
```

### 1. 스캔

Claude가 `sdd reverse scan --json`을 실행해 파일 목록, 언어 분포, 디렉토리 기반 도메인 후보와
도메인별 파일 목록을 얻습니다.

### 2. 코드 읽기

도메인별로 진입점, 공개 API, 데이터 모델, 검증/에러 처리, 기존 테스트를 읽고
기능 단위(스펙 1개 = 기능 1개)로 묶습니다.

### 3. 초안 작성

Claude가 `.sdd/.reverse-drafts/<domain>/<feature>/spec.md`를 `sdd new`와 같은 형식으로 작성합니다:
frontmatter(`id`, `title`, `status: draft`, `created`, `domain`, `depends`), 대문자 RFC 2119
키워드를 사용한 요구사항, GIVEN/WHEN/THEN 시나리오. 초안은 **관찰된 동작만** 기술하며,
의도가 불분명한 부분은 추측하지 않고 불확실하다고 표시합니다.

### 4. 검증

Claude가 `sdd validate .sdd/.reverse-drafts`를 실행하고 에러를 수정합니다.

### 5. 리뷰

Claude가 `sdd reverse review --list`를 실행하고 초안별 내용을 요약한 뒤, 승인·수정·거부 여부를
사용자에게 묻습니다.

### 6. 승인 / 거부 (사용자 확인 후)

```bash
sdd reverse review auth/login --approve
sdd reverse review auth/logout --reject --reason "두 기능이 섞여 있음"
```

검증 에러가 있는 초안은 승인할 수 없습니다. 리뷰 후 초안을 수정하면 다시 대기 상태가 됩니다.

### 7. 확정

```bash
sdd reverse finalize
```

승인된 초안이 `.sdd/specs/<domain>/<feature>/spec.md`로 이동하고, 필요하면 도메인이
`.sdd/domains.yml`에 등록되며 초안은 삭제됩니다. 기존 스펙은 `--force`가 있을 때만 덮어씁니다.

## 도구 권한

생성되는 `sdd-reverse` 스킬은 `Read`, `Glob`, `Grep`, `Write`, `Edit`, `Bash(sdd reverse *)`,
`Bash(sdd validate *)`를 허용합니다. 진행 중에 사용자 승인을 받아야 하므로 별도 컨텍스트(fork)가
아닌 메인 대화에서 실행됩니다.

## 관련 명령어

- [`sdd reverse`](/ko/cli/reverse) - CLI 레퍼런스
- [`/sdd.spec`](/ko/commands/sdd-spec) - 스펙 작성/수정
- [`/sdd.validate`](/ko/commands/sdd-validate) - 스펙 검증
