# 역추출 가이드

레거시 코드베이스에서 SDD 스펙을 역추출하는 방법을 설명합니다.

## 개요

역추출(Reverse Extraction)은 기존 코드에서 명세를 추출하는 프로세스입니다. 브라운필드 프로젝트에서 SDD를 도입할 때 유용합니다.

## 워크플로우

```
scan → extract → review → finalize
```

1. **Scan**: 코드베이스 분석 및 스펙 후보 식별
2. **Extract**: 후보에서 스펙 초안 생성
3. **Review**: 추출된 스펙 검토 및 수정
4. **Finalize**: 최종 스펙 확정 및 저장

## Scan (스캔)

### 기본 스캔

```bash
sdd reverse scan
sdd reverse scan src/
sdd reverse scan --depth deep
```

### 스캔 결과

```
📊 스캔 결과

분석된 파일: 45개
발견된 심볼: 234개

도메인 후보:
  - auth (신뢰도: 92%) - 15개 파일
  - core (신뢰도: 88%) - 25개 파일
  - api (신뢰도: 75%) - 5개 파일

스펙 후보: 18개
  높은 신뢰도 (>80%): 12개
  중간 신뢰도 (50-80%): 4개
  낮은 신뢰도 (<50%): 2개
```

### 스캔 옵션

| 옵션 | 설명 |
|------|------|
| `--depth quick` | 빠른 분석 (디렉토리 구조 기반) |
| `--depth normal` | 일반 분석 (파일 + 심볼) |
| `--depth deep` | 심층 분석 (의존성 + 타입) |
| `--exclude <glob>` | 제외 패턴 |
| `--include <glob>` | 포함 패턴 |

## Extract (추출)

### 전체 추출

```bash
sdd reverse extract
```

### 선택적 추출

```bash
sdd reverse extract --min-confidence 70
sdd reverse extract --domain auth
sdd reverse extract --interactive
```

### 추출 결과

```
📝 추출된 스펙: 12개

auth 도메인:
  ✓ user-login (신뢰도: 95%)
  ✓ oauth-google (신뢰도: 87%)
  ✓ session-management (신뢰도: 82%)

core 도메인:
  ✓ data-model (신뢰도: 90%)
  ✓ validation (신뢰도: 85%)

draft 스펙 저장 위치: .sdd/drafts/
```

## Review (검토)

### 대화형 검토

```bash
sdd reverse review
sdd reverse review --spec user-login
```

### 검토 인터페이스

```
📋 스펙 검토: auth/user-login

이름: user-login
설명: 사용자 이메일/비밀번호 로그인
신뢰도: 95%

시나리오:
  1. 유효한 자격증명으로 로그인 성공
  2. 잘못된 비밀번호로 로그인 실패
  3. 존재하지 않는 사용자

[a] 승인  [e] 편집  [s] 건너뛰기  [r] 거부  [q] 종료
```

### 편집 모드

```bash
sdd reverse review --edit user-login
```

편집 가능 항목:
- 스펙 이름 및 설명
- 시나리오 GIVEN/WHEN/THEN
- 계약 (입력/출력 타입)
- 도메인 할당
- 의존성

### AI 보조 검토

```bash
sdd reverse review --ai-assist
```

AI가 제공하는 기능:
- 시나리오 개선 제안
- 누락된 엣지 케이스 식별
- 명명 규칙 검토
- 설명 구체화

## Finalize (확정)

### 승인된 스펙 확정

```bash
sdd reverse finalize
```

### 선택적 확정

```bash
sdd reverse finalize --status approved
sdd reverse finalize --domain auth
```

### 확정 결과

```
✅ 스펙 확정 완료

저장된 스펙: 10개
  .sdd/specs/auth/user-login.md
  .sdd/specs/auth/oauth-google.md
  ...

생성된 도메인: 3개
  .sdd/domains.yml 업데이트됨

다음 단계:
  sdd list              # 스펙 확인
  sdd validate          # 검증 실행
```

## 데이터 파일

### 스캔 결과

`.sdd/reverse/scan-result.json`:

```json
{
  "scanned_at": "2025-12-29T10:00:00Z",
  "files_analyzed": 45,
  "symbols_found": 234,
  "suggested_domains": [...],
  "spec_candidates": [...]
}
```

### 추출된 스펙

`.sdd/drafts/<spec-id>.json`:

```json
{
  "id": "auth/user-login",
  "name": "user-login",
  "description": "사용자 로그인",
  "confidence": 0.95,
  "status": "draft",
  "scenarios": [...],
  "source": {...}
}
```

## 신뢰도 시스템

### 신뢰도 계산

- **구조 점수** (30%): 명확한 함수/클래스 구조
- **문서 점수** (25%): 주석, JSDoc, 타입 정의
- **테스트 점수** (25%): 기존 테스트 존재 여부
- **명명 점수** (20%): 명명 규칙 일관성

### 신뢰도 등급

| 등급 | 범위 | 의미 |
|------|------|------|
| 높음 | 80-100% | 자동 추출 권장 |
| 중간 | 50-79% | 검토 필요 |
| 낮음 | 0-49% | 수동 작성 권장 |

## 모범 사례

### 1. 점진적 접근

```bash
# 1. 빠른 스캔으로 전체 파악
sdd reverse scan --depth quick

# 2. 높은 신뢰도만 추출
sdd reverse extract --min-confidence 80

# 3. 검토 및 확정
sdd reverse review
sdd reverse finalize

# 4. 중간 신뢰도 처리
sdd reverse extract --min-confidence 50
```

### 2. 도메인별 처리

```bash
# 핵심 도메인부터 처리
sdd reverse scan src/core/
sdd reverse extract --domain core
sdd reverse finalize --domain core

# 다음 도메인
sdd reverse scan src/auth/
```

### 3. 팀 협업

```bash
# 스캔 결과 공유
sdd reverse scan --output scan-report.md

# 각자 검토
sdd reverse review --spec <assigned-spec>

# 최종 확정
sdd reverse finalize --status approved
```

## 문제 해결

### 낮은 신뢰도

- 코드 주석 추가
- 타입 정의 보강
- 수동으로 스펙 작성

### 잘못된 도메인 추론

```bash
sdd reverse review --edit <spec>
# 도메인 재할당
```

### 누락된 스펙

```bash
# 수동 추가
sdd new <domain>/<spec-name>
```

## 관련 문서

- [도메인 시스템](./domains.md)
- [CLI: reverse](../cli/reverse.md)
- [튜토리얼: 브라운필드](../tutorial/brownfield.md)
