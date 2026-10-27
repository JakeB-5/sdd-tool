---
name: dev-scaffold
description: SDD CLI의 새 명령어, 모듈, 파서, 검증기의 TypeScript 보일러플레이트 코드를 생성합니다. 사용자가 "새 명령어 만들어", "모듈 추가", "scaffold", "보일러플레이트" 등을 요청할 때 사용합니다.
argument-hint: <command|module|parser|validator> <name>
allowed-tools: Read Write Edit Glob
---

# 보일러플레이트 생성

## Instructions

### 1. 생성 대상 확인

사용자 요청에서 생성할 타입 파악:
- **command**: CLI 명령어
- **module**: 비즈니스 로직 모듈
- **parser**: 파서/변환기
- **validator**: 검증기

### 2. 기존 패턴 분석

프로젝트의 기존 코드를 분석하여 패턴 추출:
- 디렉토리 구조
- 파일 네이밍 규칙
- 임포트 스타일
- 타입 정의 방식

### 3. 보일러플레이트 생성

추출된 패턴을 따라 파일 생성:
- 메인 구현 파일 (.ts)
- 테스트 파일 (.test.ts)
- 타입 정의 (필요시)
- 인덱스 익스포트 업데이트

## Examples

**사용자**: "export 명령어 scaffold 생성해줘"

**응답**:
```
## Scaffold: export 명령어

생성 파일:
- src/cli/commands/export.ts
- tests/unit/cli/commands/export.test.ts

기존 패턴 참조:
- src/cli/commands/validate.ts

[파일 생성 진행...]
```
