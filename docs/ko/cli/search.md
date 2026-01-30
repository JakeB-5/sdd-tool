# sdd search

스펙을 검색합니다.

## 사용법

```bash
sdd search <query> [options]
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `-d, --domain <domain>` | 도메인 필터 |
| `-s, --status <status>` | 상태 필터 |
| `--tag <tag>` | 태그 필터 |
| `--json` | JSON 형식으로 출력 |
| `--limit <n>` | 결과 수 제한 (기본: 20) |
| `--content` | 본문 내용도 검색 |

## 검색 대상

- 스펙 ID
- 스펙 제목
- 요구사항 내용
- 시나리오 내용
- 태그

## 예시

### 기본 검색

```bash
sdd search "로그인"
```

출력:
```
=== 검색 결과: "로그인" ===

📄 user-auth (auth 도메인)
   제목: 사용자 인증
   상태: approved
   매치: "로그인 기능을 지원해야 한다(SHALL)"

📄 social-login (auth 도메인)
   제목: 소셜 로그인
   상태: draft
   매치: "소셜 로그인은 OAuth 2.0을 사용해야 한다"

총 2개 결과
```

### 도메인 필터

```bash
sdd search "인증" --domain auth
```

### 상태 필터

```bash
sdd search "결제" --status approved
```

### 태그 필터

```bash
sdd search --tag "critical"
```

### 본문 검색

```bash
sdd search "JWT" --content
```

### JSON 출력

```bash
sdd search "인증" --json
```

```json
{
  "query": "인증",
  "results": [
    {
      "id": "user-auth",
      "title": "사용자 인증",
      "domain": "auth",
      "status": "approved",
      "matches": [
        {
          "type": "requirement",
          "content": "사용자 인증 기능을 지원해야 한다(SHALL)"
        }
      ]
    }
  ],
  "total": 1
}
```

### 복합 필터

```bash
sdd search "API" --domain api --status draft --limit 5
```

## 검색 팁

### 정확한 문구 검색

따옴표로 감싸서 정확한 문구를 검색합니다:

```bash
sdd search "\"로그인 실패\""
```

### 와일드카드 검색

```bash
sdd search "user-*"
```

### RFC 키워드 검색

```bash
sdd search "SHALL NOT"
```

## 관련 문서

- [sdd list](/cli/list) - 목록 조회
- [sdd status](/cli/status) - 상태 확인
