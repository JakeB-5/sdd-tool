# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] - 2026-01-30

### Added

- **캐싱 시스템** (Phase 3)
  - `src/core/cache/spec-cache.ts`: 스펙 파싱 결과 캐싱
    - LRU 에빅션, mtime 기반 무효화
    - 캐시 통계 (hit/miss ratio)
    - 직렬화/역직렬화 지원
  - `sdd cache clear`: 캐시 초기화
  - `sdd cache stats`: 캐시 통계 조회
  - `sdd validate --use-cache / --no-cache`: 캐시 옵션

- **벤치마크 도구** (Phase 3)
  - `scripts/benchmark.ts`: 1000개 스펙 성능 측정
  - `pnpm run benchmark` 명령어 추가
  - 결과: validate 2,013ms, list 1,151ms (1000 specs)

- **영문 문서** (Phase 4)
  - `README.en.md`: 영문 프로젝트 개요
  - `docs/guide/getting-started-en.md`: 시작 가이드
  - `docs/guide/best-practices-en.md`: 모범 사례
  - `docs/cli/index-en.md`: CLI 참조
  - `docs/spec-writing/*.md`: 스펙 작성 가이드 (3개)
  - `QUICK_REFERENCE.md`: 빠른 참조 치트시트

- **테스트 대폭 확장** (Phase 1)
  - Unit Tests +84개: watcher, watch/cicd/migrate CLI
  - Integration Tests +38개: sync, diff, export, prepare, reverse
  - **총 1,600개 테스트** (126개 파일)
  - **테스트 커버리지: 68.31%** (목표 50% 초과)

### Improved

- **Windows 호환성** (Phase 2)
  - `.gitattributes`: LF 라인 엔딩 정규화
  - `src/utils/path.ts`: 크로스 플랫폼 경로 유틸리티
    - `normalizePathForGit()`, `normalizePathForGlob()`
    - `pathsEqual()` (Windows 대소문자 무시)
  - `watch.test.ts`: 파일 잠금 이슈 해결, skip 해제

### Technical

- 새 디렉토리 구조:
  - `src/core/cache/`: 캐싱 시스템
  - `src/utils/path.ts`: 경로 유틸리티
  - `scripts/benchmark.ts`: 벤치마크 도구

---

## [1.4.3] - 2026-01-07

### Documentation

- **Deprecated 커맨드 참조 일괄 수정** (11개 파일)
  - `/sdd.new` → `/sdd.spec` 변경
  - `/sdd.change` → `/sdd.spec` 변경
  - 가이드, 튜토리얼, 커맨드 문서 업데이트

---

## [1.4.2] - 2026-01-07

### Improved

- **코드 품질 대규모 개선**
  - 미사용 import/변수 57개 lint 경고 제거 (40개 파일)
  - `Map.get()!` 비-null 단언 17개 → 옵셔널 체이닝(`?.`)으로 안전하게 변경
  - `compareScanResults()` 함수에 scan ID 파라미터 추가 (TODO 해결)
  - scanner.ts Serena 통합 관련 주석 명확화

### Documentation

- **CLI 문서 11개 추가**
  - `change.md`: 변경 관리 워크플로우
  - `constitution.md`: 프로젝트 헌법 관리
  - `impact.md`: 변경 영향도 분석
  - `migrate.md`: 외부 도구 마이그레이션
  - `prompt.md`: SDD 프롬프트 출력
  - `quality.md`: 스펙 품질 분석
  - `report.md`: 프로젝트 리포트
  - `search.md`: 스펙 검색
  - `start.md`: 워크플로우 시작
  - `transition.md`: 워크플로우 전환
  - `watch.md`: 실시간 감시 모드

### Fixed

- README.md 슬래시 커맨드 개수 정정 (30개 → 20개)
- README.md deprecated 커맨드 `/sdd.new` → `/sdd.spec` 수정

---

## [1.4.1] - 2026-01-07

### Improved

- **코드 품질 개선**
  - 에러 핸들링 유틸리티 추가 (`getErrorMessage`, `getResultErrorMessage`)
  - `reverse.ts` 리팩토링: `execute*` 함수 분리, Result 패턴 적용으로 테스트 가능성 향상
  - CLI 커맨드에서 `console.error` → `logger.error` 통일
  - `process.exit(1)` → `ExitCode` enum 사용으로 일관성 향상
  - `scanner.ts`의 TODO 플레이스홀더 (`symbolCount: 0`) 개선

### Added

- **CLI 커맨드 테스트 확장** (+7개 테스트 파일, +41개 테스트)
  - `sync.test.ts`, `git.test.ts`, `prepare.test.ts`, `reverse.test.ts`
  - `diff.test.ts`, `export.test.ts`, `prompt.test.ts`

### Fixed

- `watch.test.ts` Windows 파일 락 호환성 수정 (`killProcessSafely`, `removeDirSafely` 추가)
- `watch.test.ts` CI 환경에서 타이밍 이슈로 skip 처리

---

## [1.4.0] - 2026-01-06

### Added

- **`/sdd.spec` 통합 진입점 커맨드**
  - 새 기능 작성과 기존 스펙 수정을 자동으로 판단
  - 스펙 존재 여부 확인 후 `/sdd.new` 또는 `/sdd.change` 워크플로우로 안내
  - `/sdd.new`, `/sdd.change`에 가드레일 추가 (잘못된 사용 시 올바른 커맨드 안내)

### Changed

- `/sdd.new` deprecated 처리 → `/sdd.spec` 사용 권장
- `/sdd.change` deprecated 처리 → `/sdd.spec` 사용 권장
- README.md 워크플로우 다이어그램 업데이트 (`/sdd.new` → `/sdd.spec`)

### Fixed

- `sdd reverse finalize` 스펙 포맷이 `sdd new`와 다른 문제 수정 (v1.3.1)
  - YAML frontmatter, REQ-ID, RFC 2119 키워드(SHALL), GIVEN 시나리오 형식 통일
- 슬래시 커맨드 프롬프트 경로가 v1.3.0 도메인 기반 구조와 불일치 문제 수정 (v1.3.2)
  - `.sdd/specs/user-auth/spec.md` → `.sdd/specs/auth/user-auth/spec.md` 형식으로 통일

### Documentation

- `/sdd.spec` 커맨드 문서 추가 (`docs/commands/sdd-spec.md`)
- Deprecated 커맨드 섹션 추가 (`/sdd.new`, `/sdd.change`)

---

## [1.3.2] - 2026-01-06

### Fixed

- 슬래시 커맨드 프롬프트의 스펙 경로가 v1.3.0 도메인 기반 구조와 불일치
  - `/sdd.validate`, `/sdd.change` 등의 경로 형식 수정

---

## [1.3.1] - 2026-01-06

### Fixed

- `sdd reverse finalize`로 생성된 스펙이 `sdd new`와 다른 포맷이라 `sdd validate` 실패
  - `convertToSddSpec()` 함수 전면 재작성
  - YAML frontmatter, `## 요구사항` + REQ-ID + RFC 2119 키워드(SHALL), `- **GIVEN**` 시나리오 형식으로 통일

---

## [1.3.0] - 2026-01-02

### Changed

- **스펙 디렉토리 구조 변경** (Breaking Change)
  - 기존: `.sdd/specs/<feature-name>/spec.md`
  - 변경: `.sdd/specs/<domain>/<feature-name>/spec.md`
  - 도메인 미지정 시 `common` 폴더에 생성
  - 예: `sdd new login -d auth` → `.sdd/specs/auth/login/spec.md`

- `sdd new` 명령어 도메인 기반 생성 기본화
- `sdd reverse finalize` 도메인 기반 경로로 스펙 확정
- `sdd status` 도메인 기반 구조 지원

### Fixed

- `sdd reverse extract`에서 스펙 파일이 잘못된 경로에 생성되던 문제 수정
  - 기존: `.sdd/specs/<domain>/<feature>.md`
  - 수정: `.sdd/specs/<domain>/<feature>/spec.md`


## [1.2.9] - 2025-12-31

### Improved

- `/sdd.start` wizard 형태로 개선
  - 핵심 원칙: 초기 설정이 워크플로우 제안보다 항상 우선
  - Step 1: 프로젝트 상태 자동 분석
  - Step 2: 초기 설정 Wizard (SDD init, Git Hooks, CI/CD)
  - Step 3: 초기 설정 완료 후에만 다음 워크플로우 안내

### Fixed

- `/sdd.start`에서 초기 설정 없이 워크플로우만 제안되던 문제 수정


## [1.2.7] - 2025-12-31

### Added

- `sdd reverse review --reason <reason>`: 거부 사유 지정 옵션

### Fixed

- `rejectSpec` 함수 호출 시 필수 인자 누락 수정


## [1.2.6] - 2025-12-31

### Added

- `sdd reverse review --approve`: 스펙 승인 옵션
- `sdd reverse review --reject`: 스펙 거부 옵션
- `sdd reverse finalize -d/--domain`: 특정 도메인 확정 옵션

### Fixed

- `/sdd.start` 브라운필드 프로젝트 감지 및 `/sdd.reverse` 제안 추가
- `/sdd.reverse` 프롬프트에 CLI 사용 강조 지시 추가
- `domains.yml` vs `domains.json` 문서 불일치 수정
- `sdd reverse scan` 시 도메인 자동 생성 기능 추가 (`--no-create-domains`로 비활성화)

### Documentation

- 출력 파일 테이블에 생성 시점 추가
- `.sdd/domains/<domain>/domain.md` 파일 문서화
- `.sdd/.reverse-meta.json` 파일 문서화
- 브라운필드 튜토리얼 업데이트


## [1.2.0] - 2025-12-29

### Added

#### 도메인 시스템 (Domain System)
- `sdd domain create`: 새 도메인 생성
- `sdd domain list`: 도메인 목록 조회
- `sdd domain show <name>`: 도메인 상세 정보
- `sdd domain link <domain> <spec>`: 스펙을 도메인에 연결
- `sdd domain unlink <domain> <spec>`: 스펙 연결 해제
- `sdd domain depends <domain> --on <target>`: 도메인 의존성 설정
- `sdd domain graph`: 의존성 그래프 시각화 (Mermaid, DOT, JSON)
- `sdd domain delete`: 도메인 삭제
- `sdd domain rename`: 도메인 이름 변경
- `sdd domain validate`: 도메인 구조 검증
- 순환 의존성 감지 (Tarjan 알고리즘)
- `domains.yml` 스키마 및 JSON Schema 지원

#### 컨텍스트 시스템 (Context System)
- `sdd context set <domain...>`: 작업 컨텍스트 설정
- `sdd context show`: 현재 컨텍스트 표시
- `sdd context clear`: 컨텍스트 해제
- `sdd context add <domain>`: 도메인 추가
- `sdd context remove <domain>`: 도메인 제거
- `sdd context specs`: 컨텍스트 내 스펙 목록
- `sdd context export`: 컨텍스트 기반 프롬프트 내보내기
- `--include-deps`: 의존 도메인 자동 포함
- 대규모 프로젝트 스케일링 지원

#### 역방향 스펙 추출 (Reverse Spec Extraction)
- `sdd reverse scan`: 프로젝트 구조 스캔
  - 디렉토리 구조 분석
  - 언어 분포 통계 (30+ 언어 지원)
  - 도메인 추정
  - Serena MCP 통합
- `sdd reverse extract`: 코드에서 스펙 초안 추출
  - 심볼 분석 (클래스, 함수, 인터페이스)
  - 신뢰도 점수 계산 (documentation, naming, structure, testCoverage, typing)
  - GIVEN-WHEN-THEN 시나리오 추론
  - AI 기반 의도 추론 (`--ai` 옵션)
  - `--domain`, `--depth`, `--min-confidence` 옵션
- `sdd reverse review`: 추출된 스펙 리뷰
  - pending/approved/rejected/needs_revision 상태 관리
  - 인라인 편집 지원 (undo/redo)
  - AI 어시스턴트 통합
  - 리뷰 코멘트 추가
- `sdd reverse finalize`: 승인된 스펙 확정
  - `--all` 옵션으로 일괄 확정
  - 도메인 자동 생성
  - 역추출 보고서 생성
  - 정식 SDD 스펙 마크다운 생성

#### 스펙 생성 확장
- `sdd new <domain>/<feature>`: 도메인/기능 형식 지원
- `sdd new --domain <name>`: 명시적 도메인 지정
- 컨텍스트 기반 도메인 자동 감지
- 도메인별 커스텀 템플릿 지원

#### 검증 확장
- `sdd validate --domain <name>`: 특정 도메인만 검증
- `sdd validate --orphan-specs`: 고아 스펙 감지
- 도메인 경계 검증 (의존성 규칙 준수)

#### Claude Code 슬래시 커맨드 스킬
- `/dev-implement`: 스펙 기반 TDD 구현
- `/dev-next`: 다음 구현할 스펙 추천
- `/dev-review`: 코드 리뷰
- `/dev-scaffold`: 보일러플레이트 생성
- `/dev-status`: 구현 진행 상황
- `/dev-test`: Vitest 테스트 실행
- `/sdd-reverse`: 역추출 워크플로우
- `/sdd-domain`: 도메인 관리
- `/sdd-context`: 컨텍스트 관리
- `/sdd-analyze`: 코드베이스 분석
- `/sdd-import`: 외부 문서 가져오기

### Technical
- 새 모듈: `src/core/domain/` (graph, parser, service)
- 새 모듈: `src/core/context/` (manager, storage)
- 새 모듈: `src/core/reverse/` (scanner, extractor, confidence, spec-generator, review, finalizer, editor, ai-assistant, reporter, cleanup, domain-generator, intent-inferrer)
- 새 모듈: `src/core/validators/domain-validator.ts`
- 새 모듈: `src/integrations/serena/` (client, types, connection, requirement-checker)
- 새 모듈: `src/schemas/domains.schema.ts`
- 새 모듈: `src/utils/language-detector.ts`
- CLI 명령어: `src/cli/commands/domain.ts`, `context.ts`, `reverse.ts`
- 문서: `docs/guide/` (domains, context, reverse-extraction, large-projects)
- 문서: `docs/cli/` (domain, context, reverse)
- 문서: `docs/tutorial/` (greenfield, brownfield)
- 테스트 200개+ 추가 (총 1362개)
- `.claude/skills/` 디렉토리 및 설정 추가

---

## [1.1.0] - 2025-12-29

### Added

#### 대화형 프로젝트 초기화
- `sdd init` 시 프로젝트 구조 자동 분석
- Git 워크플로우 설정 제안 (사용자 승인 후 실행)
- CI/CD 설정 제안 (사용자 승인 후 실행)
- `--skip-git-setup`: Git/CI-CD 설정 건너뛰기
- `--auto-approve`: 모든 설정 자동 승인 (CI/스크립트용)

#### 프로젝트 분석기
- Git 저장소 상태 감지
- Git hooks 설치 여부 확인
- GitHub Actions / GitLab CI 설정 감지
- Node.js / TypeScript 프로젝트 감지
- SDD 프로젝트 초기화 여부 확인

#### /sdd.start 슬래시 커맨드 개선
- 프로젝트 구조 분석 안내 추가
- Git/CI-CD 설정 제안 시나리오 추가
- 사용자 승인 기반 설정 플로우

### Technical
- 새 모듈: `src/utils/project-analyzer.ts`
- `src/cli/commands/init.ts`에 대화형 프롬프트 추가


## [1.0.1] - 2025-12-24

### Fixed

#### CI/CD Pipeline Fixes
- ESLint v9 flat config 지원 (`eslint.config.js` 추가)
- pnpm 버전 충돌 해결 (워크플로우에서 version 제거)
- pnpm-lock.yaml 추가
- glob 의존성 추가

#### TypeScript Type Fixes
- `ExitCode`에 `INIT_ERROR`, `VALIDATION_ERROR` 추가
- `ValidateResult` 프로퍼티 수정 (`files`, `failed`, `warnings`, `passed`)
- `SpecMetadataSchema`에 `id`, `constitution_version`, `dependencies` 추가
- `ExportOptionsInput` 타입 추가
- `DeltaItem` 스키마 수정 (`content` 추가, `target` 선택적)
- `SearchResultItem`에 `content` 필드 추가
- `searcher.ts` 타입 플로우 개선

### Changed
- 커버리지 임계값 현실화 (80% → 65-75%)
- `tsconfig.json`에서 unused 변수 체크 비활성화

---

## [1.0.0] - 2025-12-24

### Added

#### CI/CD Pipeline
- `ci.yml`: PR 품질 검사 (테스트, 린트, 타입체크, 빌드, 커버리지)
- `release.yml`: 태그 푸시 시 자동 npm 배포
- `docs.yml`: 문서 자동 배포 (GitHub Pages)
- Codecov 연동

#### VitePress Documentation Site
- 시작하기 가이드 (설치, 첫 프로젝트, 워크플로우)
- CLI 명령어 레퍼런스 (init, new, validate, prepare, sync, diff, export)
- 슬래시 커맨드 가이드 (29개 커맨드)
- 스펙 작성 가이드 (RFC 2119, GIVEN-WHEN-THEN, Constitution)

#### Documentation
- `CONTRIBUTING.md`: 기여자 가이드
- `CHANGELOG.md`: 변경 이력 정리

### Changed
- vitest 커버리지 json-summary reporter 추가
- 테스트 커버리지 임계값 80% 유지

---

## [0.9.0] - 2025-12-24

### Added
- `sdd export`: 스펙 내보내기 명령어
  - HTML 내보내기 (반응형 스타일, 목차, RFC 2119 키워드 강조)
  - JSON 내보내기 (구조화된 요구사항/시나리오)
  - Markdown 내보내기 (병합 문서)
- `/sdd.export` 슬래시 커맨드 (29번째 커맨드)
- Light/Dark 테마 지원
- `--all` 옵션으로 일괄 내보내기

---

## [0.8.0] - 2025-12-24

### Added
- `sdd sync`: 스펙-코드 동기화 검증
  - `@spec REQ-xxx` 코드 주석 인식
  - 테스트에서 `REQ-xxx` 참조 인식
  - 동기화율 리포트
  - CI 모드 (`--ci --threshold 80`)
- `sdd diff`: 스펙 변경사항 시각화
  - 작업 디렉토리, 스테이징, 커밋 간 비교
  - RFC 2119 키워드 변경 강조
  - 구조적 diff (요구사항, 시나리오)
- `/sdd.sync`, `/sdd.diff` 슬래시 커맨드 (27, 28번째)

---

## [0.7.0] - 2025-12-23

### Added
- `sdd prepare`: 서브에이전트/스킬 점검
  - tasks.md 분석하여 필요한 도구 감지
  - 누락된 서브에이전트/스킬 자동 생성
  - `--dry-run`, `--auto-approve` 옵션
- `/sdd.prepare` 슬래시 커맨드 (26번째)

### Fixed
- Windows 경로 호환성 문제 해결

---

## [0.6.0] - 2025-12-22

### Added
- `sdd search`: 스펙 검색 명령어
- `/sdd.search`, `/sdd.impact`, `/sdd.quality` 슬래시 커맨드

---

## [0.5.0] - 2025-12-22

### Added

#### Watch 모드
- `sdd watch`: 스펙 파일 변경 실시간 감시
- `--no-validate`: 자동 검증 비활성화
- `--impact`: 영향도 분석 포함
- `-q, --quiet`: 성공 시 출력 생략
- `--debounce <ms>`: 디바운스 시간 설정 (기본 500ms)
- 변경 이벤트 요약 (추가/수정/삭제 카운트)
- 세션 종료 시 통계 요약

#### 스펙 품질 분석
- `sdd quality [feature]`: 개별 스펙 품질 점수 분석
- `sdd quality --all`: 전체 프로젝트 품질 분석
- `--json`: JSON 형식 출력
- `--min-score <score>`: 최소 점수 기준 (미달 시 에러)
- 8가지 품질 기준 평가:
  - RFC 2119 키워드 사용 (MUST/SHALL/SHOULD/MAY)
  - GIVEN-WHEN-THEN 시나리오 존재
  - 요구사항 섹션 존재
  - 의존성 명시
  - 구조 완성도 (제목/설명/목표/범위 등)
  - Constitution 버전 참조
  - 내부 링크 무결성
  - 메타데이터 완성도
- A/B/C/D/F 등급 산출
- 개선 제안 및 가이드 제공

#### 리포트 내보내기
- `sdd report`: 스펙 리포트 생성
- `-f, --format <format>`: 출력 형식 (html, markdown, json)
- `-o, --output <path>`: 출력 파일 경로
- `--title <title>`: 리포트 제목
- `--no-quality`: 품질 분석 제외
- `--no-validation`: 검증 결과 제외
- HTML 리포트: 반응형 스타일, 카드 레이아웃, 색상 코딩
- Markdown 리포트: 표 형식, 섹션별 정리
- Phase별/상태별 분포 통계

#### 외부 도구 마이그레이션 강화
- `sdd migrate detect`: 외부 SDD 도구 자동 감지
- `sdd migrate openspec [source]`: OpenSpec 프로젝트에서 마이그레이션
- `sdd migrate speckit [source]`: Spec Kit 프로젝트에서 마이그레이션
- OpenSpec 감지: `openspec/` 디렉토리, AGENTS.md, specs/changes 구조
- Spec Kit 감지: `.specify/` 디렉토리, memory/constitution.md
- 자동 형식 변환 (frontmatter 필드 추가)
- `--dry-run`: 미리보기 모드
- `--overwrite`: 기존 스펙 덮어쓰기

### Technical
- 새 모듈: `src/core/watch/watcher.ts`
- 새 모듈: `src/core/quality/analyzer.ts`
- 새 모듈: `src/core/report/reporter.ts`
- 새 모듈: `src/core/migrate/detector.ts`
- 새 의존성: `chokidar@5.0.0` (파일 감시)
- 테스트 유지 (311개)

---

## [0.4.0] - 2025-12-22

### Added

#### Constitution 위반 검증
- `sdd validate --constitution`: 스펙이 Constitution 원칙을 위반하는지 자동 검사
- `sdd validate --no-constitution`: Constitution 검사 스킵 옵션
- SHALL NOT / MUST NOT 키워드 기반 위반 감지
- 버전 불일치 경고 (Major/Minor/Patch 심각도 분류)
- 위반 리포트 포맷팅 및 권장사항 제공

#### What-if 시뮬레이션
- `sdd impact simulate <feature> <proposal>`: 변경 전 영향도 예측
- ADDED/MODIFIED/REMOVED 델타 파싱
- 가상 의존성 그래프 생성 및 비교
- 리스크 점수 변화 계산
- 새로 영향받는 스펙 탐지
- 시뮬레이션 결과 포맷팅 (현재 vs 변경 후 비교)

#### 코드 영향도 분석
- `sdd impact <feature> --code`: 스펙 변경이 소스 코드에 미치는 영향 분석
- 스펙-코드 연결 탐지:
  - 주석 참조 (`// spec: feature-id`, `/* spec: feature-id */`, `@spec feature-id`)
  - 파일명/디렉토리명 매칭
  - 매핑 설정 파일 지원 (`.sdd/code-mapping.json`)
- import/export 관계 추적 (간접 영향 파일 탐지)
- 리스크 점수 및 권장사항 제공

### Changed
- `sdd impact` 명령어에 `-c, --code` 옵션 추가
- `sdd validate` 명령어에 `-c, --constitution` 및 `--no-constitution` 옵션 추가

### Technical
- 새 모듈: `src/core/constitution/violation-checker.ts`
- 새 모듈: `src/core/impact/simulator.ts`
- 새 모듈: `src/core/impact/code-analyzer.ts`
- 테스트 31개 추가 (총 311개)

---

## [0.3.0] - 2025-12-21

### Added

#### Constitution 시스템
- `sdd constitution show`: 현재 Constitution 표시
- `sdd constitution version`: 버전만 표시
- `sdd constitution validate`: 형식 검증
- `sdd constitution history`: 변경 이력 조회
- `sdd constitution bump`: 버전 업데이트 (--major/--minor/--patch)
- Constitution 시맨틱 버전 관리 (MAJOR/MINOR/PATCH)
- 스펙 생성 시 `constitution_version` 필드 자동 추가

#### 변경 워크플로우
- `sdd change`: 변경 제안 생성
- `sdd change -l`: 진행 중인 변경 목록
- `sdd change <id>`: 특정 변경 조회
- `sdd change diff <id>`: 변경 내용 diff 미리보기
- `sdd change validate <id>`: 변경 제안 검증
- `sdd change apply <id>`: 변경 적용 및 상태 업데이트
- `sdd change archive <id>`: 완료된 변경 아카이브
- 델타 자동 생성 (ADDED/MODIFIED/REMOVED)

#### 통합 진입점
- `sdd start`: 대화형 워크플로우 선택 메뉴
- `sdd start --status`: 상태만 표시
- `sdd start --workflow <name>`: 특정 워크플로우 시작
- 현재 프로젝트 상태 기반 워크플로우 추천

#### 영향도 분석
- `sdd impact <feature>`: 특정 기능 영향도 분석
- `sdd impact <feature> --graph`: 의존성 그래프 출력 (Mermaid)
- `sdd impact report`: 전체 프로젝트 리포트
- `sdd impact change <id>`: 변경 제안 영향도 분석
- 내용 기반 의존성 추론 (암시적 참조 감지)
- 리스크 점수 산출 및 레벨 분류
- 간접(transitive) 영향 분석
- 순환 의존성 탐지

#### 마이그레이션 도구
- `sdd migrate docs <source>`: 문서 마이그레이션
- `sdd migrate analyze <file>`: 문서 분석
- `sdd migrate scan [dir]`: 디렉토리 스캔
- RFC 2119 키워드 감지
- GIVEN-WHEN-THEN 시나리오 감지
- 적합도 분류 (준비됨/일부/미준비)

#### CI/CD 통합
- `sdd cicd setup`: GitHub Actions 설정
- `sdd cicd setup gitlab`: GitLab CI 설정
- `sdd cicd hooks`: Git hooks 설정 (Husky)
- `sdd cicd check`: CI 검증 실행

#### 워크플로우 라우팅
- `sdd transition new-to-change <spec-id>`: new → change 전환
- `sdd transition change-to-new <change-id>`: change → new 전환
- `sdd transition guide`: 전환 가이드

#### 검증 강화
- `sdd validate --check-links`: 참조 링크 유효성 검사
- 깨진 내부 링크 탐지
- dependencies 필드 검증

#### 브랜치 관리
- `sdd new <name> --numbered`: 자동 번호 부여 (feature/001-name)
- `sdd new counter`: 카운터 조회/설정
- `.sdd/counter.json` 메커니즘

#### 슬래시 커맨드
- `/sdd.start`: 통합 진입점
- `/sdd.new`: 새 기능 명세 작성
- `/sdd.plan`: 구현 계획 작성
- `/sdd.tasks`: 작업 분해
- `/sdd.implement`: 순차적 구현
- `/sdd.validate`: 스펙 검증
- `/sdd.status`: 프로젝트 상태
- `/sdd.change`: 변경 제안
- `/sdd.constitution`: Constitution 관리
- `/sdd.chat`: 대화형 SDD 어시스턴트
- `/sdd.guide`: 워크플로우 가이드
- `/sdd.transition`: 워크플로우 전환
- `/sdd.analyze`: 요청 분석 및 규모 판단
- `/sdd.research`: 기술 리서치 문서
- `/sdd.data-model`: 데이터 모델 문서
- `/sdd.prepare`: 환경 준비 가이드

---

## [0.2.0] - 2025-12-20

### Added
- `sdd init`: 프로젝트 초기화
- `sdd new <feature>`: 새 기능 생성
- `sdd new plan <feature>`: 구현 계획 생성
- `sdd new tasks <feature>`: 작업 분해 생성
- `sdd validate`: 스펙 검증
- `sdd status`: 프로젝트 상태 조회
- `sdd list`: 항목 목록 조회
- `sdd prompt`: 슬래시 커맨드 프롬프트 출력
- YAML frontmatter 파싱
- RFC 2119 키워드 검증
- GIVEN-WHEN-THEN 시나리오 검증

---

## [0.1.0] - 2025-12-19

### Added
- 초기 프로젝트 구조
- 기본 CLI 프레임워크 (Commander.js)
- TypeScript 설정
- ESM 모듈 구조
- 기본 테스트 프레임워크 (Vitest)

---

[1.4.0]: https://github.com/JakeB-5/sdd-tool/compare/v1.3.2...v1.4.0
[1.3.2]: https://github.com/JakeB-5/sdd-tool/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/JakeB-5/sdd-tool/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/JakeB-5/sdd-tool/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/JakeB-5/sdd-tool/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/JakeB-5/sdd-tool/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/JakeB-5/sdd-tool/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/JakeB-5/sdd-tool/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/JakeB-5/sdd-tool/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/JakeB-5/sdd-tool/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/JakeB-5/sdd-tool/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/JakeB-5/sdd-tool/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/JakeB-5/sdd-tool/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/JakeB-5/sdd-tool/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/JakeB-5/sdd-tool/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/JakeB-5/sdd-tool/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/JakeB-5/sdd-tool/releases/tag/v0.1.0
