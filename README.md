# SDD Tool

**Spec-Driven Development CLI** - 명세 기반 개발을 위한 통합 CLI 도구

[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 개요

SDD Tool은 명세(Specification)를 중심으로 소프트웨어를 개발하는 방법론을 지원하는 CLI 도구입니다. 코드보다 명세를 우선시하여, 명세가 구현의 진실 공급원(Source of Truth)이 되도록 합니다.

### 핵심 개념

- **명세 우선**: 코드 작성 전 명세 작성
- **RFC 2119 키워드**: SHALL, MUST, SHOULD, MAY, SHALL NOT
- **GIVEN-WHEN-THEN**: 시나리오 기반 요구사항 정의
- **델타 시스템**: ADDED, MODIFIED, REMOVED로 변경 추적
- **헌법(Constitution)**: 프로젝트 핵심 원칙 정의

## 설치

```bash
# npm
npm install -g sdd-tool

# pnpm
pnpm add -g sdd-tool

# 또는 로컬에서 실행
git clone <repository>
cd sdd-tool
pnpm install
pnpm run build
```

## 빠른 시작

```bash
# 1. 프로젝트 초기화
sdd init

# 2. 새 기능 생성
sdd new user-auth --title "사용자 인증" --all

# 3. 스펙 검증
sdd validate

# 4. 프로젝트 상태 확인
sdd status
```

## 명령어

### `sdd init`

SDD 프로젝트를 초기화합니다.

```bash
sdd init              # 기본 초기화
sdd init --force      # 기존 파일 덮어쓰기
```

생성되는 구조:
```
.sdd/
├── constitution.md   # 프로젝트 헌법 (핵심 원칙)
├── AGENTS.md         # AI 워크플로우 가이드
├── specs/            # 기능 명세
├── changes/          # 변경 제안
├── archive/          # 완료된 변경
└── templates/        # 템플릿 파일
```

### `sdd new`

새로운 기능을 생성합니다.

```bash
# 기본 사용
sdd new <feature-name>

# 옵션
sdd new auth --title "인증 기능" --description "사용자 인증"
sdd new auth --all              # spec, plan, tasks, checklist 모두 생성
sdd new auth --no-branch        # Git 브랜치 생성 안 함

# 서브커맨드
sdd new plan <feature>          # 구현 계획 생성
sdd new tasks <feature>         # 작업 분해 생성
sdd new checklist               # 워크플로우 체크리스트 생성
```

### `sdd validate`

스펙 파일의 형식을 검증합니다.

```bash
sdd validate                    # 전체 검증
sdd validate path/to/spec.md    # 특정 파일 검증
sdd validate --strict           # 엄격 모드 (경고도 에러)
sdd validate --quiet            # 조용한 모드
```

검증 항목:
- YAML frontmatter 존재 및 형식
- RFC 2119 키워드 사용
- GIVEN-WHEN-THEN 시나리오 포함

### `sdd change`

변경 제안을 생성하고 관리합니다.

```bash
sdd change                      # 새 변경 제안 생성
sdd change CHG-001              # 특정 변경 조회
sdd change --list               # 변경 목록
sdd change apply CHG-001        # 변경 적용
sdd change archive CHG-001      # 변경 아카이브
```

### `sdd impact`

스펙 변경의 영향도를 분석합니다.

```bash
sdd impact <feature>            # 특정 기능 영향도 분석
sdd impact --graph              # 의존성 그래프 출력 (Mermaid)
sdd impact <feature> --json     # JSON 형식 출력
```

### `sdd status`

프로젝트 상태를 조회합니다.

```bash
sdd status                      # 기본 상태
sdd status --verbose            # 상세 정보
sdd status --json               # JSON 형식
```

### `sdd list`

항목 목록을 조회합니다.

```bash
sdd list                        # 전체 요약
sdd list features               # 기능 목록
sdd list changes                # 변경 목록
sdd list specs                  # 스펙 파일 목록
sdd list templates              # 템플릿 목록
```

### `sdd prompt`

AI 도구용 슬래시 커맨드 프롬프트를 출력합니다.

```bash
sdd prompt                      # 사용 가능한 명령어 목록
sdd prompt --list               # 명령어 목록
sdd prompt change               # /sdd:change 프롬프트
sdd prompt new                  # /sdd:new 프롬프트
sdd prompt plan                 # /sdd:plan 프롬프트
sdd prompt tasks                # /sdd:tasks 프롬프트
sdd prompt apply                # /sdd:apply 프롬프트
sdd prompt archive              # /sdd:archive 프롬프트
sdd prompt impact               # /sdd:impact 프롬프트
sdd prompt validate             # /sdd:validate 프롬프트
```

## 워크플로우

### 신규 기능 개발

```
1. sdd new <feature> --all      # 기능 생성 (spec, plan, tasks)
2. spec.md 작성                 # 요구사항 정의
3. sdd validate                 # 명세 검증
4. plan.md 작성                 # 구현 계획
5. tasks.md 기반 구현           # 작업별 구현
6. sdd change archive           # 완료 후 아카이브
```

### 기존 기능 변경

```
1. sdd change                   # 변경 제안 생성
2. proposal.md 작성             # 변경 내용 정의
3. sdd impact <feature>         # 영향도 분석
4. 검토 및 승인
5. sdd change apply             # 변경 적용
6. sdd change archive           # 아카이브
```

## 스펙 파일 형식

### spec.md

```markdown
---
id: feature-id
title: "기능 제목"
status: draft
created: 2025-12-21
depends: null
---

# 기능 제목

> 기능 설명

---

## 요구사항

### REQ-01: 요구사항 제목

- 시스템은 [기능]을 지원해야 한다(SHALL)
- 응답 시간은 1초 이내여야 한다(SHOULD)

---

## 시나리오

### Scenario 1: 성공 케이스

- **GIVEN** 유효한 사용자가 있을 때
- **WHEN** 로그인을 시도하면
- **THEN** 메인 페이지로 이동한다
```

### RFC 2119 키워드

| 키워드 | 의미 | 사용 예시 |
|--------|------|-----------|
| **SHALL** / **MUST** | 절대 필수 | "시스템은 인증을 지원해야 한다(SHALL)" |
| **SHOULD** | 권장 (예외 가능) | "응답 시간은 1초 이내여야 한다(SHOULD)" |
| **MAY** | 선택적 | "다크 모드를 지원할 수 있다(MAY)" |
| **SHALL NOT** | 절대 금지 | "평문 비밀번호를 저장해서는 안 된다(SHALL NOT)" |

## 개발

```bash
# 의존성 설치
pnpm install

# 빌드
pnpm run build

# 개발 모드 (watch)
pnpm run dev

# 테스트
pnpm test                       # watch 모드
pnpm run test:run               # 단일 실행
pnpm run test:coverage          # 커버리지

# 린트
pnpm run lint

# 타입 체크
pnpm run typecheck
```

### 프로젝트 구조

```
sdd-tool/
├── bin/                        # CLI 진입점
│   └── sdd.js
├── src/
│   ├── cli/                    # CLI 명령어
│   │   ├── commands/
│   │   │   ├── init.ts
│   │   │   ├── new.ts
│   │   │   ├── validate.ts
│   │   │   ├── change.ts
│   │   │   ├── impact.ts
│   │   │   ├── status.ts
│   │   │   ├── list.ts
│   │   │   └── prompt.ts
│   │   └── index.ts
│   ├── core/                   # 핵심 로직
│   │   ├── spec/               # 스펙 파서/검증
│   │   ├── constitution/       # 헌법 시스템
│   │   ├── change/             # 변경 워크플로우
│   │   ├── impact/             # 영향도 분석
│   │   └── new/                # 신규 기능 워크플로우
│   ├── generators/             # 파일 생성기
│   ├── prompts/                # 슬래시 커맨드
│   ├── errors/                 # 에러 처리
│   ├── utils/                  # 유틸리티
│   └── types/                  # 타입 정의
├── templates/                  # 기본 템플릿
└── tests/                      # 테스트
    ├── unit/
    └── integration/
```

## 라이선스

MIT License
