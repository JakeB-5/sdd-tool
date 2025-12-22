# SDD Tool v0.5.0 로드맵

> 개발자 경험 향상 - Watch 모드, 품질 분석, 리포트 생성, 외부 도구 통합

---

## 개요

v0.5.0은 **개발자 경험(DX) 향상**에 초점을 맞춥니다:

1. **Watch 모드** - 실시간 파일 감시 및 자동 검증
2. **스펙 품질 분석** - 품질 점수 산출 및 개선 제안
3. **리포트 내보내기** - HTML/Markdown 리포트 생성
4. **외부 도구 마이그레이션 강화** - OpenSpec/Spec Kit 자동 감지

---

## 기능 1: Watch 모드

### 목표

`sdd watch` 명령으로 파일 변경을 실시간 감시하고 자동으로 검증 실행

### 요구사항

#### REQ-WM-01: 파일 감시

- 시스템은 `.sdd/specs/` 디렉토리의 변경을 감시해야 한다(SHALL)
- 파일 생성/수정/삭제 이벤트를 감지해야 한다(SHALL)
- 디바운싱으로 과도한 실행을 방지해야 한다(SHOULD)

#### REQ-WM-02: 자동 검증

- 파일 변경 시 `sdd validate`를 자동 실행해야 한다(SHALL)
- 검증 결과를 실시간으로 표시해야 한다(SHALL)
- 에러/경고 카운트를 요약해야 한다(SHOULD)

#### REQ-WM-03: 옵션

- `--validate` 옵션으로 검증 포함 (기본값)
- `--impact` 옵션으로 영향도 분석 포함
- `--quiet` 옵션으로 성공 시 출력 생략
- `--debounce <ms>` 옵션으로 디바운스 시간 설정

### 시나리오

#### Scenario WM-1: 파일 수정 감지

- **GIVEN** watch 모드가 실행 중일 때
- **WHEN** specs/auth/spec.md 파일을 수정하면
- **THEN** 자동으로 validate를 실행하고 결과를 표시한다

#### Scenario WM-2: 연속 수정 디바운싱

- **GIVEN** watch 모드가 500ms 디바운스로 실행 중일 때
- **WHEN** 100ms 간격으로 3번 파일을 수정하면
- **THEN** 마지막 수정 후 500ms 뒤에 1번만 검증을 실행한다

### 구현 계획

```
src/cli/commands/
└── watch.ts              # watch 명령어

src/core/watch/
├── watcher.ts            # 파일 감시 로직 (chokidar)
├── debouncer.ts          # 디바운스 유틸리티
└── runner.ts             # 검증 실행기

tests/unit/core/watch/
└── watcher.test.ts       # 테스트
```

### 의존성

- `chokidar`: 크로스 플랫폼 파일 감시

---

## 기능 2: 스펙 품질 분석

### 목표

`sdd quality` 명령으로 스펙 품질 점수를 산출하고 개선 제안 제공

### 요구사항

#### REQ-QA-01: 품질 점수 산출

- 시스템은 각 스펙 파일의 품질 점수(0-100)를 산출해야 한다(SHALL)
- 전체 프로젝트의 평균 품질 점수를 계산해야 한다(SHALL)
- 점수 산출 기준을 명확히 해야 한다(SHOULD)

#### REQ-QA-02: 점수 산출 기준

- RFC 2119 키워드 사용 빈도 (10점)
- GIVEN-WHEN-THEN 시나리오 완성도 (20점)
- 요구사항 명확성 (ID, 설명 포함) (15점)
- 의존성 명시 (10점)
- 문서 구조 (섹션 완성도) (15점)
- Constitution 준수 (10점)
- 참조 링크 유효성 (10점)
- 메타데이터 완성도 (10점)

#### REQ-QA-03: 개선 제안

- 점수가 낮은 항목에 대해 구체적 개선 제안을 제공해야 한다(SHALL)
- 제안은 실행 가능한 형태여야 한다(SHOULD)
- 우선순위를 표시해야 한다(MAY)

### 시나리오

#### Scenario QA-1: 개별 스펙 분석

- **GIVEN** auth/spec.md 파일이 있을 때
- **WHEN** `sdd quality auth`를 실행하면
- **THEN** 품질 점수와 항목별 점수, 개선 제안을 표시한다

#### Scenario QA-2: 전체 프로젝트 분석

- **GIVEN** 여러 스펙 파일이 있을 때
- **WHEN** `sdd quality --all`을 실행하면
- **THEN** 전체 평균 점수와 스펙별 점수 목록을 표시한다

### 구현 계획

```
src/cli/commands/
└── quality.ts            # quality 명령어

src/core/quality/
├── analyzer.ts           # 품질 분석기
├── scorer.ts             # 점수 산출 로직
├── suggester.ts          # 개선 제안 생성
└── schemas.ts            # 타입 정의

tests/unit/core/quality/
└── analyzer.test.ts      # 테스트
```

---

## 기능 3: 리포트 내보내기

### 목표

`sdd report` 명령으로 프로젝트 분석 결과를 HTML/Markdown 파일로 내보내기

### 요구사항

#### REQ-RP-01: 리포트 형식

- HTML 형식을 지원해야 한다(SHALL)
- Markdown 형식을 지원해야 한다(SHALL)
- JSON 형식을 지원해야 한다(SHOULD)

#### REQ-RP-02: 리포트 내용

- 프로젝트 요약 (스펙 수, 변경 수, 건강도)
- 의존성 그래프 (Mermaid)
- 품질 점수 요약
- 검증 결과 요약
- Constitution 준수 현황
- 코드 영향도 요약

#### REQ-RP-03: 출력 옵션

- `--format <html|md|json>` 형식 선택
- `--output <path>` 출력 경로 지정
- `--open` 생성 후 브라우저/편집기 열기
- `--include <sections>` 포함할 섹션 선택

### 시나리오

#### Scenario RP-1: HTML 리포트 생성

- **GIVEN** SDD 프로젝트가 초기화되어 있을 때
- **WHEN** `sdd report --format html --output report.html`을 실행하면
- **THEN** 스타일이 적용된 HTML 리포트 파일을 생성한다

#### Scenario RP-2: Markdown 리포트 생성

- **GIVEN** SDD 프로젝트가 초기화되어 있을 때
- **WHEN** `sdd report --format md`를 실행하면
- **THEN** `.sdd/reports/` 디렉토리에 Markdown 리포트를 생성한다

### 구현 계획

```
src/cli/commands/
└── report.ts             # report 명령어

src/core/report/
├── generator.ts          # 리포트 생성기
├── html-template.ts      # HTML 템플릿
├── md-template.ts        # Markdown 템플릿
└── data-collector.ts     # 데이터 수집기

templates/
├── report.html           # HTML 템플릿 파일
└── report.md             # Markdown 템플릿 파일

tests/unit/core/report/
└── generator.test.ts     # 테스트
```

---

## 기능 4: 외부 도구 마이그레이션 강화

### 목표

`sdd migrate` 명령을 강화하여 OpenSpec/Spec Kit 프로젝트 자동 감지 및 변환

### 요구사항

#### REQ-MG-01: 프로젝트 자동 감지

- OpenSpec 프로젝트를 자동 감지해야 한다(SHALL)
  - `openspec/` 디렉토리 존재
  - `openspec/specs/`, `openspec/changes/` 구조
- Spec Kit 프로젝트를 자동 감지해야 한다(SHALL)
  - `.specify/` 디렉토리 존재
  - `memory/constitution.md` 파일

#### REQ-MG-02: 자동 변환

- OpenSpec 스펙을 SDD 형식으로 변환해야 한다(SHALL)
- Spec Kit 스펙을 SDD 형식으로 변환해야 한다(SHALL)
- Constitution을 마이그레이션해야 한다(SHOULD)
- 변환 로그를 생성해야 한다(SHALL)

#### REQ-MG-03: CLI 옵션

- `sdd migrate detect` - 프로젝트 유형 감지
- `sdd migrate openspec [source]` - OpenSpec에서 변환
- `sdd migrate speckit [source]` - Spec Kit에서 변환
- `--dry-run` 옵션으로 미리보기
- `--preserve` 옵션으로 원본 보존

### 시나리오

#### Scenario MG-1: OpenSpec 자동 감지

- **GIVEN** openspec/ 디렉토리가 있는 프로젝트일 때
- **WHEN** `sdd migrate detect`를 실행하면
- **THEN** "OpenSpec 프로젝트가 감지되었습니다"를 표시한다

#### Scenario MG-2: Spec Kit 변환

- **GIVEN** .specify/ 디렉토리가 있는 프로젝트일 때
- **WHEN** `sdd migrate speckit`을 실행하면
- **THEN** .specify/ 스펙들을 .sdd/ 형식으로 변환한다

### 구현 계획

```
src/cli/commands/
└── migrate.ts            # migrate 명령어 강화

src/core/migrate/
├── detector.ts           # 프로젝트 유형 감지
├── openspec-converter.ts # OpenSpec 변환기
├── speckit-converter.ts  # Spec Kit 변환기
└── constitution-mapper.ts # Constitution 매핑

tests/unit/core/migrate/
├── detector.test.ts
├── openspec-converter.test.ts
└── speckit-converter.test.ts
```

---

## 구현 순서

### Phase 1: Watch 모드 (우선순위 높음)

1. chokidar 의존성 추가
2. watcher.ts 구현
3. debouncer.ts 구현
4. watch.ts CLI 구현
5. 테스트 작성

### Phase 2: 스펙 품질 분석 (우선순위 높음)

1. scorer.ts 구현 (점수 산출 로직)
2. analyzer.ts 구현
3. suggester.ts 구현
4. quality.ts CLI 구현
5. 테스트 작성

### Phase 3: 리포트 내보내기 (우선순위 중간)

1. data-collector.ts 구현
2. HTML/Markdown 템플릿 작성
3. generator.ts 구현
4. report.ts CLI 구현
5. 테스트 작성

### Phase 4: 외부 도구 마이그레이션 (우선순위 중간)

1. detector.ts 구현
2. openspec-converter.ts 구현
3. speckit-converter.ts 구현
4. migrate.ts CLI 강화
5. 테스트 작성

---

## 예상 일정

| Phase | 기능 | 예상 시간 | 완료 기준 |
|-------|------|-----------|-----------|
| 1 | Watch 모드 | 6시간 | `sdd watch` 동작 |
| 2 | 스펙 품질 분석 | 8시간 | `sdd quality` 동작 |
| 3 | 리포트 내보내기 | 10시간 | `sdd report` 동작 |
| 4 | 외부 도구 마이그레이션 | 8시간 | `sdd migrate detect/openspec/speckit` 동작 |
| - | **총계** | **32시간** | - |

---

## 성공 기준

### Watch 모드

- [ ] 파일 변경 감지 성공
- [ ] 디바운싱 동작
- [ ] 자동 검증 실행
- [ ] 결과 실시간 표시
- [ ] 테스트 커버리지 80% 이상

### 스펙 품질 분석

- [ ] 품질 점수 산출 (0-100)
- [ ] 8개 평가 항목 구현
- [ ] 개선 제안 생성
- [ ] 전체/개별 분석 지원
- [ ] 테스트 커버리지 80% 이상

### 리포트 내보내기

- [ ] HTML 리포트 생성
- [ ] Markdown 리포트 생성
- [ ] 의존성 그래프 포함
- [ ] 스타일 적용
- [ ] 테스트 커버리지 80% 이상

### 외부 도구 마이그레이션

- [ ] OpenSpec 자동 감지
- [ ] Spec Kit 자동 감지
- [ ] 스펙 변환 성공
- [ ] Constitution 마이그레이션
- [ ] 테스트 커버리지 80% 이상

---

## 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| chokidar 크로스 플랫폼 이슈 | Watch 기능 불안정 | 플랫폼별 테스트, 폴백 로직 |
| 품질 점수 주관성 | 사용자 혼란 | 점수 기준 문서화, 가중치 설정 옵션 |
| HTML 리포트 스타일링 | 개발 시간 증가 | 간단한 CSS 프레임워크 사용 (Pico CSS) |
| OpenSpec/Spec Kit 형식 변화 | 변환 실패 | 버전별 변환기, 폴백 로직 |

---

## 의존성 추가 예상

```json
{
  "dependencies": {
    "chokidar": "^3.5.3"   // 파일 감시
  }
}
```

---

## CLI 명령어 추가 예상

```
v0.5.0 신규 명령어:
- sdd watch                    # 파일 감시 모드
- sdd quality [feature]        # 품질 분석
- sdd quality --all            # 전체 품질 분석
- sdd report                   # 리포트 생성
- sdd report --format html     # HTML 리포트
- sdd migrate detect           # 프로젝트 유형 감지
- sdd migrate openspec         # OpenSpec 변환
- sdd migrate speckit          # Spec Kit 변환
```

---

## 버전 변경 사항 예상

```
v0.5.0
- feat(watch): 실시간 파일 감시 모드 추가
- feat(quality): 스펙 품질 분석 및 점수 산출
- feat(report): HTML/Markdown 리포트 내보내기
- feat(migrate): OpenSpec/Spec Kit 자동 감지 및 변환
- deps: chokidar 추가
```

---

## 슬래시 커맨드 추가 예상

| 커맨드 | 설명 |
|--------|------|
| `/sdd.watch` | Watch 모드 시작 가이드 |
| `/sdd.quality` | 품질 분석 실행 가이드 |
| `/sdd.report` | 리포트 생성 가이드 |

---

*작성일: 2025-12-22*
*기준: v0.4.0*
