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

`.sdd/constitution.md`:

```markdown
---
version: 2.0.0
created: 2024-01-01
updated: 2024-01-20
---

# Constitution: My Project

> 프로젝트의 아키텍처와 API 원칙.

## 핵심 원칙

### 1. 계층 분리

- 모든 비즈니스 로직은 서비스 계층에 위치해야 한다(SHALL)

### 2. API 버전 관리 (NEW)

- 모든 API는 URL 경로에 버전을 포함해야 한다(SHALL) (`/api/v{major}/...`)
- 하위 호환성은 최소 6개월 유지해야 한다(SHALL)

### 3. 응답 형식 (NEW)

- 모든 API는 일관된 응답 형식을 사용해야 한다(SHALL)
- 성공: `{ data: ..., meta: ... }`, 실패: `{ error: { code, message, details } }`
```

버전은 frontmatter의 `version:`에 두고, 제목 줄은 `# Constitution: <프로젝트명>` 형식이어야 합니다. 원칙은
`## 핵심 원칙`(또는 `## 원칙`) 아래의 `### N. 제목` 항목으로 파싱되며, 그 밖에 인식되는 섹션은 `## 기술 스택`,
`## 품질 기준`, `## 금지 사항`입니다(금지 규칙에는 `SHALL NOT` / `MUST NOT`이 있어야 함). 변경 이력은
`sdd constitution bump`(5단계)가 `.sdd/CHANGELOG.md`에 남기므로 "변경 이력" 섹션을 직접 관리할 필요가 없습니다.

### 4. 영향 분석

```bash
# 각 스펙의 constitution_version을 constitution과 비교 (기본값으로 켜져 있음)
sdd validate --constitution
```

`sdd validate`는 모든 스펙의 `constitution_version`을 현재 constitution과 비교합니다. Patch 차이는 정보,
Minor 차이는 경고, Major 차이는 에러(종료 코드 2)로 보고합니다. constitution 파일을 파싱할 수 없으면 경고 W007을 보고하고 검사를 건너뜁니다.
원칙의 내용 자체는 읽지 않으므로 "API 버전 관리" 같은 규칙에 대한 스펙 준수 여부는
리뷰로 확인해야 하며, 영향받는 스펙은 `sdd search`로 찾을 수 있습니다.

**출력 예시**:
```
✓ api/user-endpoint/spec.md
  ⚠ Constitution Minor 버전이 변경되었습니다 (1.0.0 → 1.1.0). 새 원칙을 확인하세요.
```

### 5. 버전 업데이트

```bash
# 버전을 올리고 변경 기록 (--major | --minor | --patch 중 하나 필수)
sdd constitution bump --minor -m "API 설계 원칙 추가"

# 이력 확인
sdd constitution history
```

이 명령은 constitution.md의 Version 필드를 갱신하고 변경 내용을 `.sdd/CHANGELOG.md`에 기록합니다.

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
