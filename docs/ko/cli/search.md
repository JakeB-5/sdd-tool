# sdd search

스펙을 검색합니다.

## 사용법

```bash
sdd search [query] [options]
```

필터를 하나 이상 지정하면 query는 생략할 수 있습니다.

## 옵션

| 옵션 | 설명 |
|------|------|
| `--status <status>` | 상태 필터, 쉼표 구분 (`draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated`) |
| `--phase <phase>` | Phase 필터, 쉼표 구분 |
| `--author <author>` | 작성자 필터 |
| `--tags <tags>` | 태그 필터, 쉼표 구분 |
| `--created-after <date>` / `--created-before <date>` | 생성일 범위 (YYYY-MM-DD) |
| `--updated-after <date>` / `--updated-before <date>` | 수정일 범위 (YYYY-MM-DD) |
| `--depends-on <specId>` | 지정한 스펙에 의존하는 스펙 |
| `--limit <n>` | 결과 최대 개수 |
| `--sort-by <field>` | `relevance`, `created`, `updated`, `title`, `status` |
| `--sort-order <order>` | `asc` 또는 `desc` |
| `-r, --regex` | query를 정규식으로 처리 |
| `-c, --case-sensitive` | 대소문자 구분 |
| `--json` | JSON 형식으로 출력 |

잘못된 `--limit`, `--sort-by`, `--sort-order`, 날짜, 상태는 거부됩니다. `created`가 없는 스펙은 `--created-*` 필터에
매칭되지 않습니다.

## 검색 대상

모든 스펙의 전체 텍스트(frontmatter, 요구사항, 시나리오)를 검색하며, 매칭은 줄 번호와 함께 표시됩니다.

## 예시

### 기본 검색

```bash
sdd search "login"
```

출력:
```
🔍 검색 결과: "login"
   2개 발견 (8ms)

📝 auth/login
   제목: login
   상태: draft | Phase: unknown | 점수: ██████████ 100%
   매칭:
     L2: id: **login**
```

### 상태로 필터링

```bash
sdd search "payment" --status approved,implemented
```

### 태그로 필터링

```bash
sdd search --tags critical
```

### 정규식

```bash
sdd search "user-.*" --regex
```

### 의존하는 스펙 찾기

```bash
sdd search --depends-on auth/login
```

### JSON 출력

```bash
sdd search "authentication" --json --limit 5
```

### RFC 키워드 검색

```bash
sdd search "SHALL NOT" --case-sensitive
```

## 관련 문서

- [sdd list](/cli/list) - 목록 조회
- [sdd status](/cli/status) - 상태 확인
