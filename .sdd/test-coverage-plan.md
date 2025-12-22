# 테스트 커버리지 80% 달성 계획

> **작성일**: 2025-12-22
> **현재 커버리지**: 31.37%
> **목표 커버리지**: 80%
> **총 소스 라인**: 15,955줄

---

## 1. 현재 상황 분석

### 1.1 커버리지 현황

| 지표 | 현재 | 목표 | 필요 증가분 |
|------|------|------|------------|
| Statements | 31.37% | 80% | +48.63% |
| Branches | 77.40% | 80% | +2.60% |
| Functions | 66.66% | 80% | +13.34% |
| Lines | 31.37% | 80% | +48.63% |

### 1.2 테스트 현황

- **기존 테스트 파일**: 30개
- **기존 테스트 수**: 308개
- **모두 통과**: ✅

### 1.3 모듈별 커버리지 현황

#### 잘 커버된 모듈 (80%+)
| 모듈 | 커버리지 | 라인 수 |
|------|----------|---------|
| errors/ | 100% | ~150줄 |
| prompts/ | 100% | 621줄 |
| types/ | 100% | ~50줄 |
| core/constitution/ | 97% | ~900줄 |
| core/change/ | 93.65% | ~750줄 |
| core/new/ (generators) | 96%+ | ~700줄 |

#### 테스트 필요 모듈 (0% 또는 낮음)
| 모듈 | 커버리지 | 라인 수 | 우선순위 |
|------|----------|---------|----------|
| cli/commands/ (16개) | 0% | ~5,000줄 | 🔴 높음 |
| generators/claude-commands.ts | 0% | 904줄 | 🟡 중간 |
| core/migrate/detector.ts | 0% | 524줄 | 🟡 중간 |
| core/quality/analyzer.ts | 0% | 624줄 | 🟡 중간 |
| core/report/reporter.ts | 0% | 508줄 | 🟡 중간 |
| core/watch/watcher.ts | 0% | 168줄 | 🟢 낮음 |
| core/impact/analyzer.ts | 0% | 643줄 | 🟡 중간 |
| core/new/branch.ts | 0% | 236줄 | 🟡 중간 |
| core/new/counter.ts | 0% | 229줄 | 🟡 중간 |
| utils/fs.ts | 49% | ~170줄 | 🟢 낮음 |
| utils/logger.ts | 33% | ~100줄 | 🟢 낮음 |

---

## 2. 달성 전략

### 2.1 핵심 원칙

1. **Integration 테스트 우선**: CLI 명령어는 integration 테스트로 효율적 커버
2. **핵심 로직 Unit 테스트**: 비즈니스 로직은 unit 테스트로 상세 검증
3. **Mocking 최소화**: 실제 파일 시스템 사용 (tmpdir)
4. **점진적 확대**: Phase별로 목표 달성

### 2.2 테스트 유형별 전략

| 유형 | 대상 | 효과 |
|------|------|------|
| **Integration** | CLI 명령어 16개 | 높은 커버리지 효율 |
| **Unit** | core 비즈니스 로직 | 정밀한 검증 |
| **Snapshot** | 템플릿 생성 결과 | 회귀 방지 |

---

## 3. 단계별 실행 계획

### Phase 1: CLI Integration 테스트 확대 (목표: 50%)

**기간**: 우선 실행
**예상 커버리지**: 31% → 50%
**테스트 수 증가**: +80개

#### 대상 파일 (라인 수 순)

| 명령어 | 파일 | 라인 수 | 테스트 파일 |
|--------|------|---------|------------|
| migrate | cli/commands/migrate.ts | 756줄 | tests/integration/migrate.test.ts |
| transition | cli/commands/transition.ts | 480줄 | tests/integration/transition.test.ts |
| new | cli/commands/new.ts | 438줄 | ✅ 기존 확장 |
| start | cli/commands/start.ts | 434줄 | ✅ 기존 확장 |
| change | cli/commands/change.ts | 424줄 | tests/integration/change.test.ts |
| cicd | cli/commands/cicd.ts | 401줄 | tests/integration/cicd.test.ts |
| constitution | cli/commands/constitution.ts | 397줄 | ✅ 기존 확장 |
| init | cli/commands/init.ts | 361줄 | ✅ 기존 확장 |
| impact | cli/commands/impact.ts | 333줄 | tests/integration/impact.test.ts |
| list | cli/commands/list.ts | 301줄 | tests/integration/list.test.ts |
| status | cli/commands/status.ts | 296줄 | ✅ 기존 확장 |
| validate | cli/commands/validate.ts | ~200줄 | tests/integration/validate.test.ts |
| quality | cli/commands/quality.ts | ~200줄 | tests/integration/quality.test.ts |
| watch | cli/commands/watch.ts | ~150줄 | tests/integration/watch.test.ts |
| report | cli/commands/report.ts | ~150줄 | tests/integration/report.test.ts |
| prompt | cli/commands/prompt.ts | ~100줄 | ✅ 기존 확장 |

#### 테스트 케이스 예시

```typescript
// tests/integration/change.test.ts
describe('sdd change', () => {
  it('새 변경 제안을 생성한다', async () => {});
  it('-t 옵션으로 제목을 지정한다', async () => {});
  it('-l 옵션으로 목록을 출력한다', async () => {});
  it('특정 변경을 조회한다', async () => {});
  it('diff로 변경 내용을 표시한다', async () => {});
  it('validate로 검증한다', async () => {});
  it('apply로 적용한다', async () => {});
  it('archive로 아카이브한다', async () => {});
});
```

---

### Phase 2: Core 비즈니스 로직 테스트 (목표: 65%)

**기간**: Phase 1 완료 후
**예상 커버리지**: 50% → 65%
**테스트 수 증가**: +60개

#### 대상 파일

| 모듈 | 파일 | 라인 수 | 테스트 파일 |
|------|------|---------|------------|
| impact | core/impact/analyzer.ts | 643줄 | tests/unit/core/impact/analyzer.test.ts |
| quality | core/quality/analyzer.ts | 624줄 | tests/unit/core/quality/analyzer.test.ts |
| migrate | core/migrate/detector.ts | 524줄 | tests/unit/core/migrate/detector.test.ts |
| report | core/report/reporter.ts | 508줄 | tests/unit/core/report/reporter.test.ts |
| new | core/new/branch.ts | 236줄 | tests/unit/core/new/branch.test.ts |
| new | core/new/counter.ts | 229줄 | tests/unit/core/new/counter.test.ts |
| change | core/change/archive.ts | 233줄 | tests/unit/core/change/archive.test.ts |

#### 테스트 케이스 예시

```typescript
// tests/unit/core/quality/analyzer.test.ts
describe('QualityAnalyzer', () => {
  describe('analyze', () => {
    it('RFC 2119 키워드 사용 점수를 계산한다', () => {});
    it('GIVEN-WHEN-THEN 존재 점수를 계산한다', () => {});
    it('요구사항 섹션 점수를 계산한다', () => {});
    it('의존성 명시 점수를 계산한다', () => {});
    it('구조 완성도 점수를 계산한다', () => {});
    it('Constitution 버전 참조 점수를 계산한다', () => {});
    it('내부 링크 무결성 점수를 계산한다', () => {});
    it('메타데이터 완성도 점수를 계산한다', () => {});
    it('종합 등급을 계산한다 (A-F)', () => {});
  });
});
```

---

### Phase 3: Generator 및 유틸리티 테스트 (목표: 75%)

**기간**: Phase 2 완료 후
**예상 커버리지**: 65% → 75%
**테스트 수 증가**: +40개

#### 대상 파일

| 모듈 | 파일 | 라인 수 | 테스트 파일 |
|------|------|---------|------------|
| generators | claude-commands.ts | 904줄 | tests/unit/generators/claude-commands.test.ts |
| watch | core/watch/watcher.ts | 168줄 | tests/unit/core/watch/watcher.test.ts |
| utils | fs.ts (나머지) | ~80줄 | ✅ 기존 확장 |
| utils | logger.ts | ~70줄 | tests/unit/utils/logger.test.ts |
| spec | validator.ts (나머지) | ~200줄 | ✅ 기존 확장 |

#### 테스트 케이스 예시

```typescript
// tests/unit/generators/claude-commands.test.ts
describe('ClaudeCommandsGenerator', () => {
  it('16개 슬래시 커맨드를 생성한다', () => {});
  it('각 커맨드에 올바른 프롬프트를 포함한다', () => {});
  it('.claude/commands/ 디렉토리 구조를 생성한다', () => {});
  // Snapshot 테스트
  it('sdd.start.md 내용이 스냅샷과 일치한다', () => {});
  it('sdd.new.md 내용이 스냅샷과 일치한다', () => {});
});
```

---

### Phase 4: 엣지 케이스 및 에러 처리 (목표: 80%)

**기간**: Phase 3 완료 후
**예상 커버리지**: 75% → 80%
**테스트 수 증가**: +30개

#### 테스트 영역

| 영역 | 테스트 내용 |
|------|------------|
| 에러 처리 | 잘못된 입력, 파일 없음, 권한 에러 |
| 엣지 케이스 | 빈 파일, 큰 파일, 특수 문자 |
| 경계값 | 최소/최대 값, 빈 배열, null |
| 동시성 | 파일 잠금, 동시 쓰기 |

#### 예시

```typescript
// 에러 케이스 테스트
describe('에러 처리', () => {
  it('존재하지 않는 스펙을 검증하면 FILE_NOT_FOUND 에러', () => {});
  it('잘못된 YAML frontmatter는 SPEC_PARSE_ERROR', () => {});
  it('Constitution 없이 validate --constitution은 에러', () => {});
});

// 엣지 케이스 테스트
describe('엣지 케이스', () => {
  it('빈 specs/ 디렉토리에서 list는 빈 배열', () => {});
  it('의존성 순환 참조 감지', () => {});
  it('1000개 스펙 파일 처리 성능', () => {});
});
```

---

## 4. 테스트 인프라 개선

### 4.1 테스트 헬퍼 추가

```typescript
// tests/helpers/index.ts
export const createTempProject = async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'sdd-test-'));
  await runCommand('sdd', ['init'], { cwd: tmpDir });
  return tmpDir;
};

export const createMockSpec = (overrides = {}) => ({
  id: 'test-spec',
  title: 'Test Spec',
  status: 'draft',
  ...overrides,
});

export const runCommand = async (cmd: string, args: string[], options = {}) => {
  return execa(cmd, args, { ...options, reject: false });
};
```

### 4.2 Fixture 추가

```
tests/fixtures/
├── specs/
│   ├── valid-spec.md           # 유효한 스펙
│   ├── invalid-yaml.md         # 잘못된 YAML
│   ├── missing-rfc2119.md      # RFC 2119 없음
│   ├── missing-gwt.md          # GIVEN-WHEN-THEN 없음
│   └── circular-deps/          # 순환 의존성
├── constitutions/
│   ├── valid.md
│   └── invalid.md
└── proposals/
    ├── valid-proposal.md
    └── invalid-delta.md
```

### 4.3 CI 통합

```yaml
# .github/workflows/test.yml
name: Test Coverage
on: [push, pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm run test:coverage
      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi
```

---

## 5. 우선순위 및 예상 일정

### 우선순위 매트릭스

| Phase | 커버리지 증가 | 테스트 수 | 복잡도 | 우선순위 |
|-------|--------------|----------|--------|----------|
| Phase 1 | +19% | 80개 | 중간 | 🔴 1순위 |
| Phase 2 | +15% | 60개 | 높음 | 🟡 2순위 |
| Phase 3 | +10% | 40개 | 중간 | 🟡 3순위 |
| Phase 4 | +5% | 30개 | 낮음 | 🟢 4순위 |

### 진행 체크리스트

```markdown
## Phase 1: CLI Integration (31% → 50%)
- [ ] tests/integration/migrate.test.ts
- [ ] tests/integration/transition.test.ts
- [ ] tests/integration/change.test.ts
- [ ] tests/integration/cicd.test.ts
- [ ] tests/integration/impact.test.ts
- [ ] tests/integration/list.test.ts
- [ ] tests/integration/validate.test.ts
- [ ] tests/integration/quality.test.ts
- [ ] tests/integration/watch.test.ts
- [ ] tests/integration/report.test.ts
- [ ] 기존 integration 테스트 확장 (init, new, status, prompt)

## Phase 2: Core 비즈니스 로직 (50% → 65%)
- [ ] tests/unit/core/impact/analyzer.test.ts
- [ ] tests/unit/core/quality/analyzer.test.ts
- [ ] tests/unit/core/migrate/detector.test.ts
- [ ] tests/unit/core/report/reporter.test.ts
- [ ] tests/unit/core/new/branch.test.ts
- [ ] tests/unit/core/new/counter.test.ts
- [ ] tests/unit/core/change/archive.test.ts

## Phase 3: Generator 및 유틸리티 (65% → 75%)
- [ ] tests/unit/generators/claude-commands.test.ts
- [ ] tests/unit/core/watch/watcher.test.ts
- [ ] tests/unit/utils/logger.test.ts
- [ ] 기존 테스트 확장 (fs.ts, validator.ts)

## Phase 4: 엣지 케이스 (75% → 80%)
- [ ] 에러 처리 테스트 추가
- [ ] 엣지 케이스 테스트 추가
- [ ] 경계값 테스트 추가
```

---

## 6. 성공 기준

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| Line Coverage | ≥ 80% | `pnpm run test:coverage` |
| Branch Coverage | ≥ 80% | `pnpm run test:coverage` |
| Function Coverage | ≥ 80% | `pnpm run test:coverage` |
| 테스트 통과율 | 100% | CI 자동 검증 |
| 테스트 실행 시간 | < 60초 | CI 성능 모니터링 |

---

## 7. 부록: 테스트 작성 가이드

### Integration 테스트 패턴

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execa } from 'execa';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('sdd <command>', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'sdd-test-'));
    await execa('node', ['bin/sdd.js', 'init'], { cwd: testDir });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('정상 케이스', async () => {
    const result = await execa('node', ['bin/sdd.js', 'command'], {
      cwd: testDir,
      reject: false
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('expected output');
  });

  it('에러 케이스', async () => {
    const result = await execa('node', ['bin/sdd.js', 'command', '--invalid'], {
      cwd: testDir,
      reject: false
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('error message');
  });
});
```

### Unit 테스트 패턴

```typescript
import { describe, it, expect, vi } from 'vitest';
import { SomeModule } from '@/core/some-module';

describe('SomeModule', () => {
  describe('someMethod', () => {
    it('정상 입력에 대해 올바른 결과를 반환한다', () => {
      const result = SomeModule.someMethod(validInput);
      expect(result).toEqual(expectedOutput);
    });

    it('잘못된 입력에 대해 에러를 반환한다', () => {
      expect(() => SomeModule.someMethod(invalidInput))
        .toThrow(ExpectedError);
    });
  });
});
```
