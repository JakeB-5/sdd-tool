# /dev-implement

.sdd/specs/의 스펙 문서를 읽고 TDD 방식으로 TypeScript 코드를 구현합니다.

## 사용법

```
/dev-implement [spec-id]
```

## 워크플로우

1. `.sdd/specs/` 디렉토리에서 스펙 파일을 찾습니다
2. 스펙의 GIVEN-WHEN-THEN 시나리오를 분석합니다
3. 먼저 테스트 파일을 작성합니다 (`tests/unit/...`)
4. 테스트가 실패하는 것을 확인합니다
5. 구현 코드를 작성합니다
6. 테스트가 통과하는 것을 확인합니다
7. 필요시 리팩토링합니다

## 예시

```
/dev-implement auth/login
/dev-implement core/parser/markdown
```

## 참고사항

- TDD (Red-Green-Refactor) 사이클을 따릅니다
- 스펙에 정의된 계약(Input/Output)을 준수합니다
- 테스트는 Vitest를 사용합니다
- 구현 후 `npx vitest run`으로 전체 테스트를 실행합니다
