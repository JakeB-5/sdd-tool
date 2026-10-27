# sdd impact

스펙 변경의 영향도를 분석합니다.

## 사용법

```bash
sdd impact <spec> [options]
sdd impact report [--json]
sdd impact change <change-id> [--json]
sdd impact simulate <spec> <change-id> [--json]
```

`<spec>`은 `<domain>/<feature>` 또는 유일한 `<feature>`입니다.

## 옵션

| 옵션 | 설명 |
|------|------|
| `-g, --graph` | 의존성 그래프 출력 (Mermaid) |
| `-c, --code` | 코드 영향도 분석 |
| `--json` | JSON 형식 출력 — 모든 하위 커맨드에서 사용 가능하며 stdout에는 JSON만 출력 |

## 서브커맨드

| 커맨드 | 설명 |
|--------|------|
| `report` | 전체 프로젝트 의존성 리포트 |
| `change <id>` | 변경 제안이 영향을 주는 스펙 분석 |
| `simulate <spec> <id>` | 변경을 적용했다고 가정한 영향도 예측 (What-if) |

## 분석 내용

- **의존하는 스펙**: 대상 스펙이 사용하는 스펙 (frontmatter `depends`)
- **직접/간접 영향 스펙**: 대상 스펙에 의존하는 스펙
- **리스크 점수**와 권장사항

### 의존성과 참조

의존성은 frontmatter `depends` 목록(`depends: [pricing/cart]`, 없으면 `[]`)에서**만** 만들어집니다.
본문에서 다른 스펙을 `` `pricing/cart` ``, 마크다운 링크, `specs/...` 경로로 언급하면 **참조**입니다.
참조는 따로 표시되며(`sdd impact <spec>`의 "본문 참조 (의존성 아님)", `sdd impact report`의 참조 수,
`--graph`의 점선 `참조` 화살표, `--graph --json`의 `references`) 의존성 엣지 · 순환 · 건강도 · 리스크 점수에
영향을 주지 않습니다. 실제 의존성은 `depends`에 선언하세요.

## simulate

`simulate`는 `.sdd/changes/<id>/delta.md`를 읽습니다 (delta.md가 없는 레거시 변경만 proposal.md 사용).

- `## ADDED` / `## REMOVED`: 명시적 스펙 대상만 사용 — `` `spec-id` ``로 시작하는 목록 항목은 그 스펙의 추가/제거,
  기존 스펙으로 해석되는 `### <스펙>` 제목은 그 스펙의 수정으로 봅니다. 요구사항 본문(일반 bullet, `### REQ-xx` 제목)과
  `<!-- -->` 플레이스홀더는 무시합니다
- `## MODIFIED`: `### <대상 스펙>`마다 Before/After의 `depends:` 줄을 비교해
  추가·제거된 의존성을 계산합니다 (`newDependencies`, `removedDependencies`)
- 결과의 `changes.addedEdges` / `changes.removedEdges`는 현재와 예상 그래프의 실제 엣지 차이입니다
- 델타가 하나도 없으면 에러로 종료합니다 (종료 코드 1)

```bash
sdd impact simulate auth/login CHG-001 --json
```

## 예시

```bash
sdd impact auth/login              # 영향도 분석
sdd impact auth/login --graph      # Mermaid 그래프
sdd impact auth/login -c --json    # 코드 영향도 (JSON)
sdd impact report --json           # 전체 리포트 (JSON)
sdd impact change CHG-001 --json   # 변경 제안 영향 (JSON)
```

## 관련 문서

- [sdd change](/cli/change) - 변경 관리
- [sdd domain](/cli/domain) - 도메인 관리
- [sdd sync](/cli/sync) - 스펙-코드 동기화
