# sdd sync

스펙과 코드의 동기화 상태를 검증합니다.

## 사용법

```bash
sdd sync [specId] [options]
```

## 인수

| 인수 | 설명 |
|------|------|
| `specId` | 특정 스펙 ID (생략 시 전체) |

## 옵션

| 옵션 | 설명 |
|------|------|
| `--ci` | CI 모드 (exit code 반환) |
| `--threshold <n>` | 동기화율 임계값 (기본: 80) |
| `--json` | JSON 형식 출력 |
| `--markdown` | 마크다운 리포트 |

## 동기화 방식

### 코드에서 스펙 참조

```typescript
/**
 * @spec REQ-01
 * 사용자 로그인 처리
 */
function login() {}
```

### 테스트에서 스펙 참조

```typescript
describe('REQ-01: 로그인', () => {
  it('should authenticate user', () => {});
});
```

## 예시

### 전체 동기화 검사

```bash
sdd sync
```

### 특정 스펙만 검사

```bash
sdd sync user-auth
```

### CI에서 사용

```bash
sdd sync --ci --threshold 80
```

### JSON 출력

```bash
sdd sync --json
```

## 출력 예시

```
SDD Sync

┌──────────┬─────────────┬──────────┬──────────┐
│ 스펙 ID  │ 요구사항    │ 코드     │ 테스트   │
├──────────┼─────────────┼──────────┼──────────┤
│ auth     │ 5           │ 4 (80%)  │ 5 (100%) │
│ profile  │ 3           │ 3 (100%) │ 2 (67%)  │
└──────────┴─────────────┴──────────┴──────────┘

전체 동기화율: 85%
```

## CI/CD 통합

```yaml
- name: Check spec sync
  run: sdd sync --ci --threshold 80
```
