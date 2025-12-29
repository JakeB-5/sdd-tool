# Constitution 변경 워크플로우

프로젝트 헌법(Constitution)을 변경할 때의 워크플로우입니다.

## Constitution이란?

Constitution은 프로젝트의 **핵심 원칙과 규칙**을 정의합니다:
- 아키텍처 결정
- 코딩 표준
- API 설계 원칙
- 보안 정책

모든 스펙은 Constitution을 준수해야 합니다.

---

## 변경이 필요한 경우

- **새 원칙 추가**: 팀에서 합의된 새 규칙
- **원칙 수정**: 기존 규칙의 변경이나 명확화
- **원칙 제거**: 더 이상 유효하지 않은 규칙

---

## 개요

```
논의 → 브랜치 → 수정 → 영향 분석 → 버전 업데이트 → PR → 전체 리뷰 → 병합
```

Constitution 변경은 **전체 팀의 합의**가 필요합니다.

---

## 단계별 가이드

### 1. 사전 논의

Constitution 변경 전 팀과 논의합니다:

- 슬랙/Teams에서 제안
- 회의에서 논의
- RFC(Request for Comments) 문서 작성

```markdown
<!-- RFC 예시 -->
## RFC: API 버전 관리 원칙 추가

### 배경
API 버전 관리에 대한 일관된 정책 필요

### 제안
- 모든 API는 버전을 명시해야 함 (MUST)
- URL 경로에 버전 포함: /api/v1/...
- 하위 호환성 최소 6개월 유지

### 영향
- 기존 API 스펙 업데이트 필요: 5개
- 새 스펙 템플릿 수정 필요
```

### 2. 브랜치 생성

```bash
git checkout main
git pull origin main
git checkout -b constitution/v2.0
```

**명명 규칙**: `constitution/<버전>`

### 3. Constitution 수정

```bash
# Constitution 파일 편집
# .sdd/constitution.md
```

**변경 예시**:

```markdown
<!-- .sdd/constitution.md -->
# Project Constitution

Version: 2.0.0
Last Updated: 2024-01-20

## 변경 이력
- v2.0.0 (2024-01-20): API 버전 관리 원칙 추가
- v1.1.0 (2024-01-10): 보안 원칙 강화
- v1.0.0 (2024-01-01): 초기 버전

---

## 1. 아키텍처 원칙

### 1.1 계층 분리
모든 비즈니스 로직은 서비스 계층에 위치해야 한다 (MUST).
...

## 2. API 설계 원칙 (NEW)

### 2.1 버전 관리
- 모든 API는 URL 경로에 버전을 포함해야 한다 (MUST)
- 형식: `/api/v{major}/...`
- 하위 호환성은 최소 6개월 유지해야 한다 (MUST)

### 2.2 응답 형식
- 모든 API는 일관된 응답 형식을 사용해야 한다 (MUST)
- 성공: `{ data: ..., meta: ... }`
- 실패: `{ error: { code, message, details } }`
```

### 4. 영향 분석

```bash
# Constitution 준수 여부 검사
sdd validate --constitution

# 위반 스펙 목록 확인
sdd validate --constitution --verbose
```

**출력 예시**:
```
❌ Constitution 위반 발견: 5개 스펙

위반 목록:
  1. api/user-endpoint
     - 위반: "API 버전 관리" (2.1)
     - 내용: URL에 버전 없음

  2. api/product-endpoint
     - 위반: "API 버전 관리" (2.1)
     - 내용: URL에 버전 없음
     - 위반: "응답 형식" (2.2)
     - 내용: 에러 응답 형식 불일치

  ...

💡 이 스펙들을 업데이트하거나, Constitution 적용을 유예하세요.
```

### 5. 버전 업데이트

```bash
# 버전 범프 (향후 CLI 지원)
# sdd constitution bump --minor

# 수동으로 버전 업데이트
# constitution.md의 Version 필드 수정
```

**시맨틱 버전**:
- **Major** (x.0.0): Breaking Change, 대규모 원칙 변경
- **Minor** (0.x.0): 새 원칙 추가
- **Patch** (0.0.x): 원칙 명확화, 오타 수정

### 6. 커밋

```bash
git add .sdd/constitution.md
git commit -m "constitution: v2.0 - add API design principles

신규 원칙:
- API 응답 형식 표준화 (MUST)
- 에러 코드 체계 (MUST)
- 버전 관리 정책 (MUST)

Breaking: 기존 API 스펙 5개 업데이트 필요
- api/user-endpoint
- api/product-endpoint
- api/order-endpoint
- api/payment-endpoint
- api/notification-endpoint

Migration: 각 스펙에 버전 정보 추가 필요"
```

### 7. PR 생성

```bash
git push -u origin constitution/v2.0

gh pr create \
  --title "constitution: v2.0 - API design principles" \
  --body "$(cat <<EOF
## 개요
API 설계 원칙 추가

## 변경 내용
### 신규 원칙
- 2.1 API 버전 관리 (MUST)
- 2.2 API 응답 형식 (MUST)

## 영향 분석
### 위반 스펙 (업데이트 필요)
- [ ] api/user-endpoint
- [ ] api/product-endpoint
- [ ] api/order-endpoint
- [ ] api/payment-endpoint
- [ ] api/notification-endpoint

### 마이그레이션 계획
1. Constitution 병합
2. 각 스펙 순차 업데이트 (별도 PR)
3. 2주 내 완료 목표

## 체크리스트
- [x] 팀 논의 완료
- [x] 영향 분석 완료
- [x] 마이그레이션 계획 수립
- [ ] 기술 리드 승인
- [ ] 아키텍트 승인
- [ ] 전체 팀 동의
EOF
)" \
  --reviewer tech-leads,architects
```

### 8. 전체 팀 리뷰

Constitution 변경은 **특별한 리뷰 프로세스**를 따릅니다:

- **리뷰어**: 기술 리드, 아키텍트 필수
- **승인 수**: 최소 3명 (일반 PR보다 많음)
- **기간**: 충분한 리뷰 시간 (최소 2-3일)
- **논의**: PR 코멘트에서 논의

### 9. 병합 & 후속 작업

```bash
# 병합 (merge commit 권장 - 이력 보존)
gh pr merge --merge

# 정리
git checkout main
git pull
git branch -d constitution/v2.0
```

**후속 작업**:
1. 팀 공지
2. 위반 스펙 업데이트 (별도 PR들)
3. 템플릿 업데이트 (필요시)

---

## 긴급 변경

보안 이슈 등 긴급한 경우:

```bash
# 긴급 브랜치
git checkout -b constitution/hotfix-security

# 빠른 리뷰 프로세스
# - 최소 리뷰어로 진행
# - 사후 전체 공지

# 병합 후 상세 설명
```

---

## 모범 사례

### 변경 전

- **충분한 논의**: 팀 전체가 이해하고 동의
- **영향 파악**: 위반 스펙 미리 확인
- **마이그레이션 계획**: 업데이트 일정 수립

### 변경 시

- **명확한 버전**: 시맨틱 버전 준수
- **상세한 이력**: 변경 이력 섹션 업데이트
- **구체적인 규칙**: MUST/SHOULD 명시

### 변경 후

- **팀 공지**: 변경 사항 전파
- **순차적 업데이트**: 위반 스펙 정리
- **검증**: 전체 `sdd validate --constitution`

---

## 관련 문서

- [Constitution 작성 가이드](/spec-writing/constitution.md)
- [커밋 컨벤션](./commit-convention.md)
- [브랜치 전략](./branch-strategy.md)
