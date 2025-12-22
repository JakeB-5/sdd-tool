# SDD Tool 구현 태스크 체크리스트

> GAP-ANALYSIS.md 기반 작업 목록

---

## 🔴 Priority 1: 핵심 기능 (High)

### 1.1 Constitution 시스템 구현 ✅

**스펙**: `.sdd/specs/phase-1/02-constitution.md`

- [x] `sdd constitution` CLI 명령어 추가
  - [x] `sdd constitution show` - 현재 Constitution 표시
  - [x] `sdd constitution version` - 버전 표시
  - [x] `sdd constitution bump` - 버전 업데이트
  - [x] `sdd constitution history` - 버전 이력 조회
  - [x] `sdd constitution validate` - 형식 검증
- [x] Constitution 시맨틱 버전 관리
  - [x] MAJOR: 핵심 원칙 변경 시
  - [x] MINOR: 새 원칙 추가 시
  - [x] PATCH: 문구 수정 시
  - [x] frontmatter에 버전 필드 추가
- [x] CHANGELOG.md 자동 생성/업데이트
  - [x] 버전 변경 시 자동 기록
  - [x] 변경 사유 기록
- [x] `/sdd.constitution` 슬래시 커맨드 생성
  - [x] `.claude/commands/sdd.constitution.md` 파일 생성
  - [x] init 명령에 자동 포함
- [x] 스펙 생성 시 Constitution 버전 참조
  - [x] spec.md frontmatter에 `constitution_version` 필드 추가

### 1.2 변경 워크플로우 완성 ✅

**스펙**: `.sdd/specs/phase-2/01-change-workflow.md`

- [x] `/sdd.change` 슬래시 커맨드 강화
  - [x] 대상 스펙 자동 탐색 로직
  - [x] 자연어 변경 요청 처리 가이드
- [x] 델타 자동 생성 지원
  - [x] ADDED 섹션 자동 생성
  - [x] MODIFIED 섹션 (Before/After) 자동 생성
  - [x] REMOVED 섹션 자동 생성
- [x] `sdd change` CLI 강화
  - [x] `sdd change` - 변경 제안 생성
  - [x] `sdd change -l` - 제안 목록 조회
  - [x] `sdd change <id>` - 상세 조회
  - [x] `sdd change diff <id>` - diff 미리보기
  - [x] `sdd change validate <id>` - 유효성 검증
- [x] `sdd change apply <id>` 완성
  - [x] 상태 업데이트
- [x] `sdd change archive <id>` 완성
  - [x] 완료된 변경을 archive/로 이동
  - [x] 아카이브 메타데이터 기록

---

## 🟡 Priority 2: 사용성 개선 (Medium)

### 2.1 통합 진입점 구현 ✅

**스펙**: `.sdd/specs/phase-4/01-start.md`

- [x] `sdd start` 명령어 추가
  - [x] 대화형 워크플로우 선택 메뉴
  - [x] 현재 프로젝트 상태 기반 추천
- [x] 워크플로우 옵션
  - [x] 새 기능 개발 → `sdd new` 연결
  - [x] 기존 기능 변경 → `sdd change` 연결
  - [x] 프로젝트 상태 확인 → `sdd status` 연결
- [x] `/sdd.start` 슬래시 커맨드 생성

### 2.2 영향도 분석 강화 ✅

**스펙**: `.sdd/specs/phase-2/02-impact-analysis.md`

- [x] `sdd impact` 명령어 강화
  - [x] 내용 기반 의존성 추론 (암시적 참조 감지)
  - [x] 리스크 점수 산출 로직
  - [x] 간접(transitive) 영향 분석
- [x] `sdd impact report` - 전체 프로젝트 리포트
  - [x] 핵심 스펙 분석
  - [x] 순환 의존성 탐지
  - [x] 건강도 점수 산출
- [x] `sdd impact change <id>` - 변경 제안 영향 분석
- [x] Mermaid 그래프 개선
  - [x] 노드 색상으로 리스크 수준 표시

### 2.3 마이그레이션 도구 ✅

**스펙**: `.sdd/specs/phase-6/01-migration.md`

- [x] `sdd migrate` 명령어 추가
  - [x] `sdd migrate docs` - 문서 마이그레이션
  - [x] `sdd migrate analyze` - 문서 분석
  - [x] `sdd migrate scan` - 디렉토리 스캔
- [x] 마크다운 문서 변환
  - [x] RFC 2119 키워드 감지
  - [x] GIVEN-WHEN-THEN 시나리오 감지
  - [x] spec.md 형식으로 변환
- [x] 마이그레이션 보고서 생성
  - [x] 적합도 분류 (준비됨/일부/미준비)
  - [x] 권장사항 제공

### 2.4 CI/CD 통합 ✅

**스펙**: `.sdd/specs/phase-6/02-cicd.md`

- [x] `sdd cicd` 명령어 추가
  - [x] `sdd cicd setup` - CI/CD 설정 초기화
  - [x] `sdd cicd check` - 설정 상태 확인
  - [x] `sdd cicd hooks` - Git hooks 설정
- [x] GitHub Actions 템플릿 생성
  - [x] `.github/workflows/sdd-validate.yml`
  - [x] PR 시 자동 스펙 검증
- [x] GitLab CI 템플릿 생성
  - [x] `.gitlab-ci-sdd.yml`
- [x] Pre-commit hook 설치
  - [x] `.husky/pre-commit`
  - [x] `.husky/pre-push`
  - [x] 커밋 전 `sdd validate` 실행

---

## 🟢 Priority 3: 고급 기능 (Low)

### 3.1 워크플로우 라우팅 ✅

**스펙**: `.sdd/specs/phase-4/02-routing.md`, `04-transition.md`

- [x] 컨텍스트 기반 자동 라우팅
  - [x] `sdd start`에서 현재 상태 기반 추천
  - [x] 워크플로우 가이드 제공
- [x] 워크플로우 간 전환
  - [x] `sdd transition new-to-change <spec-id>` - new → change 전환
  - [x] `sdd transition change-to-new <change-id>` - change → new 전환
  - [x] `sdd transition guide` - 전환 가이드
  - [x] `/sdd.transition` 슬래시 커맨드

### 3.2 프롬프트 분석 (Phase 5) ✅

**스펙**: `.sdd/specs/phase-5/`

- [x] 규모 판단 로직 문서화
  - [x] 프롬프트 키워드 분석 가이드
  - [x] 작업 규모 자동 판단 (소/중/대)
- [x] 워크플로우 자동 선택
  - [x] 규모에 따른 워크플로우 추천
- [x] `/sdd.analyze` 슬래시 커맨드

### 3.3 추가 산출물 ✅

**스펙**: `.sdd/specs/phase-3/06-outputs.md`

- [x] `/sdd.research` 슬래시 커맨드
  - [x] 기술 리서치 문서 템플릿
- [x] `/sdd.data-model` 슬래시 커맨드
  - [x] 데이터 모델 문서 템플릿
  - [x] ERD Mermaid 템플릿

### 3.4 Prepare 명령 ✅

**스펙**: `.sdd/specs/phase-3/04-prepare.md`

- [x] `/sdd.prepare` 슬래시 커맨드
  - [x] 필요 의존성 분석 가이드
  - [x] MCP 서버 목록 가이드
  - [x] AGENTS.md 업데이트 가이드

### 3.5 대화형 인터페이스 ✅

**스펙**: `.sdd/specs/phase-6/03-conversational-interface.md`

- [x] AI 통합 인터페이스
  - [x] `/sdd.chat` 슬래시 커맨드 (대화형 모드)
  - [x] `/sdd.guide` 슬래시 커맨드 (워크플로우 가이드)
  - [x] 질문/작성/검토/실행 모드 지원

---

## 🔧 기타 개선 사항

### 검증 강화 ✅

- [x] `sdd validate` 참조 링크 유효성 검사
  - [x] `--check-links` 옵션 추가
  - [x] 깨진 내부 링크 탐지
  - [x] 존재하지 않는 스펙 참조 경고
  - [x] dependencies 필드 검증

### 브랜치 관리 ✅

- [x] 기능 번호 자동 증가
  - [x] `.sdd/counter.json` 메커니즘
  - [x] `sdd new <name> --numbered` 옵션
  - [x] `feature/001-name` 형식 자동 생성
  - [x] `sdd new counter` 서브커맨드 (조회/설정)

### 슬래시 커맨드 정리

- [x] 스펙 명명 규칙 반영 완료
  - [x] `/sdd.new` (dot) 형식으로 통일
  - [x] 모든 커맨드에 일관성 유지

---

## 구현 로드맵 제안

### v0.3.0 - Constitution & Change
- Constitution 시스템 (1.1)
- 변경 워크플로우 완성 (1.2)

### v0.4.0 - UX Enhancement
- 통합 진입점 (2.1)
- 영향도 분석 강화 (2.2)

### v0.5.0 - Enterprise
- 마이그레이션 도구 (2.3)
- CI/CD 통합 (2.4)

### v1.0.0 - Full Feature
- 프롬프트 분석 (3.2)
- 추가 산출물 (3.3)
- 대화형 인터페이스 (3.5)

---

## 진행 상황 추적

| 버전 | 태스크 | 상태 |
|------|--------|------|
| v0.3.0 | Constitution 시스템 | ✅ 완료 |
| v0.3.0 | 변경 워크플로우 | ✅ 완료 |
| v0.3.0 | 통합 진입점 | ✅ 완료 |
| v0.3.0 | 영향도 분석 | ✅ 완료 |
| v0.3.0 | 마이그레이션 | ✅ 완료 |
| v0.3.0 | CI/CD | ✅ 완료 |
| v0.3.0 | 고급 기능 (슬래시 커맨드) | ✅ 완료 |
| v0.3.0 | 워크플로우 전환 (transition) | ✅ 완료 |
| v0.3.0 | 검증 강화 (참조 링크) | ✅ 완료 |
| v0.3.0 | 브랜치 관리 (번호 자동 증가) | ✅ 완료 |
| v0.3.0 | 대화형 인터페이스 | ✅ 완료 |

---

## v0.4.0 고급 분석 기능

> ROADMAP-v0.4.0.md 기반

### 4.1 Constitution 위반 검증 ✅

**스펙**: `ROADMAP-v0.4.0.md` - 기능 1

- [x] Constitution 원칙 파싱
  - [x] `## 원칙` / `## Principles` 섹션 추출
  - [x] 키워드 추출 로직
  - [x] SHALL NOT / MUST NOT 패턴 인식
- [x] 위반 검사 로직
  - [x] 키워드 매칭 기반 위반 감지
  - [x] 위반 심각도 분류 (critical/warning/info)
  - [x] 버전 불일치 검사
- [x] CLI 통합
  - [x] `sdd validate --constitution` 옵션 추가
  - [x] `sdd validate --no-constitution` 스킵 옵션
- [x] 테스트 작성
  - [x] violation-checker 단위 테스트 (11개)
  - [x] 통합 테스트

### 4.2 What-if 시뮬레이션 ✅

**스펙**: `ROADMAP-v0.4.0.md` - 기능 2

- [x] 델타 파싱
  - [x] ADDED 섹션 파싱
  - [x] MODIFIED 섹션 (Before/After) 파싱
  - [x] REMOVED 섹션 파싱
- [x] 가상 의존성 그래프
  - [x] 현재 상태 그래프 복제
  - [x] 델타 적용 가상 그래프 생성
  - [x] 영향도 재계산
- [x] 비교 로직
  - [x] 리스크 점수 변화 계산
  - [x] 새로 영향받는 스펙 탐지
  - [x] 비교 결과 출력 형식
- [x] CLI 통합
  - [x] `sdd impact simulate <feature> <proposal>` 서브커맨드
- [x] 테스트 작성
  - [x] simulator 단위 테스트 (9개)

### 4.3 코드 영향도 분석 ✅

**스펙**: `ROADMAP-v0.4.0.md` - 기능 3

- [x] 스펙-코드 연결
  - [x] 파일명/디렉토리명 매칭
  - [x] 주석에서 스펙 ID 참조 탐지 (`// spec: feature-id`)
  - [x] 매핑 설정 파일 지원 (`.sdd/code-mapping.json`)
- [x] 코드 분석
  - [x] TypeScript/JavaScript 파일 파싱
  - [x] import/export 관계 추적
  - [x] 간접 영향 파일 탐지
- [x] 출력 형식
  - [x] 영향받는 파일 목록
  - [x] 파일별 영향도 수준 (high/medium/low)
  - [x] 리스크 점수 및 권장사항
- [x] CLI 통합
  - [x] `sdd impact <feature> --code` 옵션
- [x] 테스트 작성
  - [x] code-analyzer 단위 테스트 (11개)

---

## v0.4.0 진행 상황 추적

| Phase | 태스크 | 상태 |
|-------|--------|------|
| 4.1 | Constitution 원칙 파싱 | ✅ 완료 |
| 4.1 | 위반 검사 로직 | ✅ 완료 |
| 4.1 | CLI 통합 (--constitution) | ✅ 완료 |
| 4.1 | 테스트 | ✅ 완료 |
| 4.2 | 델타 파싱 | ✅ 완료 |
| 4.2 | 가상 의존성 그래프 | ✅ 완료 |
| 4.2 | 비교 로직 | ✅ 완료 |
| 4.2 | CLI 통합 (simulate) | ✅ 완료 |
| 4.2 | 테스트 | ✅ 완료 |
| 4.3 | 스펙-코드 연결 | ✅ 완료 |
| 4.3 | 코드 분석 | ✅ 완료 |
| 4.3 | CLI 통합 (--code) | ✅ 완료 |
| 4.3 | 테스트 | ✅ 완료 |

---

## v0.5.0 개발자 경험 향상

> ROADMAP-v0.5.0.md 기반

### 5.1 Watch 모드

**스펙**: `ROADMAP-v0.5.0.md` - 기능 1

- [ ] 파일 감시
  - [ ] chokidar 의존성 추가
  - [ ] `.sdd/specs/` 디렉토리 감시
  - [ ] 파일 생성/수정/삭제 이벤트 감지
  - [ ] 디바운싱 구현
- [ ] 자동 검증
  - [ ] 변경 시 validate 자동 실행
  - [ ] 결과 실시간 표시
  - [ ] 에러/경고 카운트 요약
- [ ] CLI 통합
  - [ ] `sdd watch` 명령어 추가
  - [ ] `--validate`, `--impact`, `--quiet` 옵션
- [ ] 테스트 작성

### 5.2 스펙 품질 분석

**스펙**: `ROADMAP-v0.5.0.md` - 기능 2

- [ ] 품질 점수 산출
  - [ ] 8개 평가 항목 구현
  - [ ] 0-100 점수 산출
  - [ ] 가중치 적용
- [ ] 개선 제안
  - [ ] 낮은 점수 항목 분석
  - [ ] 구체적 개선 제안 생성
  - [ ] 우선순위 표시
- [ ] CLI 통합
  - [ ] `sdd quality [feature]` 명령어
  - [ ] `sdd quality --all` 전체 분석
- [ ] 테스트 작성

### 5.3 리포트 내보내기

**스펙**: `ROADMAP-v0.5.0.md` - 기능 3

- [ ] 리포트 생성
  - [ ] HTML 형식 지원
  - [ ] Markdown 형식 지원
  - [ ] JSON 형식 지원
- [ ] 리포트 내용
  - [ ] 프로젝트 요약
  - [ ] 의존성 그래프 (Mermaid)
  - [ ] 품질 점수 요약
  - [ ] 검증 결과 요약
- [ ] CLI 통합
  - [ ] `sdd report` 명령어
  - [ ] `--format`, `--output`, `--open` 옵션
- [ ] 테스트 작성

### 5.4 외부 도구 마이그레이션 강화

**스펙**: `ROADMAP-v0.5.0.md` - 기능 4

- [ ] 프로젝트 자동 감지
  - [ ] OpenSpec 프로젝트 감지
  - [ ] Spec Kit 프로젝트 감지
- [ ] 자동 변환
  - [ ] OpenSpec → SDD 변환
  - [ ] Spec Kit → SDD 변환
  - [ ] Constitution 마이그레이션
- [ ] CLI 통합
  - [ ] `sdd migrate detect` 명령어
  - [ ] `sdd migrate openspec` 명령어
  - [ ] `sdd migrate speckit` 명령어
- [ ] 테스트 작성

---

## v0.5.0 진행 상황 추적

| Phase | 태스크 | 상태 |
|-------|--------|------|
| 5.1 | 파일 감시 | ⬜ 대기 |
| 5.1 | 자동 검증 | ⬜ 대기 |
| 5.1 | CLI 통합 (watch) | ⬜ 대기 |
| 5.1 | 테스트 | ⬜ 대기 |
| 5.2 | 품질 점수 산출 | ⬜ 대기 |
| 5.2 | 개선 제안 | ⬜ 대기 |
| 5.2 | CLI 통합 (quality) | ⬜ 대기 |
| 5.2 | 테스트 | ⬜ 대기 |
| 5.3 | 리포트 생성 | ⬜ 대기 |
| 5.3 | 리포트 내용 | ⬜ 대기 |
| 5.3 | CLI 통합 (report) | ⬜ 대기 |
| 5.3 | 테스트 | ⬜ 대기 |
| 5.4 | 프로젝트 감지 | ⬜ 대기 |
| 5.4 | 자동 변환 | ⬜ 대기 |
| 5.4 | CLI 통합 (migrate) | ⬜ 대기 |
| 5.4 | 테스트 | ⬜ 대기 |

---

*생성일: 2025-12-21*
*최종 업데이트: 2025-12-22*
*기준 문서: GAP-ANALYSIS.md, ROADMAP-v0.4.0.md, ROADMAP-v0.5.0.md*
