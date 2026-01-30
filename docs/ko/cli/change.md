# sdd change

기존 스펙에 대한 변경 제안을 관리합니다.

## 사용법

```bash
sdd change [command] [options]
```

## 서브커맨드

| 커맨드 | 설명 |
|--------|------|
| `create` | 새 변경 제안 생성 |
| `list` | 대기 중인 변경 목록 |
| `show <id>` | 변경 상세 정보 |
| `apply <id>` | 변경 적용 |
| `archive <id>` | 완료된 변경 아카이브 |

## 옵션

| 옵션 | 설명 |
|------|------|
| `-t, --title <title>` | 변경 제안 제목 |
| `-s, --spec <spec-id>` | 영향받는 스펙 ID |
| `--dry-run` | 실제 적용 없이 미리보기 |

## 변경 워크플로우

```
create → review → apply → archive
```

1. **create**: 변경 제안서(proposal.md)와 델타 파일(delta.md) 생성
2. **review**: 팀 리뷰 및 수정
3. **apply**: 변경 내용을 기존 스펙에 적용
4. **archive**: 완료된 변경을 아카이브로 이동

## 예시

### 새 변경 제안 생성

```bash
sdd change create --title "로그인 기능 개선" --spec user-auth
```

출력:
```
✅ 변경 제안이 생성되었습니다.
   ID: CHG-001
   경로: .sdd/changes/CHG-001/

생성된 파일:
  - proposal.md (변경 제안서)
  - delta.md (변경 내용)
```

### 대기 중인 변경 목록

```bash
sdd change list
```

출력:
```
=== 대기 중인 변경 ===

CHG-001: 로그인 기능 개선 [draft]
CHG-002: API 응답 형식 변경 [review]

총 2개
```

### 변경 상세 정보

```bash
sdd change show CHG-001
```

### 변경 적용

```bash
sdd change apply CHG-001
```

### 변경 아카이브

```bash
sdd change archive CHG-001
```

## 생성되는 파일

### proposal.md

```markdown
---
id: CHG-001
title: "로그인 기능 개선"
status: draft
created: 2025-01-07
---

# 변경 제안: 로그인 기능 개선

## 변경 이유

[변경이 필요한 이유를 설명하세요]

## 영향받는 스펙

- user-auth

## 변경 내용 요약

[주요 변경 사항을 요약하세요]
```

### delta.md

```markdown
---
proposal_id: CHG-001
---

# Delta: 로그인 기능 개선

## ADDED

- [새로 추가되는 요구사항]

## MODIFIED

- [변경되는 요구사항]

## REMOVED

- [삭제되는 요구사항]
```

## 관련 문서

- [sdd impact](./impact) - 변경 영향도 분석
- [CLI 참고 문서](./) - 전체 명령어
