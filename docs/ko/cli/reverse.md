# sdd reverse

레거시 코드베이스에서 SDD 스펙을 역추출합니다.

## 개요

`sdd reverse`는 기존 코드를 분석하여 SDD 스펙 초안을 자동 생성합니다. 레거시 프로젝트에 SDD를 도입할 때 유용합니다.

## 워크플로우

```
scan → extract → review → finalize
```

## 하위 명령어

### scan

프로젝트 구조를 스캔하고 분석합니다.

```bash
sdd reverse scan                    # 전체 프로젝트 스캔
sdd reverse scan src/               # 특정 디렉토리만 스캔
sdd reverse scan --json             # JSON 형식으로 출력
```

**출력:**
- 디렉토리 구조
- 언어 분포 통계
- 추정 도메인 목록
- 파일/심볼 수

### extract

스캔 결과를 기반으로 코드에서 스펙 초안을 추출합니다.

```bash
sdd reverse extract                 # 전체 추출
sdd reverse extract --domain auth   # 특정 도메인만 추출
sdd reverse extract --depth deep    # 깊은 분석 (시나리오 포함)
sdd reverse extract --dry-run       # 미리보기만
```

**옵션:**

| 옵션 | 설명 |
|------|------|
| `--domain <name>` | 특정 도메인만 추출 |
| `--depth <level>` | 분석 깊이 (shallow, medium, deep) |
| `--min-confidence <n>` | 최소 신뢰도 (0-100) |
| `--dry-run` | 실제 파일 생성 없이 미리보기 |

### review

추출된 스펙 초안을 리뷰하고 승인/거부합니다.

```bash
sdd reverse review                  # 리뷰 대기 목록 표시
sdd reverse review auth/login       # 특정 스펙 상세 보기
```

**리뷰 상태:**
- `pending`: 리뷰 대기
- `approved`: 승인됨
- `rejected`: 거부됨
- `needs_revision`: 수정 필요

### finalize

승인된 스펙을 정식 SDD 스펙으로 변환합니다.

```bash
sdd reverse finalize --all          # 모든 승인된 스펙 확정
sdd reverse finalize auth/login     # 특정 스펙만 확정
```

## 출력 파일

| 파일 | 설명 | 생성 시점 |
|------|------|----------|
| `.sdd/.reverse-meta.json` | 스캔 결과 메타데이터 | `scan` |
| `.sdd/.reverse-drafts/<domain>/<spec>.json` | 스펙 초안 | `extract` |
| `.sdd/specs/<domain>/<spec>/spec.md` | 확정된 스펙 (v1.3.0) | `finalize` |

::: tip v1.3.0 경로 변경
확정된 스펙은 이제 `<domain>/<feature>/spec.md` 형식으로 저장됩니다.
예: `.sdd/specs/auth/login/spec.md`
:::

## 사용 예시

### 기본 워크플로우

```bash
# 1. 프로젝트 스캔
sdd reverse scan
# → 디렉토리 구조, 언어 분포, 도메인 추정

# 2. 스펙 추출
sdd reverse extract --depth deep
# → .sdd/.reverse-drafts/에 초안 생성

# 3. 리뷰
sdd reverse review
# → 각 스펙 승인/거부/수정

# 4. 확정
sdd reverse finalize --all
# → .sdd/specs/<domain>/<feature>/spec.md에 정식 스펙 생성
```

### 특정 도메인만 추출

```bash
sdd reverse scan src/auth/
sdd reverse extract --domain auth
sdd reverse review auth/login
sdd reverse finalize auth/login
```

## 신뢰도 점수

추출된 스펙에는 신뢰도 점수가 포함됩니다:

| 요소 | 가중치 | 설명 |
|------|--------|------|
| documentation | 25% | JSDoc/주석 품질 |
| naming | 20% | 네이밍 규칙 준수 |
| structure | 20% | 코드 구조화 정도 |
| testCoverage | 20% | 테스트 커버리지 추정 |
| typing | 15% | 타입 정보 품질 |

## Serena MCP 연동

Serena MCP가 연결된 환경에서는 심볼 수준의 정밀한 분석이 가능합니다:

- 클래스/함수/인터페이스 추출
- 참조 관계 분석
- 의존성 그래프 생성

Serena가 없어도 기본 파일 스캔은 동작합니다.

## 참고

- [역방향 스펙 추출 가이드](/roadmap/reverse-extraction)
- [도메인 관리](/guide/workflow-constitution)
