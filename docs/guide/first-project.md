# 첫 프로젝트

이 가이드에서는 SDD Tool을 사용해 간단한 할일 관리 기능을 만들어봅니다.

## 1. 프로젝트 초기화

```bash
mkdir todo-app
cd todo-app
npm init -y
sdd init
```

## 2. Claude Code 시작

```bash
claude
```

## 3. Constitution 작성

프로젝트의 핵심 원칙을 정의합니다:

```
/sdd.constitution React 기반 할일 관리 앱
```

AI가 대화를 통해 프로젝트 원칙을 작성합니다.

### 예시 Constitution

```markdown
# Todo App Constitution

## 핵심 원칙
- 사용자 경험이 최우선이다
- 오프라인에서도 동작해야 한다

## 기술 원칙
- React + TypeScript 사용
- 로컬 스토리지로 데이터 저장

## 금지 사항
- 외부 API 의존 금지
```

## 4. 기능 명세 작성

```
/sdd.new 할일 추가 기능
```

AI가 대화를 통해 명세를 작성합니다.

### 예시 명세

```markdown
---
id: add-todo
title: "할일 추가"
status: draft
---

# 할일 추가

## 요구사항

### REQ-01: 할일 입력
- 시스템은 할일 텍스트 입력을 지원해야 한다(SHALL)
- 빈 텍스트는 거부해야 한다(SHALL)

## 시나리오

### Scenario 1: 성공적인 할일 추가
- **GIVEN** 사용자가 할일 입력 폼에 있을 때
- **WHEN** "우유 사기"를 입력하고 추가 버튼을 클릭하면
- **THEN** 할일 목록에 "우유 사기"가 추가된다
```

## 5. 구현 계획

```
/sdd.plan
```

AI가 기술적 구현 계획을 수립합니다.

## 6. 작업 분해

```
/sdd.tasks
```

AI가 실행 가능한 작업 단위로 분해합니다.

## 7. 도구 점검

```
/sdd.prepare
```

필요한 서브에이전트와 스킬을 확인하고 생성합니다.

## 8. 구현

```
/sdd.implement
```

AI가 TDD 방식으로 순차적 구현을 안내합니다:

1. 테스트 작성
2. 코드 구현
3. 테스트 통과 확인
4. 다음 작업으로 이동

## 9. 검증

```
/sdd.validate
```

명세가 올바르게 작성되었는지 검증합니다.

## 완료!

첫 번째 SDD 기반 기능이 완성되었습니다.

## 다음 단계

- [워크플로우 이해하기](/guide/workflow)
- [모범 사례](/guide/best-practices)
