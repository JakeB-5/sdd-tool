# SDD Tool

**Spec-Driven Development CLI** - AI와 함께하는 명세 기반 개발 도구

[![npm version](https://img.shields.io/npm/v/sdd-tool)](https://www.npmjs.com/package/sdd-tool)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 개요

SDD Tool은 **Claude Code**와 함께 사용하도록 설계된 명세 기반 개발(Spec-Driven Development) CLI입니다. 슬래시 커맨드를 통해 AI와 대화하며 명세를 작성하고, 코드를 구현합니다.

### 핵심 개념

- **명세 우선**: 코드 작성 전 명세 작성
- **AI 협업**: Claude Code 슬래시 커맨드로 워크플로우 자동화
- **RFC 2119 키워드**: SHALL, MUST, SHOULD, MAY로 요구사항 명확화
- **GIVEN-WHEN-THEN**: 시나리오 기반 요구사항 정의
- **헌법(Constitution)**: 프로젝트 핵심 원칙 정의

---

## 설치

```bash
npm install -g sdd-tool
```

---

## Claude Code와 함께 시작하기

SDD Tool은 Claude Code의 슬래시 커맨드와 통합되어, AI와 대화하며 명세 기반 개발을 진행합니다.

### Step 1: 프로젝트 초기화

```bash
sdd init
```

이 명령은 다음을 생성합니다:
- `.sdd/` - 명세 디렉토리 (constitution.md, specs/, changes/)
- `.claude/commands/` - **26개의 슬래시 커맨드** 자동 생성

### Step 2: Claude Code 실행

프로젝트 디렉토리에서 Claude Code를 실행합니다:

```bash
claude
```

### Step 3: 워크플로우 시작

Claude Code에서 슬래시 커맨드를 입력합니다:

```
/sdd.start
```

AI가 프로젝트 상태를 분석하고, 다음 작업을 안내합니다:
- 신규 프로젝트: Constitution 작성 권장
- 기존 프로젝트: 워크플로우 선택 메뉴 제공

### Step 4: Constitution(헌법) 작성

프로젝트의 핵심 원칙을 정의합니다:

```
/sdd.constitution
```

신규 프로젝트의 경우, 프로젝트 설명을 함께 입력할 수 있습니다:

```
/sdd.constitution React 기반 할일 관리 앱
```

AI가 `.sdd/constitution.md`를 분석하고, 프로젝트 원칙 작성을 도와줍니다:
- 핵심 원칙 (Core Principles)
- 기술 원칙 (Technical Principles)
- 금지 사항 (Forbidden)

### Step 5: 새 기능 명세 작성

기능 명세를 AI와 함께 작성합니다:

```
/sdd.new
```

필요한 기능을 함께 입력하면 AI가 바로 명세 작성을 시작합니다:

```
/sdd.new 사용자 인증 기능
```

AI가 대화를 통해 다음을 생성합니다:
- `spec.md` - 기능 명세 (RFC 2119 + GIVEN-WHEN-THEN)
- `plan.md` - 구현 계획
- `tasks.md` - 작업 분해

### Step 6: 구현 진행

작업 목록을 기반으로 순차적 구현:

```
/sdd.implement
```

AI가 tasks.md를 읽고, TDD 방식으로 구현을 안내합니다.

---

## 전체 워크플로우 예시

```
┌─────────────────────────────────────────────────────────────┐
│  1. sdd init          → 프로젝트 초기화                      │
│  2. claude            → Claude Code 실행                    │
│  3. /sdd.start        → 워크플로우 시작                      │
│  4. /sdd.constitution → 프로젝트 원칙 정의                   │
│  5. /sdd.new          → 기능 명세 작성                       │
│  6. /sdd.plan         → 구현 계획 수립                       │
│  7. /sdd.tasks        → 작업 분해                           │
│  8. /sdd.implement    → 순차적 구현                          │
│  9. /sdd.validate     → 명세 검증                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 슬래시 커맨드 (26개)

`sdd init` 실행 시 `.claude/commands/`에 자동 생성됩니다.

### 핵심 워크플로우

| 커맨드 | 설명 | 사용 시점 |
|--------|------|----------|
| `/sdd.start` | 통합 진입점 | 작업 시작 시 |
| `/sdd.constitution` | 프로젝트 원칙 관리 | 프로젝트 초기 설정 |
| `/sdd.new` | 새 기능 명세 작성 | 새 기능 개발 시 |
| `/sdd.plan` | 구현 계획 작성 | 명세 작성 후 |
| `/sdd.tasks` | 작업 분해 | 계획 수립 후 |
| `/sdd.implement` | 순차적 구현 | 작업 분해 후 |
| `/sdd.validate` | 스펙 검증 | 작성/수정 후 |

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

### 문서 생성

| 커맨드 | 설명 |
|--------|------|
| `/sdd.research` | 기술 리서치 문서 |
| `/sdd.data-model` | 데이터 모델 문서 |
| `/sdd.guide` | 워크플로우 가이드 |
| `/sdd.prepare` | 환경 준비 가이드 |

### 운영

| 커맨드 | 설명 |
|--------|------|
| `/sdd.chat` | 대화형 SDD 어시스턴트 |
| `/sdd.list` | 항목 목록 조회 |
| `/sdd.watch` | 파일 감시 모드 |
| `/sdd.migrate` | 외부 도구에서 마이그레이션 |
| `/sdd.cicd` | CI/CD 설정 |
| `/sdd.prompt` | 프롬프트 출력 |

---

## 대화형 모드: /sdd.chat

자연어로 SDD 작업을 수행할 수 있습니다:

```
/sdd.chat
```

예시 대화:
```
You: 사용자 인증 기능을 만들고 싶어
AI: 사용자 인증 기능의 명세를 작성해 드릴게요. 먼저 몇 가지 질문이 있습니다...
    1. 어떤 인증 방식을 사용하시나요? (JWT, 세션, OAuth)
    2. 소셜 로그인이 필요한가요?
    ...
```

---

## 스펙 파일 형식

### spec.md 예시

```markdown
---
id: user-auth
title: "사용자 인증"
status: draft
created: 2025-12-24
constitution_version: 1.0.0
---

# 사용자 인증

> JWT 기반 사용자 인증 시스템

## 요구사항

### REQ-01: 로그인

- 시스템은 이메일/비밀번호 로그인을 지원해야 한다(SHALL)
- 로그인 실패 시 구체적인 에러 메시지를 반환해야 한다(SHOULD)

## 시나리오

### Scenario 1: 성공적인 로그인

- **GIVEN** 유효한 사용자 계정이 있을 때
- **WHEN** 올바른 이메일과 비밀번호로 로그인하면
- **THEN** JWT 토큰이 반환된다
- **AND** 토큰 만료 시간이 설정된다
```

### RFC 2119 키워드

| 키워드 | 의미 |
|--------|------|
| **SHALL** / **MUST** | 절대 필수 |
| **SHOULD** | 권장 (예외 허용) |
| **MAY** | 선택적 |
| **SHALL NOT** | 절대 금지 |

---

## CLI 명령어

슬래시 커맨드 외에 터미널에서 직접 사용할 수 있는 명령어들입니다.

### 기본 명령어

```bash
sdd init                    # 프로젝트 초기화
sdd validate                # 스펙 검증
sdd status                  # 상태 확인
sdd list                    # 목록 조회
```

### 기능 개발

```bash
sdd new <name>              # 새 기능 생성
sdd new <name> --all        # spec + plan + tasks 모두 생성
```

### 변경 관리

```bash
sdd change                  # 변경 제안 생성
sdd change apply <id>       # 변경 적용
sdd impact <feature>        # 영향도 분석
```

### 품질 및 분석

```bash
sdd quality                 # 품질 분석
sdd quality --min-score 70  # 최소 점수 기준
sdd report                  # 리포트 생성
sdd search <query>          # 스펙 검색
```

### 운영

```bash
sdd watch                   # 파일 감시
sdd migrate detect          # 외부 도구 감지
sdd cicd setup              # CI/CD 설정
```

---

## CI/CD 통합

### GitHub Actions

```bash
sdd cicd setup github
```

### Git Hooks

```bash
sdd cicd hooks
```

커밋 전 자동으로 스펙 검증이 실행됩니다.

---

## 디렉토리 구조

`sdd init` 실행 후 생성되는 구조:

```
your-project/
├── .sdd/
│   ├── constitution.md     # 프로젝트 헌법
│   ├── AGENTS.md           # AI 워크플로우 가이드
│   ├── specs/              # 기능 명세
│   │   └── feature-name/
│   │       ├── spec.md
│   │       ├── plan.md
│   │       └── tasks.md
│   ├── changes/            # 변경 제안
│   ├── archive/            # 완료된 변경
│   └── templates/          # 템플릿
└── .claude/
    └── commands/           # 슬래시 커맨드 (26개)
        ├── sdd.start.md
        ├── sdd.new.md
        ├── sdd.constitution.md
        └── ...
```

---

## 개발

```bash
git clone https://github.com/JakeB-5/sdd-tool.git
cd sdd-tool
pnpm install
pnpm run build
pnpm test
```

---

## 라이선스

MIT License
