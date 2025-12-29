# 시작하기

SDD Tool은 **Claude Code**와 함께 사용하도록 설계된 명세 기반 개발(Spec-Driven Development) CLI입니다.

## SDD란?

**명세 기반 개발(Spec-Driven Development)**은 코드 작성 전에 명세를 먼저 작성하는 개발 방법론입니다.

### 핵심 원칙

1. **명세 우선**: 코드 작성 전 명세 작성
2. **명세 = 진실**: 명세가 구현의 기준
3. **RFC 2119**: SHALL, MUST, SHOULD, MAY로 요구사항 명확화
4. **GIVEN-WHEN-THEN**: 시나리오 기반 요구사항 정의

## 설치

```bash
npm install -g sdd-tool
```

## 첫 프로젝트 시작

### 1. 프로젝트 초기화

```bash
sdd init
```

이 명령어는 다음을 생성합니다:
- `.sdd/` - 명세 저장소
- `.claude/commands/` - 29개의 슬래시 커맨드

### 2. Git 워크플로우 설정 (선택)

팀 협업을 위한 Git 워크플로우를 설정합니다:

```bash
sdd git setup
```

이 명령어는 다음을 설정합니다:
- Git Hooks (pre-commit, commit-msg, pre-push)
- 커밋 메시지 템플릿
- SDD용 .gitignore/.gitattributes

자세한 내용은 [Git 워크플로우](/guide/commit-convention) 문서를 참고하세요.

### 3. Claude Code 실행

```bash
claude
```

### 4. 워크플로우 시작

```
/sdd.start
```

AI가 프로젝트 상태를 분석하고 다음 단계를 안내합니다.

## 전체 워크플로우

```
/sdd.start        → 워크플로우 시작
    ↓
/sdd.constitution → 프로젝트 원칙 정의
    ↓
/sdd.new          → 기능 명세 작성
    ↓
/sdd.plan         → 구현 계획 수립
    ↓
/sdd.tasks        → 작업 분해
    ↓
/sdd.prepare      → 도구 점검
    ↓
/sdd.implement    → 순차적 구현
    ↓
/sdd.validate     → 명세 검증
```

## 다음 단계

- [설치 가이드](/guide/installation) - 상세 설치 방법
- [첫 프로젝트](/guide/first-project) - 단계별 튜토리얼
- [워크플로우](/guide/workflow) - 전체 워크플로우 이해
