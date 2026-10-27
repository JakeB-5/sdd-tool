# sdd prompt

SDD 워크플로우 단계별 프롬프트 템플릿을 출력합니다. 다른 AI 도구에서 재사용할 때 사용합니다.

## 사용법

```bash
sdd prompt [name]
sdd prompt --list
```

이름 없이 실행하거나 `--list`를 지정하면 사용 가능한 프롬프트 목록을 출력합니다.
목록에 없는 이름을 지정하면 에러로 종료합니다.

## 프롬프트

| 이름 | 설명 | 관련 스킬 / 명령어 |
|------|------|--------------------|
| `new` | 신규 기능 명세 작성 | `/sdd-spec` |
| `plan` | 구현 계획 작성 | `/sdd-plan` |
| `tasks` | 작업 분해 | `/sdd-tasks` |
| `change` | 변경 제안 작성 | `/sdd-spec` |
| `apply` | 승인된 변경 적용 | `sdd change apply <id>` |
| `archive` | 완료된 변경 아카이브 | `sdd change archive <id>` |
| `impact` | 영향도 분석 | `/sdd-impact` |
| `validate` | 스펙 검증 | `/sdd-validate` |

## 옵션

| 옵션 | 설명 |
|------|------|
| `-l, --list` | 사용 가능한 프롬프트 목록 |

## 예시

```bash
# 목록 확인
sdd prompt --list

# 변경 제안 프롬프트 출력
sdd prompt change

# 파일로 저장
sdd prompt plan > ./prompts/plan.md
```

## 관련 문서

- [CLI 참고 문서](./) - 전체 명령어
