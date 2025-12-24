# sdd diff

스펙 변경사항을 시각적으로 표시합니다.

## 사용법

```bash
sdd diff [commit1] [commit2] [options]
```

## 인수

| 인수 | 설명 |
|------|------|
| `commit1` | 시작 커밋 (생략 시 HEAD) |
| `commit2` | 끝 커밋 |

## 옵션

| 옵션 | 설명 |
|------|------|
| `--staged` | 스테이징된 변경만 |
| `--stat` | 통계 요약 |
| `--json` | JSON 형식 출력 |

## 예시

### 작업 디렉토리 변경

```bash
sdd diff
```

### 스테이징된 변경

```bash
sdd diff --staged
```

### 커밋 간 비교

```bash
sdd diff abc123 def456
```

### 통계 요약

```bash
sdd diff --stat
```

## 출력 예시

### 상세 출력

```
SDD Diff

.sdd/specs/user-auth/spec.md

  요구사항 변경:
  + REQ-03: 비밀번호 재설정 (새로 추가)
  ~ REQ-01: 로그인 (키워드 변경: SHOULD → SHALL)

  시나리오 변경:
  + Scenario 3: 비밀번호 재설정 성공
```

### 통계 요약

```
SDD Diff --stat

  2 specs changed
  + 3 requirements added
  ~ 1 requirement modified
  - 0 requirements removed
  + 2 scenarios added
```

## 변경 유형

| 기호 | 의미 |
|------|------|
| `+` | 추가 |
| `-` | 삭제 |
| `~` | 수정 |

## 키워드 변경 감지

RFC 2119 키워드 변경을 특별히 강조합니다:

```
REQ-01: 로그인
  키워드: SHOULD → SHALL (강화됨)
```
