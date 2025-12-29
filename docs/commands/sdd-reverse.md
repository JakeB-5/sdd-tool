# /sdd-reverse

레거시 코드베이스에서 SDD 스펙을 역추출하는 슬래시 커맨드입니다.

## 개요

`/sdd-reverse`는 기존 코드를 분석하여 SDD 스펙 초안을 자동 생성합니다. Claude Code의 대화형 인터페이스를 통해 리뷰와 승인 과정을 진행할 수 있습니다.

## 사용법

```
/sdd-reverse scan [path]         # 프로젝트 구조 스캔
/sdd-reverse extract [path]      # 코드에서 스펙 추출
/sdd-reverse review [spec-id]    # 추출된 스펙 리뷰
/sdd-reverse finalize [spec-id]  # 승인된 스펙 확정
```

## 워크플로우

```
scan → extract → review → finalize
```

### 1. Scan (스캔)

프로젝트를 분석하여 디렉토리 구조, 언어 분포, 도메인을 추정합니다.

```
/sdd-reverse scan
/sdd-reverse scan src/
```

**출력 예시:**
```
🔍 프로젝트 스캔 결과

📁 구조:
  src/
  ├── auth/ (3 files)
  ├── order/ (5 files)
  └── core/ (8 files)

📊 통계:
  - 언어: TypeScript (100%)
  - 파일: 16개
  - 심볼: 45개

💡 추정 도메인:
  1. auth - 인증 관련
  2. order - 주문 관련
  3. core - 공통 모듈
```

### 2. Extract (추출)

스캔 결과를 기반으로 코드에서 스펙 초안을 추출합니다.

```
/sdd-reverse extract
/sdd-reverse extract --domain auth
/sdd-reverse extract --depth deep
```

**옵션:**
- `--domain <name>`: 특정 도메인만 추출
- `--depth <level>`: 분석 깊이 (shallow, medium, deep)
- `--min-confidence <n>`: 최소 신뢰도 필터

### 3. Review (리뷰)

추출된 스펙 초안을 리뷰하고 승인/거부합니다.

```
/sdd-reverse review              # 리뷰 대기 목록
/sdd-reverse review auth/login   # 특정 스펙 상세
```

**리뷰 상태:**
- `pending`: 리뷰 대기
- `approved`: 승인됨
- `rejected`: 거부됨
- `needs_revision`: 수정 필요

### 4. Finalize (확정)

승인된 스펙을 정식 SDD 스펙으로 변환합니다.

```
/sdd-reverse finalize --all      # 모든 승인 스펙 확정
/sdd-reverse finalize auth/login # 특정 스펙 확정
```

## 출력 파일

| 파일 | 설명 |
|------|------|
| `.sdd/.reverse-meta.json` | 스캔 결과 메타데이터 |
| `.sdd/.reverse-drafts/` | 스펙 초안 디렉토리 |
| `.sdd/specs/` | 확정된 스펙 디렉토리 |

## 예시: 전체 워크플로우

```
User: /sdd-reverse scan

Claude: 🔍 프로젝트 스캔 완료!

📁 발견된 구조:
  src/
  ├── auth/ (3 files, 450 LOC)
  ├── order/ (5 files, 890 LOC)
  └── core/ (8 files, 1200 LOC)

💡 추정 도메인: auth, order, core

다음 단계: /sdd-reverse extract 실행

---

User: /sdd-reverse extract --depth deep

Claude: 📝 스펙 추출 완료!

생성된 초안:
  - auth/user-authentication (신뢰도: 72%)
  - auth/token-management (신뢰도: 85%)
  - order/checkout (신뢰도: 78%)

⚠️ 검토 필요 항목: 8개

다음 단계: /sdd-reverse review 실행

---

User: /sdd-reverse review auth/user-authentication

Claude: 📋 스펙 리뷰: auth/user-authentication

신뢰도: 72%

## 추출된 요구사항:
1. REQ-001: 이메일/비밀번호 로그인 [85%]
2. REQ-002: JWT 토큰 발급 [90%]
3. REQ-003: 세션 만료 24시간 [70%]

## 추출된 시나리오:
1. 정상 로그인 [95%]
2. 잘못된 비밀번호 [95%]

이 스펙을 승인하시겠습니까?
1. 승인
2. 수정 필요
3. 거부

---

User: 1

Claude: ✅ auth/user-authentication 승인됨

다음 단계: /sdd-reverse finalize auth/user-authentication

---

User: /sdd-reverse finalize --all

Claude: 🎉 스펙 확정 완료!

확정된 스펙:
  - .sdd/specs/auth/user-authentication.md
  - .sdd/specs/auth/token-management.md
  - .sdd/specs/order/checkout.md

다음 단계:
  1. sdd validate로 스펙 검증
  2. 필요시 수동 보완
```

## 신뢰도 점수

추출된 스펙의 신뢰도는 다음 요소로 계산됩니다:

| 요소 | 가중치 | 평가 기준 |
|------|--------|-----------|
| documentation | 25% | JSDoc, 주석 품질 |
| naming | 20% | 네이밍 규칙 준수 |
| structure | 20% | 코드 구조화 |
| testCoverage | 20% | 테스트 존재 여부 |
| typing | 15% | 타입 정보 품질 |

## 참고사항

- Serena MCP가 연결되면 심볼 수준 분석이 가능합니다
- 추출된 스펙은 반드시 리뷰 후 확정해야 합니다
- 신뢰도가 낮은 스펙은 수정이 필요할 수 있습니다

## 관련 명령어

- [`sdd reverse`](/cli/reverse) - CLI 버전
- [`/sdd.new`](/commands/sdd-new) - 새 스펙 작성
- [`/sdd.validate`](/commands/sdd-validate) - 스펙 검증
