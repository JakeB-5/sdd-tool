# 작업 계획서: Slash Commands → Skills 2.0 마이그레이션

> **작성일**: 2026-04-08
> **최종 갱신**: 2026-04-08 (v2 — kebab-case & 영문 본문 확정)
> **대상 버전**: v1.6.0 (MINOR, backward-compatible)
> **상태**: Draft (검토 대기)

---

## 1. 배경

### 1.1 Claude Code 정책 변화
- **2026-01-24** — Claude Code가 **Slash Commands를 Skills로 통합** ([출처: @trq212](https://x.com/trq212/status/2014836841846132761))
  - 기존 `~/.claude/commands/*.md` 는 **backward-compatible** (즉시 마이그레이션 불필요)
  - **권고**: 새로 만들 때는 Skill 로 작성
  - 앞으로 Skills 에 추가될 확장(서브에이전트 연동, 컨텍스트 포크 등)은 Slash Commands 에는 제공되지 않음
- **Skills 2.0** (2026-01 릴리스) — 새 기능 6종:
  - Skill Creator / Structured Evals / A/B Testing / Trigger Optimization / **Forked Context Mode** / Hot Reload
  - 새 프론트매터 필드: `context`, `hooks`, `agent`, `disable-model-invocation`, `allowed-tools` (glob 패턴)

> **서브에이전트는 deprecated 되지 않음.** 오히려 Skills와 더 긴밀히 통합됨 (`agent: <name>` 필드로 호출).

### 1.2 sdd-tool 현황
- `src/generators/claude-commands/` 하위 **28개 슬래시 커맨드** 정의 (한국어 본문)
  - core (7) · management (3) · analysis (9) · domain (3) · utils (10)
- `ClaudeCommand` 타입: `{ name, content }` — 프론트매터/메타데이터 **없음**
- `sdd init` 이 `generateClaudeCommands()` → `.claude/commands/<name>.md` 단순 write
- `.claude/skills` 디렉토리는 이미 `sdd init` 에서 생성되지만 sdd-tool이 채우진 않음

### 1.3 목적
1. 28개 슬래시 커맨드에 대응하는 **Skills 2.0 포맷의 `.claude/skills/<name>/SKILL.md`** 를 병행 생성
2. Skills 2.0 신규 필드(`context`, `allowed-tools`, `agent` 등)를 첫 번째 시민으로 지원
3. **Backward-compatible**: `.claude/commands/*.md` 도 계속 생성 (사용자가 원하면 `--no-commands` 로 생략)
4. **스킬 본문과 description 은 모두 영문으로 작성** (model-invoke 정확도 및 국제 사용자 지원)
5. 장기적으로 Skills 중심으로 전환하되, 사용자가 선택할 수 있는 경로 제공

### 1.4 비목표 (Non-Goals)
- 서브에이전트(`.claude/agents/`) 제거 — **하지 않는다**
- Skills 2.0 의 self-improving (Structured Evals, A/B Testing) 자체 구현 — Claude Code 가 제공
- 기존 한국어 슬래시 커맨드 내용의 **기계 번역** — 대신 영문으로 **재작성** (번역이 아닌 rewrite)
- 슬래시 커맨드 → 스킬 자동 변환 도구 (Phase 7, 선택적)

---

## 2. 선결 확인 사항 & 확정된 결정

| # | 항목 | 상태 | 결정 |
|---|------|------|------|
| P-1 | 병행 생성 vs 전환 | ✅ **확정** | **병행 생성** — `.claude/commands/` + `.claude/skills/` 모두 생성, backward-compatible |
| P-2 | CLI 옵션 설계 | ✅ **확정** | **제외형 플래그** — `sdd init` 기본 both, `--no-skills` / `--no-commands` 로 개별 제외 |
| P-3 | Skill 디렉토리명 규칙 | ✅ **확정** | **`sdd.start` → `sdd-start`** (kebab-case, 슬래시 커맨드는 dot, 스킬은 dash) |
| P-4 | `description` 작성 방법 | ✅ **확정** | 매핑 테이블에 **수동 영문 작성** (자동 추출 fallback 없음) |
| P-5 | `allowed-tools` 정책 | ✅ **확정** | **최소 권한 원칙** — §4 매트릭스에 지정된 스킬별 도구만 허용 |
| P-6 | `context: fork` 적용 대상 | ✅ **확정** | **7개 분석/검색 스킬**: `sdd-analyze`, `sdd-impact`, `sdd-sync`, `sdd-search`, `sdd-research`, `sdd-report`, `sdd-reverse` |
| P-7 | `agent:` 필드 자동 연계 | ✅ **확정** | **v1.6.0 에서는 미지정** — `agent:` 자동 연계는 v1.7.0 후속 작업으로 분리 |
| P-8 | 버전 정책 | ✅ **확정** | **v1.6.0 MINOR** — backward-compat 이므로 SemVer MINOR |
| **P-9** | **본문 언어** | ✅ **확정** | **스킬 body + description 은 전부 영문**. 기존 한국어 슬래시 커맨드는 원형 유지 |

> ✅ **9개 상위 항목 모두 확정 완료 (2026-04-08).**

### 2.1 세부 결정 (P-5 / P-9 하위)

Phase 0 잔여 작업이었던 `allowed-tools` 세부 정책과 용어집 핵심 항목이 추가로 확정되었습니다.

| # | 상위 | 항목 | 결정 |
|---|------|------|------|
| **P-5a** | P-5 | Bash glob 범위 | **명령어별 세밀한 glob** — `Bash(sdd validate*)`, `Bash(sdd new*)` 등 스킬 기능별로 정밀 지정. 실수 방지 우선 |
| **P-5b** | P-5 | `sdd-implement` 권한 | **표준 개발 도구 명시** — `Read, Write, Edit, Glob, Grep, Bash(npm*,pnpm*,yarn*,git*,sdd*), WebFetch` |
| **P-5c** | P-5 | WebFetch 허용 | **`sdd-research` + `sdd-implement` 2개 스킬에만** 허용. 나머지는 내부 리소스만 |
| **P-9a** | P-9 | "spec" 표기 | **"spec" 일관 사용** — 본문/커맨드/frontmatter 모두 "spec" 으로 통일 ("specification" 사용 안 함) |
| **P-9b** | P-9 | "reverse" 표기 | **"reverse extraction"** — sdd-tool 기존 용어와 일치, "reverse engineering" 과 구분 |

> ✅ **Phase 0 의사결정 단계 완전 종료.** Phase 1 착수 준비 완료.

---

## 3. Skills 2.0 프론트매터 설계

### 3.1 신규 `SkillDefinition` 타입

```ts
// src/generators/claude-skills/types.ts (신규)
export interface SkillDefinition {
  /** Skill identifier (becomes directory name, kebab-case) */
  name: string;
  /** 1-2 line summary in English (used for model routing) */
  description: string;
  /** SKILL.md body content in English */
  content: string;

  // --- Skills 2.0 fields ---
  /** Allowed tools (supports glob patterns) */
  allowedTools?: string[];
  /** Context execution mode */
  context?: 'inline' | 'fork' | 'manual-invoke-only';
  /** Before/after hook scripts */
  hooks?: { before?: string; after?: string };
  /** Linked sub-agent name */
  agent?: string;
  /** User can invoke via `/` (default: true) */
  userInvocable?: boolean;
  /** Block model auto-invocation (default: false) */
  disableModelInvocation?: boolean;
}
```

### 3.2 SKILL.md 출력 템플릿 (예시)

```markdown
---
name: sdd-start
description: Entry point for the SDD workflow — analyze project state and run the initial setup wizard
allowed-tools:
  - Read
  - Glob
  - Bash(sdd *)
context: inline
---

# SDD Start

Unified entry point for Spec-Driven Development. This skill inspects the current
project state and routes the user to the right next step: first-time setup,
brownfield reverse-engineering, or continuing an existing workflow.

## Core Principle

**Initial setup always takes precedence over workflow suggestions.**
...
```

---

## 4. 28개 커맨드 변환 매트릭스 (kebab-case + 영문 description)

> **범례**: `C` = context, `A` = allowed-tools 요약, `UI` = user-invocable, `MI` = model-invocable

| 카테고리 | Skill name (kebab) | English description | C | A (요약) | UI | MI |
|---------|--------------------|---------------------|---|----------|----|----|
| **core** | `sdd-start` | Entry point for the SDD workflow — analyze project state and run the initial setup wizard | inline | Read, Glob, Bash(sdd *) | ✓ | ✓ |
| core | `sdd-spec` | Create or modify a feature specification — auto-routes between new-feature and change-proposal flows | inline | Read, Write, Edit, Glob | ✓ | ✓ |
| core | `sdd-new` | Scaffold a new feature spec with RFC 2119 keywords and GIVEN-WHEN-THEN scenarios | inline | Read, Write, Edit, Glob, Bash(sdd new*) | ✓ | ✓ |
| core | `sdd-plan` | Build an implementation plan from an existing spec, including phases and risk analysis | inline | Read, Write, Edit, Glob | ✓ | ✓ |
| core | `sdd-tasks` | Break an implementation plan into actionable tasks with priorities and dependencies | inline | Read, Write, Edit | ✓ | ✓ |
| core | `sdd-implement` | Execute tasks sequentially with TDD discipline (red → green → refactor) | inline | Read, Write, Edit, Glob, Grep, Bash(npm*,pnpm*,yarn*,git*,sdd*), WebFetch | ✓ | ✓ |
| core | `sdd-validate` | Validate spec files against RFC 2119 and GIVEN-WHEN-THEN format rules | inline | Read, Glob, Bash(sdd validate*) | ✓ | ✓ |
| **mgmt** | `sdd-constitution` | Create or edit the project constitution — core principles, technical standards, forbidden practices | inline | Read, Write, Edit | ✓ | ✓ |
| mgmt | `sdd-change` | Author a change proposal against an existing spec with delta and impact analysis | inline | Read, Write, Edit, Glob | ✓ | ✓ |
| mgmt | `sdd-status` | Summarize current SDD project state — specs, changes, progress, blockers | inline | Read, Glob, Bash(sdd status*) | ✓ | ✓ |
| **analysis** | `sdd-analyze` | Analyze a user request and estimate its implementation scope and affected domains | **fork** | Read, Glob, Grep | ✓ | ✓ |
| analysis | `sdd-impact` | Analyze downstream impact of a proposed spec change across domains and code | **fork** | Read, Glob, Grep, Bash(sdd impact*) | ✓ | ✓ |
| analysis | `sdd-quality` | Compute a quality score for a spec file based on clarity, completeness, and testability | inline | Read, Glob, Bash(sdd quality*) | ✓ | ✓ |
| analysis | `sdd-sync` | Verify synchronization between spec requirements and implementation code | **fork** | Read, Glob, Grep, Bash(sdd sync*) | ✓ | ✓ |
| analysis | `sdd-diff` | Visualize spec changes between commits or within the working directory | inline | Read, Glob, Bash(sdd diff*,git diff) | ✓ | ✓ |
| analysis | `sdd-search` | Search across spec files by keyword, metadata, domain, or status | **fork** | Read, Glob, Grep, Bash(sdd search*) | ✓ | ✓ |
| analysis | `sdd-list` | List specs with filtering by domain, status, or priority | inline | Read, Glob, Bash(sdd list*) | ✓ | ✓ |
| analysis | `sdd-export` | Export specs to HTML, JSON, or consolidated Markdown with theme support | inline | Read, Write, Glob, Bash(sdd export*) | ✓ | ✓ |
| analysis | `sdd-report` | Generate a project-level report of specs, progress, and quality metrics | **fork** | Read, Glob, Grep, Bash(sdd report*) | ✓ | ✓ |
| **domain** | `sdd-reverse` | Extract spec drafts from an existing codebase for brownfield SDD onboarding | **fork** | Read, Glob, Grep, Bash(sdd reverse*) | ✓ | ✓ |
| domain | `sdd-domain` | Manage domains — create, link specs, set dependencies, visualize the graph | inline | Read, Write, Edit, Bash(sdd domain*) | ✓ | ✓ |
| domain | `sdd-context` | Set or clear the active domain context for scoped SDD operations | inline | Read, Write, Bash(sdd context*) | ✓ | ✓ |
| **utils** | `sdd-guide` | Explain the SDD methodology and walk through the available commands | inline | Read | ✓ | ✗ |
| utils | `sdd-chat` | Interactive SDD assistant for conversational spec work | inline | Read, Glob | ✓ | ✗ |
| utils | `sdd-transition` | Switch between new-feature and change-proposal workflows mid-session | inline | Read, Write | ✓ | ✓ |
| utils | `sdd-research` | Generate a technical research document on a given topic with citations | **fork** | Read, Write, Glob, Grep, WebFetch | ✓ | ✓ |
| utils | `sdd-data-model` | Generate or update a data model document from a spec | inline | Read, Write, Edit, Glob | ✓ | ✓ |
| utils | `sdd-prepare` | Audit required skills and sub-agents for a feature before implementation | inline | Read, Glob, Bash(sdd prepare*) | ✓ | ✓ |
| utils | `sdd-cicd` | Set up CI/CD configuration (GitHub Actions, GitLab CI) for SDD validation | inline | Read, Write, Bash(sdd cicd*) | ✓ | ✗ |
| utils | `sdd-watch` | Watch spec files and auto-validate on change (long-running) | **manual-invoke-only** | Bash(sdd watch*) | ✓ | ✗ |
| utils | `sdd-migrate` | Import specs from external tools (Notion, Jira, etc.) into the SDD format | inline | Read, Write, Bash(sdd migrate*) | ✓ | ✗ |
| utils | `sdd-prompt` | Output raw prompts for a given workflow step | inline | Read | ✓ | ✓ |

> 매트릭스는 2차 초안. Phase 0 에서 `allowed-tools` 와 `context` 재검토 후 확정.

---

## 5. 아키텍처 변경

### 5.1 신규 디렉토리 구조

기존 `claude-commands/` 를 **미러링**한다. 각 스킬 정의 파일은 독립된 영문 모듈이며, 한국어 슬래시 커맨드와는 별개로 유지된다.

```
src/generators/
├── claude-commands/              (기존 · 유지, 한국어)
│   ├── core/sdd.start.ts         (한국어 본문, name: 'sdd.start')
│   ├── core/sdd.spec.ts
│   └── ... 28개 ...
│
└── claude-skills/                (신규 · 영문)
    ├── types.ts                  SkillDefinition 타입
    ├── writer.ts                 YAML 프론트매터 + body 직렬화
    ├── index.ts                  generateClaudeSkills() 배럴
    ├── core/
    │   ├── sdd-start.ts          영문 SkillDefinition, name: 'sdd-start'
    │   ├── sdd-spec.ts
    │   ├── sdd-new.ts
    │   ├── sdd-plan.ts
    │   ├── sdd-tasks.ts
    │   ├── sdd-implement.ts
    │   ├── sdd-validate.ts
    │   └── index.ts
    ├── management/
    │   ├── sdd-constitution.ts
    │   ├── sdd-change.ts
    │   ├── sdd-status.ts
    │   └── index.ts
    ├── analysis/
    │   ├── sdd-analyze.ts
    │   ├── sdd-impact.ts
    │   ├── sdd-quality.ts
    │   ├── sdd-sync.ts
    │   ├── sdd-diff.ts
    │   ├── sdd-search.ts
    │   ├── sdd-list.ts
    │   ├── sdd-export.ts
    │   ├── sdd-report.ts
    │   └── index.ts
    ├── domain/
    │   ├── sdd-reverse.ts
    │   ├── sdd-domain.ts
    │   ├── sdd-context.ts
    │   └── index.ts
    └── utils/
        ├── sdd-guide.ts
        ├── sdd-chat.ts
        ├── sdd-transition.ts
        ├── sdd-research.ts
        ├── sdd-data-model.ts
        ├── sdd-prepare.ts
        ├── sdd-cicd.ts
        ├── sdd-watch.ts
        ├── sdd-migrate.ts
        ├── sdd-prompt.ts
        └── index.ts
```

**파일 수**: 신규 33개 (28 skill + 5 category index + 3 root files = types/writer/index)

### 5.2 핵심 설계 결정

1. **한국어 슬래시 커맨드와 영문 스킬은 완전히 독립적**
   - converter 없음. 각 스킬은 처음부터 영문으로 **재작성** (rewrite, not translate)
   - 이유: 기계 번역 품질 회피, 영문 독자를 위한 자연스러운 표현, 중복 소스로 인한 드리프트 방지는 매핑 테스트로 해결
2. **드리프트 방지 테스트**: `tests/unit/generators/claude-skills/mapping.test.ts`
   - `generateClaudeCommands().map(c=>c.name)` 과 `generateClaudeSkills().map(s=>s.name.replace(/-/g,'.'))` 가 **동일 집합**인지 확인
   - 한쪽에만 있는 항목 검출 → 드리프트 알림

### 5.3 `sdd init` 통합

```ts
// src/cli/commands/init.ts (개념)
import { generateClaudeCommands } from '../../generators/claude-commands.js';
import { generateClaudeSkills, serializeSkill } from '../../generators/claude-skills.js';

// ... existing logic ...

if (options.commands !== false) {                      // default: true
  const commands = generateClaudeCommands();
  for (const cmd of commands) {
    await writeFile(path.join(commandsPath, `${cmd.name}.md`), cmd.content);
    files.push(`.claude/commands/${cmd.name}.md`);
  }
}

if (options.skills !== false) {                        // default: true
  const skills = generateClaudeSkills();
  for (const skill of skills) {
    const skillDir = path.join(skillsPath, skill.name);
    await mkdir(skillDir, { recursive: true });
    await writeFile(path.join(skillDir, 'SKILL.md'), serializeSkill(skill));
    files.push(`.claude/skills/${skill.name}/SKILL.md`);
  }
}
```

### 5.4 `writer.ts` 직렬화

`gray-matter` 의존성(이미 사용 중)으로 프론트매터 직렬화. `allowedTools` 가 배열이면 YAML 리스트로, 빈 `hooks` 는 생략하는 등 **unset 필드는 프론트매터에서 제외**.

---

## 6. 단계별 실행 계획

### Phase 0 — 의사결정 (코드 변경 0)
- [x] §2 선결 확인 사항 9건 모두 확정 (2026-04-08)
- [x] §2.1 세부 결정 5건 확정 (P-5a/b/c, P-9a/b · 2026-04-08)
- [x] §4 매트릭스 `allowed-tools` 정책 반영 완료 (`sdd-implement` 구체화 포함)
- [x] §8.1 용어집 핵심 용어 확정 (spec, reverse extraction)
- [ ] 기준 브랜치 생성: `git checkout -b feat/slash-commands-to-skills dev`

### Phase 1 — 기반 모듈 (3 파일)
- [ ] `src/generators/claude-skills/types.ts` — `SkillDefinition`
- [ ] `src/generators/claude-skills/writer.ts` — `serializeSkill(skill)` (gray-matter 사용)
- [ ] `src/generators/claude-skills/index.ts` — barrel + `generateClaudeSkills()` 스켈레톤 (빈 배열 반환)
- **검증**: `pnpm typecheck`

### Phase 2 — 28개 영문 스킬 정의 (SWARM 병렬 실행)
> CLAUDE.md "**5개 이상 독립 파일 → 병렬 서브에이전트 필수**" 규칙 적용.
> `executor` 서브에이전트 5개에 카테고리별로 분배한다.

**작업 분배**:
| 서브에이전트 | 파일 수 | 대상 |
|-------------|---------|------|
| executor #1 | 8 | core/ (7) + core/index.ts |
| executor #2 | 4 | management/ (3) + management/index.ts |
| executor #3 | 10 | analysis/ (9) + analysis/index.ts |
| executor #4 | 4 | domain/ (3) + domain/index.ts |
| executor #5 | 11 | utils/ (10) + utils/index.ts |

**각 서브에이전트의 프롬프트 원칙**:
1. 한국어 원본(`src/generators/claude-commands/<category>/<name>.ts`)을 참고하되 **기계 번역 금지**
2. 자연스러운 기술 영어로 **재작성** — SDD workflow conventions, RFC 2119, GIVEN-WHEN-THEN 등 표준 용어는 그대로 유지
3. `SkillDefinition` 필드를 §4 매트릭스에 맞춰 채움
4. 본문 구조는 원본과 의미적으로 대응 (단계, 예시, 표 등)

- [ ] 5개 executor 병렬 실행 (5개를 한 번에 `Agent` 호출)
- [ ] 각 executor 완료 후 해당 `category/index.ts` 가 모든 스킬을 export 하는지 확인
- [ ] `src/generators/claude-skills/index.ts` 의 `generateClaudeSkills()` 가 28개 전부 반환하도록 조립
- **검증**: `pnpm typecheck && pnpm lint` 통과, `generateClaudeSkills().length === 28`

### Phase 3 — `sdd init` 통합 (2 파일)
- [ ] `src/cli/commands/init.ts` — skills 쓰기 로직 + `--no-skills` / `--no-commands` 옵션
- [ ] `src/generators/index.ts` (있다면) — `claude-skills` re-export
- **수동 smoke test**:
  ```bash
  pnpm build
  cd /tmp && rm -rf smoke && mkdir smoke && cd smoke
  node /Users/jin/projects/sdd-tool/bin/sdd.js init --skip-git-setup
  ls -la .claude/skills/
  cat .claude/skills/sdd-start/SKILL.md
  ```

### Phase 4 — 테스트 (5 파일)
- [ ] `tests/unit/generators/claude-skills/writer.test.ts`
  - YAML 직렬화, multi-line description, 특수문자, unset 필드 제외
- [ ] `tests/unit/generators/claude-skills/definitions.test.ts`
  - 28개 모두 `name`/`description`/`content` 존재, description 영문 여부(ASCII 검사)
- [ ] `tests/unit/generators/claude-skills/mapping.test.ts`
  - 한국어 슬래시 커맨드와 영문 스킬의 **드리프트 검출** (이름 집합 일치)
- [ ] `tests/integration/init.test.ts` 갱신
  - `.claude/skills/` 하위에 28개 디렉토리 존재
  - 각 `SKILL.md` 가 `gray-matter` 로 파싱 가능
  - `--no-skills` 옵션으로 생략 가능
- [ ] `tests/unit/cli/commands/init.test.ts` — 옵션 어서션
- **검증**: `pnpm test:run --no-cache` 그린

### Phase 5 — 문서 동기화 (영·한)
- [ ] `README.md` — "Claude Code Structure" 섹션에 Skills 디렉토리 트리 추가, `--no-skills` 옵션 설명
- [ ] `README.ko.md` — 동일 내용 한국어
- [ ] `docs/cli/init.md` / `docs/ko/cli/init.md` — `--skills` / `--no-skills` 옵션
- [ ] `QUICK_REFERENCE.md`
- [ ] `CHANGELOG.md` — `[1.6.0]` 섹션
  ```markdown
  ## [1.6.0] - 2026-xx-xx

  ### Added
  - Generate Claude Code Skills 2.0 alongside slash commands in `sdd init`
  - New `.claude/skills/<name>/SKILL.md` output with Skills 2.0 frontmatter
    (allowed-tools, context, agent, user-invocable, disable-model-invocation)
  - 28 English skill definitions mirroring the existing Korean slash commands
  - `--no-skills` / `--no-commands` flags for `sdd init`

  ### Notes
  - Slash commands remain fully backward-compatible and continue to be generated
  - Skill descriptions and bodies are authored in English for routing accuracy
  ```

### Phase 6 — 릴리스
- [ ] `package.json` → `"version": "1.6.0"`
- [ ] 최종 회귀: `pnpm typecheck && pnpm lint && pnpm test:run --no-cache && pnpm build`
- [ ] PR: `feat: generate Claude Code Skills 2.0 alongside slash commands` → `dev`

### Phase 7 — (선택) 사용자 프로젝트 헬퍼
> 사용자가 기존 `~/project/.claude/commands/*.md` 를 갖고 있을 때 스킬 미러 생성
- [ ] `src/cli/commands/migrate-commands.ts` — `sdd migrate commands-to-skills`
- [ ] 단위/통합 테스트
- [ ] README 안내

---

## 7. 테스트 전략

### 7.1 단위
- `writer.test.ts` — YAML 직렬화, 본문 특수문자, unset 필드 생략
- `definitions.test.ts` — 28개 유효성, description ASCII-only (영문 여부 간이 검사)
- `mapping.test.ts` — 한국어 슬래시 vs 영문 스킬 드리프트 검출

### 7.2 통합
| # | 시나리오 | 기대 |
|---|----------|------|
| I-1 | `sdd init` 기본 | `.claude/commands/` 28개 + `.claude/skills/` 28개 디렉토리 |
| I-2 | `sdd init --no-skills` | `.claude/skills/` 없음 또는 비어있음 |
| I-3 | `sdd init --no-commands` | `.claude/commands/` 없음 또는 비어있음 |
| I-4 | 모든 SKILL.md 가 `gray-matter` 파싱됨 | ✓ |
| I-5 | 모든 스킬이 `description` + `allowed-tools` 보유 | ✓ |
| I-6 | `context: fork` 가 7개 (analyze, impact, sync, search, research, report, reverse) 에만 설정됨 | ✓ |
| I-7 | `sdd-watch` 가 `context: manual-invoke-only` 설정됨 | ✓ |

### 7.3 수동 smoke
- Claude Code 에서 `/sdd-start` 호출 → 정상 동작
- Claude Code 가 자연어 요청에서 적절한 스킬을 model-invoke 하는지 (영문 description 품질 검증)

---

## 8. 위험 분석

| # | 위험 | 영향 | 대응 |
|---|------|------|------|
| R-1 | 슬래시 커맨드(`sdd.start`)와 스킬(`sdd-start`)의 이름 차이로 사용자 혼동 | 중 | README 에 매핑 표, Claude Code 는 양쪽 모두 인식하므로 실제 영향은 낮음 |
| R-2 | **영문 재작성 품질 편차** (executor 5개 병렬 작업) | 중 | Phase 2 후 `code-reviewer` 서브에이전트가 28개 일괄 검토, 용어 일관성(sdd terms) 체크리스트 적용 |
| R-3 | 한국어 원본과 영문 스킬의 의미 드리프트 (원본 수정 시 영문 방치) | 중 | `mapping.test.ts` 로 이름 집합 검증. 내용 드리프트는 Phase 7 에서 별도 lint 도입 검토 |
| R-4 | `allowed-tools` 과소 설정 → 실행 중 권한 에러 | 중 | Phase 5 수동 smoke 에서 각 스킬 호출 |
| R-5 | Skills 2.0 스펙 변경 (초기 릴리스 불안정) | 중 | `code.claude.com/docs/en/skills` 주기적 확인, 변경 시 별도 MINOR |
| R-6 | YAML 특수문자 직렬화 오류 | 낮 | `gray-matter` 의 `engines.yaml` 사용, 테스트에 백틱/콜론/따옴표 포함 |
| R-7 | 28개 매트릭스 중 일부 스킬 누락 | 낮 | `mapping.test.ts` 가 한국어-영문 집합 일치 강제 |
| R-8 | 병렬 executor 작업 중 용어 불일치 (예: "spec" vs "specification", "constitution" vs "charter") | 중 | Phase 2 에 **용어집(glossary) 사전 작성** 필수, 각 executor 프롬프트에 포함 |

### 8.1 용어집 (Phase 2 시작 전 확정)

| 한국어 | English (통일) |
|--------|----------------|
| 스펙 / 명세 | **spec** (✅ P-9a: 일관 사용, "specification" 사용 금지) |
| 헌법 | constitution |
| 도메인 | domain |
| 변경 제안 | change proposal |
| 역추출 | **reverse extraction** (✅ P-9b: "reverse engineering" 과 구분) |
| 워크플로우 | workflow |
| 구현 | implementation |
| 검증 | validation |
| 영향도 분석 | impact analysis |
| 품질 점수 | quality score |
| 동기화 | synchronization (sync) |
| 기능 | feature |
| 요구사항 | requirement |
| 시나리오 | scenario |
| 브라운필드 / 그린필드 | brownfield / greenfield |
| RFC 2119 keywords | RFC 2119 keywords (SHALL/MUST/SHOULD/MAY — unchanged) |
| GIVEN-WHEN-THEN | GIVEN-WHEN-THEN (unchanged) |

---

## 9. 완료 조건 (Definition of Done)

- [x] §2 선결 확인 사항 9건 모두 ✅ 확정 (2026-04-08)
- [ ] `pnpm typecheck && pnpm lint && pnpm test:run --no-cache` 그린
- [ ] `sdd init` 실행 후 `.claude/skills/` 하위 28개 kebab-case 디렉토리 생성 확인
- [ ] 모든 SKILL.md 가 `name` + `description` + `allowed-tools` 보유, description 이 영문
- [ ] `--no-skills` / `--no-commands` 옵션 동작
- [ ] `mapping.test.ts` 로 한국어-영문 집합 일치 확인
- [ ] 수동 smoke: Claude Code 에서 `/sdd-start`, `/sdd-spec` 등 정상 호출
- [ ] CHANGELOG `[1.6.0]` 섹션, `package.json` 1.6.0
- [ ] README(영/한) 동기화, Skills 섹션 추가
- [ ] PR 생성: `feat: generate Claude Code Skills 2.0 alongside slash commands` → `dev`

---

## 10. 향후 확장 (본 작업 범위 밖)

1. **Hooks 필드 활용** — `sdd-validate` 의 `hooks.after` 에 `sdd validate` 자동 실행
2. **Agent 자동 연계** — `sdd-prepare` 의 키워드 매핑을 `agent:` 필드로 주입
3. **Structured Evals** — Claude Code eval 루프에 sdd-tool 의 스펙 검증 통합
4. **Domain-specific skill 프리셋** — auth, payment, api 등 도메인 템플릿
5. **한국어 스킬 번들** — `.claude/skills-ko/` 병행 생성 (옵트인)
6. **드리프트 lint** — 한국어 원본 해시 변경 감지 → 영문 스킬 업데이트 요구

---

## 11. 문서 처리

- [x] `MIGRATION-PLAN-SUBAGENTS-TO-SKILLS.md` **삭제 완료** (전제 오류)
- [ ] 본 문서를 `dev` 브랜치 첫 커밋에 포함: `docs: plan for slash commands → skills migration`

---

**문서 끝.** §2 선결 확인 사항 9건이 모두 확정되었습니다 (2026-04-08). §4 매트릭스의 `allowed-tools` 세부 검토와 §8.1 용어집 확정이 완료되면 Phase 0 를 종료하고 Phase 1 에 착수합니다.
