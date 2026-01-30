# /sdd.constitution

프로젝트의 핵심 원칙(Constitution)을 정의합니다.

## 사용법

```
/sdd.constitution [프로젝트 설명]
```

## 인수

| 인수 | 설명 |
|------|------|
| 프로젝트 설명 | 프로젝트에 대한 간단한 설명 |

## 동작

AI가 대화를 통해 프로젝트 원칙을 작성합니다:

1. 프로젝트 목적 파악
2. 핵심 원칙 도출
3. 기술 원칙 정의
4. 금지 사항 목록화

## Constitution 구조

```markdown
# [프로젝트명] Constitution

## 핵심 원칙 (Core Principles)
- 사용자 데이터 보호가 최우선이다
- 성능보다 정확성이 중요하다

## 기술 원칙 (Technical Principles)
- TypeScript 엄격 모드 사용
- 모든 함수에 타입 정의 필수
- 테스트 커버리지 80% 이상 유지

## 금지 사항 (Forbidden)
- any 타입 사용 금지
- console.log 프로덕션 코드 금지
- 외부 의존성 무분별한 추가 금지
```

## 예시

```
/sdd.constitution React 기반 할일 관리 앱

AI: 할일 관리 앱의 Constitution을 작성해 드릴게요.
    몇 가지 질문이 있습니다:

    1. 앱의 주요 사용자는 누구인가요?
    2. 오프라인 지원이 필요한가요?
    3. 어떤 데이터 저장 방식을 선호하시나요?
```

## 버전 관리

Constitution 변경 시 버전을 올립니다:

```yaml
version: 1.0.0  →  1.1.0
```

스펙에서 참조:

```yaml
constitution_version: 1.0.0
```
