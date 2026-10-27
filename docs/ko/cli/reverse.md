# sdd reverse

기존 코드베이스에서 SDD 스펙 초안을 작성합니다.

## 개요

`sdd reverse`는 브라운필드 프로젝트의 SDD 도입을 돕습니다. CLI는 결정적인 부분(구조 스캔,
초안 검증, 리뷰 상태, 확정)만 담당하고, 코드를 읽고 스펙 초안을 작성하는 일은 AI가
`sdd-reverse` 스킬(Claude Code `/sdd-reverse`, Codex `$sdd-reverse`)로 수행합니다.

## 워크플로우

```
scan → (AI가 코드를 읽고 초안 작성) → validate → review → finalize
```

1. `sdd reverse scan --json` — 구조 스캔 및 도메인 후보
2. AI가 도메인별 코드를 읽고 `.sdd/.reverse-drafts/<domain>/<feature>/spec.md` 작성
3. `sdd validate .sdd/.reverse-drafts` — 에러 수정
4. `sdd reverse review --list` — 사용자에게 초안 제시
5. `sdd reverse review <ref> --approve` — 사용자 확인 후에만
6. `sdd reverse finalize` — 승인된 초안을 `.sdd/specs/`로 이동

## 하위 명령어

### scan

```bash
sdd reverse scan [path] [options]
```

디렉토리 구조를 스캔하여 실제 수치만 출력합니다: 파일 수, 소스 파일 수, 라인 수, 언어 분포,
디렉토리 기반 도메인 후보와 도메인별 파일 목록, 도메인에 배정되지 않은 소스 파일.
스캔은 프로젝트를 변경하지 않습니다.

| 옵션 | 설명 |
|------|------|
| `-i, --include <glob>` | glob에 맞는 파일만 포함 (반복 가능) |
| `-e, --exclude <glob>` | glob에 맞는 파일 제외 (반복 가능) |
| `-l, --language <lang>` | 특정 언어만, 언어 ID 또는 확장자 (`typescript`, `ts`) |
| `-d, --depth <n>` | 스캔 루트 기준 최대 디렉토리 깊이 (`0` = 루트 파일만, 기본 무제한) |
| `-o, --output <file>` | JSON 결과를 파일로도 저장 |
| `--json` | 표준 출력에 순수 JSON 출력 |

슬래시가 없는 glob은 위치와 관계없이 파일 이름에 매칭되고(`*.test.ts`), 슬래시가 있는 glob은
스캔 루트 기준 경로에 매칭됩니다(`src/legacy/**`). 백슬래시는 `/`로 처리합니다. 숨김 디렉토리
(`.next`, `.turbo` 등)와 `node_modules`, `bower_components`, `__pycache__`, `venv`, `dist`, `build`,
`out`, `coverage`는 모든 깊이(모노레포 패키지 포함)에서 건너뜁니다. 모호한 이름인 `vendor`, `target`은
스캔 루트나 패키지 매니페스트(`package.json`, `Cargo.toml`, `go.mod`, `composer.json`, `pom.xml`,
`build.gradle`)가 있는 디렉토리에서만 건너뜁니다(`src/vendor/`는 스캔됨).

도메인 후보는 `src/`, `lib/`, `packages/`, `modules/`, `apps/`의 하위 디렉토리와
스캔 루트의 그 밖의 최상위 디렉토리(예: `app/`)에서 추정합니다. 디렉토리 이름은 유효한 도메인 ID로
변환됩니다(`userProfile` → `user-profile`).

```bash
sdd reverse scan --json
sdd reverse scan src/ --exclude "*.test.ts" --language ts
```

JSON 구조:

```json
{
  "root": ".",
  "scannedAt": "2026-10-27T00:00:00.000Z",
  "options": {},
  "summary": { "fileCount": 42, "sourceFileCount": 38, "lines": 5120, "languages": { "typescript": 38 } },
  "domains": [
    { "id": "auth", "path": "src/auth", "fileCount": 6, "lines": 840,
      "languages": { "typescript": 6 }, "files": ["src/auth/login.ts", "..."] }
  ],
  "unassigned": ["src/index.ts"]
}
```

### review

```bash
sdd reverse review [ref] [--list] [--approve | --reject [--reason <text>]]
```

| 사용법 | 설명 |
|--------|------|
| `sdd reverse review` / `--list` | 모든 초안(대기/승인/거부)과 검증 결과 목록 |
| `sdd reverse review <ref>` | 초안 하나의 검증 결과와 내용 표시 |
| `sdd reverse review <ref> --approve` | 승인. 검증 에러가 있으면 거부됨 |
| `sdd reverse review <ref> --reject --reason "..."` | 거부. 수정할 수 있도록 초안 파일은 유지 |

`<ref>`는 `<domain>/<feature>` 또는 유일한 `<feature>`입니다. 결정은
`.sdd/.reverse-drafts/review.json`에 기록됩니다. 승인은 초안 내용의 해시에 묶여 있어, 리뷰 후
파일이 조금이라도 바뀌면(CRLF → LF 같은 줄바꿈 정규화 포함) 다시 대기 상태가 됩니다.

`review`가 검사하는 초안 규칙: `<domain>`은 유효한 도메인 ID, `<feature>`는 표준 기능 ID(소문자/숫자/하이픈)여야
하고, frontmatter `id`는 `<feature>`와, `domain`(지정 시)은 `<domain>`과 같아야 하며, 초안은
`.sdd/.reverse-drafts` 안의 실제 파일이어야 합니다(심볼릭 링크 초안은 거부).
`review.json`이 손상되면 에러로 보고되므로 파일을 수정하거나 삭제하세요.

### finalize

```bash
sdd reverse finalize [ref] [--all] [--force]
```

승인된 초안을 `.sdd/specs/<domain>/<feature>/spec.md`로 이동하고, 도메인이 없으면
`.sdd/domains.yml`에 등록(`sdd domain create`와 동일)한 뒤 스펙을 도메인에 연결하고 초안을
삭제합니다. ref를 생략하면 승인된 모든 초안을 확정합니다.

| 옵션 | 설명 |
|------|------|
| `-a, --all` | 승인된 모든 초안 확정 (기본 동작) |
| `-f, --force` | 기존 스펙 덮어쓰기 |

기존 스펙은 `--force` 없이 덮어쓰지 않습니다. 해당 초안은 건너뛰고 명령은 0이 아닌 종료 코드로
끝납니다.

## 파일

| 경로 | 설명 |
|------|------|
| `.sdd/.reverse-drafts/<domain>/<feature>/spec.md` | AI가 작성한 초안 |
| `.sdd/.reverse-drafts/review.json` | 리뷰 결정 |
| `.sdd/specs/<domain>/<feature>/spec.md` | 확정된 스펙 |
| `.sdd/domains.yml` | 도메인 레지스트리 (finalize가 갱신) |

## 참고

- [역추출 가이드](/ko/guide/reverse-extraction)
- [/sdd.reverse](/ko/commands/sdd-reverse)
- [sdd validate](/ko/cli/validate)
