# SDD Tool 구현 태스크 체크리스트

> GAP-ANALYSIS.md 기반 작업 목록

---

## 🔴 Priority 1: 핵심 기능 (High)

### 1.1 Constitution 시스템 구현

**스펙**: `.sdd/specs/phase-1/02-constitution.md`

- [ ] `sdd constitution` CLI 명령어 추가
  - [ ] `sdd constitution init` - 대화형 초기 생성
  - [ ] `sdd constitution update` - 기존 Constitution 수정
  - [ ] `sdd constitution show` - 현재 Constitution 표시
  - [ ] `sdd constitution history` - 버전 이력 조회
- [ ] Constitution 시맨틱 버전 관리
  - [ ] MAJOR: 핵심 원칙 변경 시
  - [ ] MINOR: 새 원칙 추가 시
  - [ ] PATCH: 문구 수정 시
  - [ ] frontmatter에 버전 필드 추가
- [ ] CHANGELOG.md 자동 생성/업데이트
  - [ ] 버전 변경 시 자동 기록
  - [ ] 변경 사유 기록
- [ ] `/sdd.constitution` 슬래시 커맨드 생성
  - [ ] `.claude/commands/sdd.constitution.md` 파일 생성
  - [ ] init 명령에 자동 포함
- [ ] 스펙 생성 시 Constitution 버전 참조
  - [ ] spec.md frontmatter에 `constitution_version` 필드 추가
- [ ] `sdd validate` 시 Constitution 위반 검증
  - [ ] 금지 사항(SHALL NOT) 체크
  - [ ] 필수 사항(SHALL) 체크

### 1.2 변경 워크플로우 완성

**스펙**: `.sdd/specs/phase-2/01-change-workflow.md`

- [ ] `/sdd.change` 슬래시 커맨드 강화
  - [ ] 대상 스펙 자동 탐색 로직
  - [ ] 자연어 변경 요청 처리 가이드
- [ ] 델타 자동 생성 지원
  - [ ] ADDED 섹션 자동 생성
  - [ ] MODIFIED 섹션 (Before/After) 자동 생성
  - [ ] REMOVED 섹션 자동 생성
- [ ] `sdd change` CLI 강화
  - [ ] `sdd change create` - 변경 제안 생성
  - [ ] `sdd change list` - 제안 목록 조회
  - [ ] `sdd change show <id>` - 상세 조회
  - [ ] `sdd change diff <id>` - diff 미리보기
- [ ] `sdd change apply <id>` 완성
  - [ ] 델타를 실제 스펙에 적용
  - [ ] 적용 전 확인 프롬프트
  - [ ] 롤백 지원
- [ ] `sdd change archive <id>` 완성
  - [ ] 완료된 변경을 archive/로 이동
  - [ ] 아카이브 메타데이터 기록

---

## 🟡 Priority 2: 사용성 개선 (Medium)

### 2.1 통합 진입점 구현

**스펙**: `.sdd/specs/phase-4/01-start.md`

- [ ] `sdd start` 명령어 추가
  - [ ] 대화형 워크플로우 선택 메뉴
  - [ ] 현재 프로젝트 상태 기반 추천
- [ ] 워크플로우 옵션
  - [ ] 새 기능 개발 → `sdd new` 연결
  - [ ] 기존 기능 변경 → `sdd change` 연결
  - [ ] 프로젝트 상태 확인 → `sdd status` 연결
- [ ] `/sdd.start` 슬래시 커맨드 생성

### 2.2 영향도 분석 강화

**스펙**: `.sdd/specs/phase-2/02-impact-analysis.md`

- [ ] `sdd impact` 명령어 강화
  - [ ] 내용 기반 의존성 추론 (암시적 참조 감지)
  - [ ] 리스크 점수 산출 로직
  - [ ] `--simulate` 옵션 (What-if 분석)
- [ ] 코드 영향도 분석
  - [ ] 스펙과 연결된 코드 파일 탐지
  - [ ] 변경 시 영향받는 코드 목록 출력
- [ ] Mermaid 그래프 개선
  - [ ] 노드 색상으로 리스크 수준 표시
  - [ ] 변경 전파 경로 하이라이트

### 2.3 마이그레이션 도구

**스펙**: `.sdd/specs/phase-6/01-migration.md`

- [ ] `sdd migrate` 명령어 추가
  - [ ] `sdd migrate detect` - 프로젝트 유형 감지
  - [ ] `sdd migrate run` - 마이그레이션 실행
  - [ ] `sdd migrate report` - 결과 보고서
- [ ] OpenSpec 프로젝트 변환
  - [ ] `openspec/` → `.sdd/` 구조 변환
  - [ ] proposal → change 형식 변환
- [ ] Spec Kit 프로젝트 변환
  - [ ] `.specify/` → `.sdd/` 구조 변환
  - [ ] 슬래시 커맨드 변환
- [ ] 마이그레이션 보고서 생성
  - [ ] 변환된 파일 목록
  - [ ] 수동 확인 필요 항목
  - [ ] 변환 실패 항목

### 2.4 CI/CD 통합

**스펙**: `.sdd/specs/phase-6/02-cicd.md`

- [ ] `sdd cicd` 명령어 추가
  - [ ] `sdd cicd setup` - CI/CD 설정 초기화
  - [ ] `sdd cicd check` - 설정 상태 확인
- [ ] GitHub Actions 템플릿 생성
  - [ ] `.github/workflows/sdd-validate.yml`
  - [ ] PR 시 자동 스펙 검증
  - [ ] 스펙 변경 시 라벨 자동 추가
- [ ] Pre-commit hook 설치
  - [ ] `.husky/pre-commit` 또는 `.git/hooks/pre-commit`
  - [ ] 커밋 전 `sdd validate` 실행
- [ ] `sdd validate --ci` 플래그
  - [ ] CI 환경 최적화 출력
  - [ ] 머신 리더블 포맷 (JSON/XML)

---

## 🟢 Priority 3: 고급 기능 (Low)

### 3.1 워크플로우 라우팅

**스펙**: `.sdd/specs/phase-4/02-routing.md`, `04-transition.md`

- [ ] 컨텍스트 기반 자동 라우팅
  - [ ] 현재 브랜치 분석
  - [ ] 최근 변경 파일 분석
  - [ ] 워크플로우 자동 추천
- [ ] 워크플로우 간 전환
  - [ ] new → change 전환
  - [ ] change → new 전환
  - [ ] 진행 상황 유지

### 3.2 프롬프트 분석 (Phase 5)

**스펙**: `.sdd/specs/phase-5/`

- [ ] 규모 판단 로직
  - [ ] 프롬프트 키워드 분석
  - [ ] 작업 규모 자동 판단 (소/중/대)
- [ ] 워크플로우 자동 선택
  - [ ] 규모에 따른 워크플로우 추천
  - [ ] 사용자 확인 후 진행
- [ ] 키워드 스코어링
  - [ ] 변경/신규/수정 등 키워드 감지
  - [ ] 스코어 기반 워크플로우 결정
- [ ] `/sdd.analyze` 슬래시 커맨드

### 3.3 추가 산출물

**스펙**: `.sdd/specs/phase-3/06-outputs.md`

- [ ] `/sdd.research` 슬래시 커맨드
  - [ ] 기술 리서치 문서 템플릿
- [ ] `/sdd.data-model` 슬래시 커맨드
  - [ ] 데이터 모델 문서 템플릿
- [ ] 추가 산출물 자동 생성
  - [ ] API 명세 (OpenAPI)
  - [ ] ERD 다이어그램

### 3.4 Prepare 명령

**스펙**: `.sdd/specs/phase-3/04-prepare.md`

- [ ] `/sdd.prepare` 슬래시 커맨드
  - [ ] 필요 에이전트/스킬 분석
  - [ ] AGENTS.md 동적 섹션 추가
  - [ ] 필요 MCP 서버 목록 생성

### 3.5 대화형 인터페이스

**스펙**: `.sdd/specs/phase-6/03-conversational-interface.md`

- [ ] AI 통합 인터페이스
  - [ ] 자연어 명령 처리
  - [ ] 컨텍스트 유지 대화

---

## 🔧 기타 개선 사항

### 검증 강화

- [ ] `sdd validate` 참조 링크 유효성 검사
  - [ ] 깨진 내부 링크 탐지
  - [ ] 존재하지 않는 스펙 참조 경고

### 브랜치 관리

- [ ] 기능 번호 자동 증가
  - [ ] `.sdd/counter.json` 또는 유사 메커니즘
  - [ ] `feature/001-name` 형식 자동 생성

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
| v0.3.0 | Constitution 시스템 | ⬜ 대기 |
| v0.3.0 | 변경 워크플로우 | ⬜ 대기 |
| v0.4.0 | 통합 진입점 | ⬜ 대기 |
| v0.4.0 | 영향도 분석 | ⬜ 대기 |
| v0.5.0 | 마이그레이션 | ⬜ 대기 |
| v0.5.0 | CI/CD | ⬜ 대기 |

---

*생성일: 2025-12-21*
*기준 문서: GAP-ANALYSIS.md*
