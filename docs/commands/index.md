# 슬래시 커맨드

Claude Code에서 사용하는 SDD 슬래시 커맨드 가이드입니다.

## 개요

`sdd init` 실행 시 `.claude/commands/`와 `.claude/skills/`에 슬래시 커맨드와 개발 스킬이 자동 생성됩니다.

## 커맨드 목록

### 핵심 워크플로우

| 커맨드 | 설명 |
|--------|------|
| [`/sdd.start`](/commands/sdd-start) | 통합 진입점 |
| [`/sdd.constitution`](/commands/sdd-constitution) | 프로젝트 원칙 관리 |
| [`/sdd.new`](/commands/sdd-new) | 새 기능 명세 작성 |
| [`/sdd.plan`](/commands/sdd-plan) | 구현 계획 작성 |
| [`/sdd.tasks`](/commands/sdd-tasks) | 작업 분해 |
| [`/sdd.prepare`](/commands/sdd-prepare) | 도구 점검 |
| [`/sdd.implement`](/commands/sdd-implement) | 순차적 구현 |
| [`/sdd.validate`](/commands/sdd-validate) | 스펙 검증 |

### 도메인 & 역추출 (v1.2.0)

| 커맨드 | 설명 |
|--------|------|
| [`/sdd.reverse`](/commands/sdd-reverse) | 레거시 코드에서 스펙 역추출 |
| [`/sdd.domain`](/commands/sdd-domain) | 도메인 관리 (생성, 연결, 그래프) |
| [`/sdd.context`](/commands/sdd-context) | 작업 컨텍스트 설정 |

### 개발 스킬 (v1.2.0)

> **Note**: 스킬은 슬래시 커맨드와 다릅니다. Claude가 작업 컨텍스트에 따라 자동으로 선택하여 사용합니다.

| 스킬 | 설명 |
|------|------|
| [`dev-implement`](/commands/dev-implement) | 스펙 기반 TDD 구현 |
| [`dev-next`](/commands/dev-next) | 다음 구현할 스펙 추천 |
| [`dev-review`](/commands/dev-review) | 코드 리뷰 |
| [`dev-scaffold`](/commands/dev-scaffold) | 보일러플레이트 생성 |
| [`dev-status`](/commands/dev-status) | 구현 진행 상황 |
| [`dev-test`](/commands/dev-test) | Vitest 테스트 실행 |

### 변경 관리

| 커맨드 | 설명 |
|--------|------|
| `/sdd.change` | 기존 스펙 변경 제안 |
| `/sdd.impact` | 변경 영향도 분석 |
| `/sdd.transition` | new ↔ change 워크플로우 전환 |

### 분석 및 품질

| 커맨드 | 설명 |
|--------|------|
| `/sdd.analyze` | 요청 분석 및 규모 판단 |
| `/sdd.quality` | 스펙 품질 점수 산출 |
| `/sdd.report` | 프로젝트 리포트 생성 |
| `/sdd.search` | 스펙 검색 |
| `/sdd.status` | 프로젝트 상태 확인 |
| `/sdd.list` | 항목 목록 조회 |
| `/sdd.sync` | 스펙-코드 동기화 검증 |
| `/sdd.diff` | 스펙 변경사항 시각화 |
| `/sdd.export` | 스펙 내보내기 |

### 문서 생성

| 커맨드 | 설명 |
|--------|------|
| `/sdd.research` | 기술 리서치 문서 |
| `/sdd.data-model` | 데이터 모델 문서 |
| `/sdd.guide` | 워크플로우 가이드 |

### 운영

| 커맨드 | 설명 |
|--------|------|
| `/sdd.chat` | 대화형 SDD 어시스턴트 |
| `/sdd.watch` | 파일 감시 모드 |
| `/sdd.migrate` | 외부 도구에서 마이그레이션 |
| `/sdd.cicd` | CI/CD 설정 |
| `/sdd.prompt` | 프롬프트 출력 |

## 사용법

Claude Code에서 슬래시로 시작하는 커맨드를 입력합니다:

```
/sdd.start
```

인수가 필요한 경우:

```
/sdd.new 사용자 인증 기능
```

## v1.2.0 새 기능

### 역추출 워크플로우

레거시 코드에서 SDD 스펙을 자동 추출합니다:

```
/sdd.reverse scan              # 프로젝트 스캔
/sdd.reverse extract           # 스펙 추출
/sdd.reverse review            # 리뷰
/sdd.reverse finalize          # 확정
```

### 도메인 시스템

대규모 프로젝트를 논리적으로 그룹화합니다:

```
/sdd.domain create auth        # 도메인 생성
/sdd.domain graph              # 의존성 그래프
/sdd.context set auth payment  # 작업 컨텍스트 설정
```

### 개발 스킬

스펙 기반 TDD 개발을 지원합니다. 스킬은 `/` 없이 Claude가 작업에 따라 자동으로 사용합니다:

- `dev-next` - 다음 구현할 스펙 추천
- `dev-implement` - 스펙 기반 TDD 구현
- `dev-test` - 테스트 실행
- `dev-review` - 코드 리뷰

사용 예: "auth/login 스펙을 구현해줘" → Claude가 자동으로 `dev-implement` 스킬 사용
