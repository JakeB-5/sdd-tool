# SDD Tool v0.4.0 로드맵

> 고급 분석 기능 - Constitution 검증, What-if 시뮬레이션, 코드 영향도 분석

---

## 개요

v0.4.0은 **분석 기능 강화**에 초점을 맞춥니다:

1. **Constitution 위반 검증** - 스펙이 프로젝트 원칙을 준수하는지 검사
2. **What-if 시뮬레이션** - 변경 전 영향도 예측
3. **코드 영향도 분석** - 스펙 변경이 실제 코드에 미치는 영향

---

## 기능 1: Constitution 위반 검증

### 목표

`sdd validate` 실행 시 스펙 내용이 Constitution에 정의된 원칙을 위반하는지 자동 검사

### 요구사항

#### REQ-CV-01: Constitution 원칙 파싱

- 시스템은 constitution.md에서 원칙(Principles)을 추출해야 한다(SHALL)
- 원칙은 `## 원칙` 또는 `## Principles` 섹션에서 파싱해야 한다(SHALL)
- 각 원칙의 키워드를 추출해야 한다(SHOULD)

#### REQ-CV-02: 위반 검사 로직

- 스펙 내용이 `SHALL NOT`, `MUST NOT` 원칙을 위반하는지 검사해야 한다(SHALL)
- 키워드 매칭 기반 위반 감지를 지원해야 한다(SHALL)
- 위반 심각도를 분류해야 한다(SHOULD): critical, warning, info

#### REQ-CV-03: CLI 옵션

- `sdd validate --constitution` 옵션을 추가해야 한다(SHALL)
- 기본 동작에서 Constitution 검증을 포함해야 한다(SHOULD)
- `--no-constitution` 옵션으로 검증 스킵을 허용해야 한다(MAY)

### 시나리오

#### Scenario CV-1: Constitution 위반 감지

- **GIVEN** Constitution에 "평문 비밀번호를 저장해서는 안 된다(SHALL NOT)" 원칙이 있을 때
- **WHEN** 스펙에 "비밀번호를 평문으로 저장한다"라는 내용이 있으면
- **THEN** 위반 경고를 출력한다

#### Scenario CV-2: Constitution 버전 불일치

- **GIVEN** 스펙의 constitution_version이 1.0.0일 때
- **WHEN** 현재 Constitution 버전이 2.0.0이면
- **THEN** 버전 불일치 경고를 출력한다

### 구현 계획

```
src/core/constitution/
├── validator.ts          # Constitution 위반 검증 로직
├── principle-parser.ts   # 원칙 추출 파서
└── matcher.ts            # 키워드 매칭 로직

src/cli/commands/
└── validate.ts           # --constitution 옵션 추가
```

### 예상 작업량

- 파서 구현: 2시간
- 검증 로직: 3시간
- CLI 통합: 1시간
- 테스트: 2시간
- **총: 8시간**

---

## 기능 2: What-if 시뮬레이션

### 목표

`sdd impact --simulate` 옵션으로 변경 적용 전 영향도를 예측

### 요구사항

#### REQ-WI-01: 시뮬레이션 모드

- `sdd impact <feature> --simulate <change>` 명령을 지원해야 한다(SHALL)
- 실제 파일을 수정하지 않고 영향도만 계산해야 한다(SHALL)
- 시뮬레이션 결과를 명확히 구분해서 출력해야 한다(SHOULD)

#### REQ-WI-02: 변경 시나리오 정의

- 변경 제안 파일(.md)을 입력으로 받아야 한다(SHALL)
- ADDED/MODIFIED/REMOVED 델타를 파싱해야 한다(SHALL)
- 가상의 의존성 그래프를 생성해야 한다(SHOULD)

#### REQ-WI-03: 영향도 비교

- 현재 상태와 변경 후 상태의 영향도를 비교해야 한다(SHALL)
- 리스크 점수 변화를 표시해야 한다(SHOULD)
- 새로 영향받는 스펙 목록을 출력해야 한다(SHALL)

### 시나리오

#### Scenario WI-1: 신규 의존성 영향

- **GIVEN** feature-A가 아무 의존성이 없을 때
- **WHEN** feature-A가 feature-B에 의존하도록 변경하는 시뮬레이션을 실행하면
- **THEN** feature-B 변경 시 feature-A도 영향받음을 표시한다

#### Scenario WI-2: 리스크 증가 경고

- **GIVEN** feature-A의 리스크 점수가 3일 때
- **WHEN** 변경으로 인해 리스크 점수가 7로 증가하면
- **THEN** 리스크 증가 경고를 출력한다

### 구현 계획

```
src/core/impact/
├── simulator.ts          # 시뮬레이션 엔진
├── delta-parser.ts       # 델타 변경 파싱
├── virtual-graph.ts      # 가상 의존성 그래프
└── comparator.ts         # 영향도 비교 로직

src/cli/commands/
└── impact.ts             # --simulate 옵션 추가
```

### 예상 작업량

- 시뮬레이터 구현: 4시간
- 델타 파서: 2시간
- 비교 로직: 2시간
- CLI 통합: 1시간
- 테스트: 2시간
- **총: 11시간**

---

## 기능 3: 코드 영향도 분석

### 목표

스펙 변경이 실제 소스 코드 파일에 미치는 영향을 분석

### 요구사항

#### REQ-CA-01: 코드-스펙 매핑

- 스펙과 관련된 소스 코드 파일을 탐지해야 한다(SHALL)
- 파일명, 디렉토리명, 주석에서 스펙 ID 참조를 찾아야 한다(SHALL)
- 매핑 설정 파일(.sdd/code-mapping.json)을 지원해야 한다(MAY)

#### REQ-CA-02: 코드 분석

- TypeScript/JavaScript 파일을 분석해야 한다(SHALL)
- 함수, 클래스, 모듈 단위로 영향 범위를 표시해야 한다(SHOULD)
- import/export 관계를 추적해야 한다(SHOULD)

#### REQ-CA-03: 출력 형식

- `sdd impact <feature> --code` 옵션을 추가해야 한다(SHALL)
- 영향받는 파일 목록을 출력해야 한다(SHALL)
- 파일별 영향도 수준(high/medium/low)을 표시해야 한다(SHOULD)

### 시나리오

#### Scenario CA-1: 직접 참조 탐지

- **GIVEN** src/core/auth.ts 파일에 `// spec: user-auth` 주석이 있을 때
- **WHEN** user-auth 스펙의 영향도를 코드와 함께 분석하면
- **THEN** auth.ts가 영향받는 파일로 표시된다

#### Scenario CA-2: 모듈 의존성 추적

- **GIVEN** auth.ts가 user-auth 스펙과 연결되어 있을 때
- **WHEN** login.ts가 auth.ts를 import하면
- **THEN** login.ts도 간접 영향 파일로 표시된다

### 구현 계획

```
src/core/impact/
├── code-analyzer.ts      # 코드 분석 엔진
├── spec-linker.ts        # 스펙-코드 연결
├── import-tracker.ts     # import 관계 추적
└── code-mapper.ts        # 매핑 설정 관리

src/cli/commands/
└── impact.ts             # --code 옵션 추가
```

### 예상 작업량

- 코드 분석기: 5시간
- 스펙 링커: 3시간
- Import 추적: 4시간
- CLI 통합: 1시간
- 테스트: 3시간
- **총: 16시간**

---

## 구현 순서

### Phase 1: Constitution 위반 검증 (우선순위 높음)

1. principle-parser.ts 구현
2. validator.ts 구현
3. validate.ts CLI 옵션 추가
4. 단위 테스트 작성
5. 통합 테스트 작성

### Phase 2: What-if 시뮬레이션 (우선순위 중간)

1. delta-parser.ts 구현
2. virtual-graph.ts 구현
3. simulator.ts 구현
4. comparator.ts 구현
5. impact.ts CLI 옵션 추가
6. 테스트 작성

### Phase 3: 코드 영향도 분석 (우선순위 낮음)

1. spec-linker.ts 구현
2. code-analyzer.ts 구현
3. import-tracker.ts 구현
4. impact.ts CLI 옵션 추가
5. 테스트 작성

---

## 예상 일정

| Phase | 기능 | 예상 시간 | 완료 기준 |
|-------|------|-----------|-----------|
| 1 | Constitution 위반 검증 | 8시간 | `sdd validate --constitution` 동작 |
| 2 | What-if 시뮬레이션 | 11시간 | `sdd impact --simulate` 동작 |
| 3 | 코드 영향도 분석 | 16시간 | `sdd impact --code` 동작 |
| - | **총계** | **35시간** | - |

---

## 성공 기준

### Constitution 위반 검증 ✅

- [x] Constitution 원칙 파싱 성공
- [x] SHALL NOT 위반 감지
- [x] 버전 불일치 경고
- [x] CLI 옵션 동작
- [x] 테스트 커버리지 80% 이상

### What-if 시뮬레이션 ✅

- [x] 델타 파싱 성공
- [x] 가상 그래프 생성
- [x] 영향도 비교 출력
- [x] 리스크 변화 표시
- [x] 테스트 커버리지 80% 이상

### 코드 영향도 분석 ✅

- [x] 스펙-코드 연결 탐지
- [x] import 관계 추적
- [x] 영향 파일 목록 출력
- [x] 테스트 커버리지 80% 이상

---

## 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Constitution 원칙 형식이 다양함 | 파싱 실패 | 정규식 패턴 확장, 폴백 로직 |
| 코드 분석 복잡도 높음 | 구현 지연 | TypeScript Compiler API 활용 |
| 대규모 프로젝트 성능 이슈 | 분석 시간 증가 | 캐싱, 증분 분석 |

---

## 버전 변경 사항 예상

```
v0.4.0
- feat(validate): Constitution 위반 검증 추가
- feat(impact): What-if 시뮬레이션 (--simulate) 추가
- feat(impact): 코드 영향도 분석 (--code) 추가
- test: 새 기능 테스트 추가
```

---

*작성일: 2025-12-22*
*기준: GAP-ANALYSIS.md v0.3.0*
