# 스킬 (슬래시 커맨드)

Claude Code에서 사용하는 SDD 스킬 가이드입니다.

## 개요

`sdd init` 실행 시 `.claude/skills/sdd-*/SKILL.md`에 30개의 영문 SDD 워크플로우 스킬이 자동 생성됩니다. Claude Code는 각 스킬을 슬래시 커맨드로 노출하므로 `/sdd-start`, `/sdd-spec` 같은 kebab-case 이름으로 호출합니다.

- **30개 sdd-* 스킬** — `.claude/skills/sdd-*/` (`/sdd-<이름>`으로 호출)
- `.claude/commands/`는 기본적으로 생성되지 **않습니다**. Claude Code가 커스텀 커맨드를 스킬로 통합했으므로 스킬이 지원되는 형식입니다.
- 레거시 한국어 dot-notation 커맨드(`.claude/commands/sdd.*.md`)도 함께 생성하려면 `sdd init --legacy-commands`를 사용합니다.
- 스킬 생성을 건너뛰려면 `--no-skills`를 사용합니다.

## 스킬 목록

### 핵심 워크플로우

| 스킬 | 설명 |
|------|------|
| [`/sdd-start`](/commands/sdd-start) | 통합 진입점 |
| [`/sdd-constitution`](/commands/sdd-constitution) | 프로젝트 원칙 관리 |
| [`/sdd-spec`](/commands/sdd-spec) | **기능 명세 작성/수정 (통합)** |
| [`/sdd-plan`](/commands/sdd-plan) | 구현 계획 작성 |
| [`/sdd-tasks`](/commands/sdd-tasks) | 작업 분해 |
| [`/sdd-prepare`](/commands/sdd-prepare) | 도구 점검 |
| [`/sdd-implement`](/commands/sdd-implement) | 순차적 구현 |
| [`/sdd-validate`](/commands/sdd-validate) | 스펙 검증 |

> **Note**: `/sdd-spec`은 새 스펙을 작성하거나 기존 스펙을 수정합니다. 큰 수정은 `.sdd/changes/CHG-xxx/{proposal,delta,tasks}.md` 변경 제안을 거치며, `sdd change apply <id>`로 적용하고 `sdd change archive <id>`로 보관합니다.

### 도메인 & 역추출

| 스킬 | 설명 |
|------|------|
| [`/sdd-reverse`](/commands/sdd-reverse) | 레거시 코드에서 스펙 역추출 |
| [`/sdd-domain`](/commands/sdd-domain) | 도메인 관리 (생성, 연결, 그래프) |
| [`/sdd-context`](/commands/sdd-context) | 작업 컨텍스트 설정 |

### 스킬 프론트매터

각 스킬의 `SKILL.md`는 다음 프론트매터 필드를 사용합니다:

| 필드 | 적용 대상 |
|------|----------|
| `context: fork` | 7개 분석/도메인 스킬 (`sdd-analyze`, `sdd-impact`, `sdd-report`, `sdd-research`, `sdd-reverse`, `sdd-search`, `sdd-sync`) |
| `disable-model-invocation: true` | 5개 유틸리티 스킬 (`sdd-chat`, `sdd-cicd`, `sdd-guide`, `sdd-migrate`, `sdd-watch`) — 사용자만 호출 가능 |
| `argument-hint` | 인수를 받는 스킬 |
| `allowed-tools` | 모든 sdd-* 스킬 — 최소 권한 패턴 (예: `Bash(sdd validate*)`) |

### 변경 관리

| 스킬 | 설명 |
|------|------|
| `/sdd-impact` | 변경 영향도 분석 |
| `/sdd-transition` | new ↔ change 워크플로우 전환 |

> **제거됨**: `/sdd-new`와 `/sdd-change`는 더 이상 존재하지 않습니다. 대신 `/sdd-spec`을 사용하세요.

### 분석 및 품질

| 스킬 | 설명 |
|------|------|
| `/sdd-analyze` | 요청 분석 및 규모 판단 |
| `/sdd-quality` | 스펙 품질 점수 산출 |
| `/sdd-report` | 프로젝트 리포트 생성 |
| `/sdd-search` | 스펙 검색 |
| `/sdd-status` | 프로젝트 상태 확인 |
| `/sdd-list` | 항목 목록 조회 |
| `/sdd-sync` | 스펙-코드 동기화 검증 |
| `/sdd-diff` | 스펙 변경사항 시각화 |
| `/sdd-export` | 스펙 내보내기 |

### 문서 생성

| 스킬 | 설명 |
|------|------|
| `/sdd-research` | 기술 리서치 문서 |
| `/sdd-data-model` | 데이터 모델 문서 |
| `/sdd-guide` | 워크플로우 가이드 |

### 운영

| 스킬 | 설명 |
|------|------|
| `/sdd-chat` | 대화형 SDD 어시스턴트 |
| `/sdd-watch` | 파일 감시 모드 |
| `/sdd-migrate` | 외부 도구에서 마이그레이션 |
| `/sdd-cicd` | CI/CD 설정 |
| `/sdd-prompt` | 프롬프트 출력 |

## 사용법

Claude Code에서 슬래시로 시작하는 스킬 이름을 입력합니다:

```
/sdd-start
```

인수가 필요한 경우:

```
/sdd-spec 사용자 인증 기능
```

## 사용 예시

### 역추출 워크플로우

레거시 코드에서 SDD 스펙을 자동 추출합니다:

`/sdd-reverse`를 실행하면 프로젝트 스캔, 코드 기반 스펙 초안 작성, 초안 리뷰, 확정 단계를 안내합니다. 자세한 내용은 [/sdd-reverse](/ko/commands/sdd-reverse)를 참고하세요.

### 도메인 시스템

대규모 프로젝트를 논리적으로 그룹화합니다:

```
/sdd-domain create auth        # 도메인 생성
/sdd-domain graph              # 의존성 그래프
/sdd-context set auth payment  # 작업 컨텍스트 설정
```
