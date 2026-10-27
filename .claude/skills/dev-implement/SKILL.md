---
name: dev-implement
description: .sdd/specs/의 스펙 문서를 읽고 TDD 방식으로 TypeScript 코드를 구현합니다. GIVEN-WHEN-THEN 시나리오를 테스트로 변환하고 코드를 작성합니다. 사용자가 "구현해", "개발해", "코딩해", "implement" 등을 요청할 때 사용합니다.
argument-hint: <spec-path>
allowed-tools: Read Write Edit Glob Grep Bash(pnpm *)
---

# 스펙 기반 TDD 구현

## Instructions

### 1. 스펙 파일 분석

`.sdd/specs/<spec-path>.md` 파일에서 추출:
- **Requirement**: 구현해야 할 기능
- **Scenario**: GIVEN-WHEN-THEN 테스트 케이스
- **RFC 2119 키워드**: SHALL(필수), SHOULD(권장), MAY(선택)

### 2. 의존성 확인

frontmatter의 `depends` 필드를 확인하고, 의존 스펙이 미구현이면 경고합니다.

### 3. TDD: 테스트 먼저 작성

스펙의 Scenario를 테스트 케이스로 변환:

```markdown
### Scenario: 유효한 스펙 검증 성공
- **GIVEN** 유효한 RFC 2119 키워드가 포함된 스펙
- **WHEN** validate 명령을 실행하면
- **THEN** 성공 메시지가 출력된다
```

↓ 변환

```typescript
it('유효한 스펙을 검증하면 성공한다', () => {
  // GIVEN
  const spec = '시스템은 X를 해야 한다(SHALL).';
  // WHEN
  const result = validateSpec(spec);
  // THEN
  expect(result.valid).toBe(true);
});
```

### 4. 구현 및 테스트 실행

테스트를 통과하도록 구현하고 확인:

```bash
pnpm vitest run src/<path>.test.ts
```

## Examples

**사용자**: "user-auth 스펙 구현해줘"

**응답**: 스펙을 분석하고 테스트부터 작성한 뒤 구현을 진행합니다.

## RFC 2119 키워드 해석

| 키워드 | 의미 | 구현 수준 |
|--------|------|----------|
| SHALL / MUST | 필수 | 반드시 구현 |
| SHOULD | 권장 | 가능하면 구현 |
| MAY | 선택 | 필요시 구현 |
