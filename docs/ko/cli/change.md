# sdd change

기존 스펙에 대한 변경 제안을 관리합니다.

## 사용법

```bash
sdd change [id] [options]        # id 없음: 새 제안 생성, id 지정: 상세 조회
sdd change <subcommand> <id>
```

## 서브커맨드

| 커맨드 | 설명 |
|--------|------|
| `apply <id>` | 제안 상태를 `applied`로 표시 (스펙 파일은 자동으로 수정하지 않음) |
| `archive <id>` | 완료된 변경을 `.sdd/archive/YYYY-MM/YYYY-MM-DD-<id>/`로 이동 |
| `diff <id>` | delta.md의 ADDED/MODIFIED/REMOVED 요약 표시 |
| `validate <id>` | proposal.md·delta.md 형식 검증 (실패 시 종료 코드 2) |

## 옵션

| 옵션 | 설명 |
|------|------|
| `-l, --list` | 진행 중인 변경 목록 |
| `-t, --title <title>` | 변경 제안 제목 |
| `-s, --spec <spec>` | 대상 스펙 경로 |

## 변경 워크플로우

```
생성 → delta.md 작성 → validate → 스펙 수정 → apply → archive
```

1. **생성** (`sdd change -t "..."`): `proposal.md`와 `delta.md` 생성. ID는 진행 중인 변경과
   아카이브된 변경을 모두 고려해 발급되므로 아카이브 후에도 재사용되지 않습니다.
2. **delta.md 작성**: ADDED / MODIFIED / REMOVED 섹션 작성
3. **validate**: 형식 검증
4. **스펙 수정**: delta.md를 참고해 사용자 또는 AI가 스펙 파일을 직접 수정
5. **apply**: 제안을 적용됨(`applied`)으로 표시 — 스펙 파일을 다시 쓰지 않습니다
6. **archive**: 완료된 변경을 아카이브로 이동 (날짜는 로컬 시간 기준)

## 예시

```bash
sdd change -t "로그인 기능 개선" -s auth/login   # CHG-001 생성
sdd change -l                                    # 목록
sdd change CHG-001                               # 상세 (proposal.md 파싱 실패 시 종료 코드 2)
sdd change validate CHG-001
sdd change apply CHG-001
sdd change archive CHG-001
```

## delta.md 형식

~~~markdown
---
proposal: CHG-001
created: 2025-01-07
---

# Delta: 로그인 기능 개선

## ADDED

### REQ-10: OAuth 로그인

시스템은 OAuth 2.0을 지원해야 한다(SHALL).

## MODIFIED

### specs/auth/login/spec.md

#### Before

```markdown
기존 내용
```

#### After

```markdown
변경된 내용
```

### specs/auth/logout/spec.md

#### Before
...

## REMOVED

### REQ-01: 레거시 로그인
~~~

- 섹션 경계는 `## ` 제목뿐입니다. ADDED/REMOVED 안의 `###` 하위 제목은 섹션에 포함됩니다.
- MODIFIED는 `### <대상>`마다 별도 항목으로 파싱되며, 대상마다 Before/After를 가집니다
  (`#### Before` 또는 `**Before:**` 다음의 코드 블록).
- 코드 블록 안의 `## ` 줄은 제목으로 취급하지 않습니다.

## 관련 문서

- [sdd impact](./impact) - 변경 영향도 분석 (`impact simulate`는 delta.md를 읽습니다)
- [CLI 참고 문서](./) - 전체 명령어
