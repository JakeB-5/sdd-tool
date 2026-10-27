# sdd sync

스펙과 코드의 동기화 상태를 검증합니다.

## 사용법

```bash
sdd sync [specId] [options]
```

## 인수

| 인수 | 설명 |
|------|------|
| `specId` | 특정 스펙 (`<domain>/<feature>` 또는 유일한 `<feature>`, 생략 시 전체) |

## 옵션

| 옵션 | 설명 |
|------|------|
| `--ci` | CI 모드: 동기화율이 임계값 미만이면 종료 코드 2 |
| `--threshold <percent>` | 동기화율 임계값 0~100 (기본: 100). 지정하면 `--ci` 없이도 게이트가 동작 |
| `--json` | JSON 형식 출력 (stdout에는 JSON만 출력) |
| `--markdown` | 마크다운 리포트 |
| `--src <dir>` | 소스 디렉토리 (기본: `./src`) |
| `--include <patterns>` / `--exclude <patterns>` | 스캔 포함/제외 glob (콤마 구분) |

## 종료 코드

| 상황 | 종료 코드 |
|------|-----------|
| `--ci`/`--threshold` 없음 (리포트만) | 0 |
| 동기화율 ≥ 임계값 | 0 (미구현 요구사항이 있어도 통과) |
| 동기화율 < 임계값 | 2 (`VALIDATION_FAILED`) — 리포트는 항상 먼저 출력 |
| 잘못된 `--threshold` (숫자 아님, 0~100 밖) | 0이 아닌 코드로 에러 |

## 참조 형식

요구사항 ID(`REQ-xx`)는 스펙마다 따로 매겨지므로, 여러 스펙에 같은 ID가 있을 때는
**스펙 한정 참조** `<spec>#REQ-xx`를 사용합니다. `<spec>`은 `<domain>/<feature>` 또는 유일한 `<feature>`입니다.

```typescript
/**
 * @spec auth/login#REQ-01
 * @spec auth/login#REQ-02, billing/pay#REQ-01
 */
function login() {}
```

```typescript
describe('auth/login#REQ-01: 로그인', () => {
  it('should authenticate user', () => {});
});
```

- bare 참조 `@spec REQ-01`은 그 ID를 가진 스펙이 **하나뿐일 때만** 매칭됩니다.
  여러 스펙에 있으면 무시되고 "무시된 참조" 경고(JSON: `warnings`)로 보고됩니다.
- 특정 스펙만 검사해도(`sdd sync auth/login`) 모호성은 전체 스펙 기준으로 판단합니다.
- 어느 스펙에도 없는 참조는 "스펙 없는 코드"(JSON: `orphans`)로 보고됩니다.
- 요구사항은 **코드 또는 테스트 중 하나 이상**에서 참조되면 구현된 것으로 집계합니다.

## 예시

```bash
sdd sync                          # 전체 리포트 (종료 코드 0)
sdd sync auth/login               # 특정 스펙만
sdd sync --ci                     # 100% 미만이면 실패
sdd sync --ci --threshold 80      # 80% 미만이면 실패
sdd sync --json                   # JSON 출력
```

## CI/CD 통합

```yaml
- name: Check spec sync
  run: sdd sync --ci --threshold 80
```
