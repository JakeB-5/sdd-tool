/**
 * sdd init 명령어
 */
import { Command, Option } from 'commander';
import path from 'node:path';
import readline from 'node:readline';
import { ensureDir, writeFile, directoryExists, fileExists, readFile, readDir } from '../../utils/fs.js';
import { ExitCode } from '../../errors/index.js';
import * as logger from '../../utils/logger.js';
import { buildAgentsMdContent, generateAgentsMdBlock } from '../../generators/agents-md.js';
import { generateAgents, serializeClaudeAgent, serializeCodexAgent } from '../../generators/agents/index.js';
import { generateClaudeCommands } from '../../generators/claude-commands.js';
import {
  generateClaudeSkills,
  serializeSkill,
  serializeCodexSkill,
  serializeCodexSkillMetadata,
} from '../../generators/claude-skills.js';
import { Result, success, failure } from '../../types/index.js';
import { analyzeProject, generateSuggestions, formatAnalysis } from '../../utils/project-analyzer.js';
import { setupGit } from './git.js';

/**
 * 초기화 옵션
 */
export interface InitOptions {
  force?: boolean;
  skipGitSetup?: boolean;
  autoApprove?: boolean;
  /** 도메인 설정 파일 생성 여부 */
  withDomains?: boolean;
  /** 레거시 .claude/commands/ 슬래시 커맨드 생성 여부 (기본 false, --legacy-commands 로 true) */
  legacyCommands?: boolean;
  /**
   * @deprecated 효과 없음. 커맨드는 기본으로 생성되지 않습니다 (--no-commands 호환용).
   */
  commands?: boolean;
  /** .claude/skills/, .agents/skills/ 생성 여부 (기본 true, --no-skills 로 false) */
  skills?: boolean;
}

/**
 * 초기화 결과
 */
export interface InitResult {
  sddPath: string;
  claudePath: string;
  directories: string[];
  files: string[];
  /** 이전 버전이 만든, 더 이상 생성하지 않는 파일 (경고용, 삭제하지 않음) */
  staleFiles: string[];
  /** 내용이 달라 덮어쓰기 전에 백업한 파일 (`<file>.bak`, `<file>.1.bak`…, 프로젝트 기준 상대 경로) */
  backups: string[];
  /** 사용자에게 알릴 경고 (예: Codex가 AGENTS.md 대신 읽는 AGENTS.override.md 존재) */
  warnings: string[];
}

/**
 * 기존 백업을 덮어쓰지 않는 백업 경로 (`<file>.bak`, `<file>.1.bak`, `<file>.2.bak`…)
 */
async function nextBackupPath(relativePath: string, projectPath: string): Promise<string> {
  let candidate = `${relativePath}.bak`;
  for (let i = 1; await fileExists(path.join(projectPath, candidate)); i++) {
    candidate = `${relativePath}.${i}.bak`;
  }
  return candidate;
}

/**
 * 생성 파일 쓰기 (기존 파일 내용이 다르면 백업 후 덮어쓰기)
 */
async function writeGeneratedFile(
  projectPath: string,
  relativePath: string,
  content: string,
  backups: string[]
): Promise<void> {
  const filePath = path.join(projectPath, relativePath);
  if (await fileExists(filePath)) {
    const existing = await readFile(filePath);
    if (existing.success && existing.data !== content) {
      const backupPath = await nextBackupPath(relativePath, projectPath);
      const backupResult = await writeFile(path.join(projectPath, backupPath), existing.data);
      if (!backupResult.success) {
        throw new Error(`백업 실패: ${backupPath}`);
      }
      backups.push(backupPath);
    }
  }
  await writeFile(filePath, content);
}

/**
 * 생성할 디렉토리 목록 반환 (테스트 가능)
 */
export function getInitDirectories(withDomains = false, legacyCommands = false): string[] {
  const dirs = [
    '.sdd',
    '.sdd/specs',
    '.sdd/changes',
    '.sdd/archive',
    '.sdd/templates',
    '.claude',
    '.claude/skills',
    '.claude/agents',
    '.agents',
    '.agents/skills',
    '.codex',
    '.codex/agents',
  ];

  if (legacyCommands) {
    dirs.push('.claude/commands');
  }

  if (withDomains) {
    dirs.push('.sdd/domains');
  }

  return dirs;
}

/**
 * 루트 CLAUDE.md에 넣을 AGENTS.md import 라인
 */
export const CLAUDE_MD_IMPORT = '@AGENTS.md';

/**
 * 이전 버전(<= 1.6.0)이 넣던 import 라인 (재실행 시 CLAUDE_MD_IMPORT로 교체)
 */
export const LEGACY_CLAUDE_MD_IMPORT = '@.sdd/AGENTS.md';

// Header line written into new CLAUDE.md files, and the one older versions wrote
const CLAUDE_MD_GUIDE_LINE =
  '> AI 에이전트 워크플로우 지침은 아래에서 가져오는 루트 `AGENTS.md`의 SDD 블록에 있습니다 (Codex와 공용).';
const LEGACY_CLAUDE_MD_GUIDE_LINE =
  '> AI 에이전트 워크플로우 지침은 아래에서 가져오는 `.sdd/AGENTS.md`에 있습니다.';

/** Normalize an import path (`@./x` / `@x` / `./x` → `x`). */
function normalizeImport(importPath: string): string {
  return importPath.replace(/^@/, '').replace(/^\.\//, '');
}

/**
 * Find `@path` import lines, ignoring fenced code blocks and code spans
 * (Claude Code skips imports there too). Returns line index → normalized path.
 */
function findImportLines(lines: string[]): Map<number, string> {
  const imports = new Map<number, string>();
  let fence: string | null = null;

  lines.forEach((line, index) => {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (fence === null) {
        fence = marker;
      } else if (marker[0] === fence[0] && marker.length >= fence.length) {
        fence = null;
      }
      return;
    }
    if (fence !== null) return;

    const importMatch = /^\s*@(\S+)\s*$/.exec(line.replace(/`[^`]*`/g, ''));
    if (importMatch) {
      imports.set(index, normalizeImport(importMatch[1]));
    }
  });

  return imports;
}

/**
 * CLAUDE.md 내용 계산 (테스트 가능)
 *
 * - 파일이 없으면 짧은 헤더와 import 라인들로 새 내용을 만든다
 * - 이전 버전의 import 라인(legacyImports)은 그 줄만 새 import로 교체한다
 *   (새 import가 이미 있으면 이전 라인을 제거해 중복을 만들지 않음)
 * - 그 밖에 빠진 import가 있으면 기존 내용 끝에 덧붙인다 (기존 줄바꿈 형식 유지)
 * - 바꿀 것이 없으면 null (변경 없음)
 *
 * @param imports import 라인 목록 (예: `@AGENTS.md`)
 * @param legacyImports 교체할 이전 import 라인 목록 (예: `@.sdd/AGENTS.md`)
 */
export function buildClaudeMdContent(
  existing: string | null,
  imports: string[] = [CLAUDE_MD_IMPORT],
  legacyImports: string[] = [LEGACY_CLAUDE_MD_IMPORT]
): string | null {
  if (existing === null) {
    return `# CLAUDE.md

> 이 프로젝트는 SDD(Spec-Driven Development)를 사용합니다.
${CLAUDE_MD_GUIDE_LINE}

${imports.join('\n')}
`;
  }

  // A leading BOM is kept as-is and not treated as part of the first line
  const bomChar = String.fromCharCode(0xfeff);
  const bom = existing.startsWith(bomChar) ? bomChar : '';
  const body = existing.slice(bom.length);
  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  // Raw lines keep their own terminators so untouched lines stay byte for byte
  const rawLines = body.split(/(?<=\n)/);
  const importLines = findImportLines(rawLines.map((line) => line.replace(/\r?\n$/, '')));
  const present = new Set(importLines.values());
  const legacy = new Set(legacyImports.map(normalizeImport));
  let missing = imports.filter((line) => !present.has(normalizeImport(line)));

  let migrated = false;
  const lines = rawLines.map((raw, index) => {
    const importPath = importLines.get(index);
    if (importPath === undefined || !legacy.has(importPath)) {
      return raw;
    }
    migrated = true;
    if (missing.length === 0) {
      return '';
    }
    const terminator = /\r?\n$/.exec(raw)?.[0] ?? '';
    const replacement = `${missing.join(eol)}${terminator}`;
    missing = [];
    return replacement;
  });

  if (migrated) {
    // The header older versions generated points at the legacy file; update that exact line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].replace(/\r?\n$/, '') === LEGACY_CLAUDE_MD_GUIDE_LINE) {
        lines[i] = lines[i].replace(LEGACY_CLAUDE_MD_GUIDE_LINE, CLAUDE_MD_GUIDE_LINE);
      }
    }
  }

  let next = lines.join('');
  if (missing.length > 0) {
    const separator = next.length === 0 || next.endsWith('\n') ? '' : eol;
    next = `${next}${separator}${eol}${missing.join(eol)}${eol}`;
  }

  next = `${bom}${next}`;
  return next === existing ? null : next;
}

/**
 * 프로젝트 CLAUDE.md가 루트 AGENTS.md를 import 하도록 보장
 *
 * - 루트 CLAUDE.md가 있으면 그 파일을, 없고 .claude/CLAUDE.md가 있으면 그 파일을 갱신
 *   (import 경로는 import 하는 파일 기준 상대 경로)
 * - 둘 다 없으면 루트 CLAUDE.md를 생성
 * - CLAUDE.md가 있으면 Claude Code가 AGENTS.md를 직접 읽지 않으므로 import로 연결
 * - 이전 버전의 `@.sdd/AGENTS.md` import는 새 import로 교체
 * - 사용자 내용은 덮어쓰지 않으며, 재실행 시에도 중복 추가하지 않는다
 */
async function ensureClaudeMdImport(
  projectPath: string
): Promise<Result<{ file: string; action: 'created' | 'updated' | 'unchanged' }, Error>> {
  const rootClaudeMd = path.join(projectPath, 'CLAUDE.md');
  const dotClaudeMd = path.join(projectPath, '.claude', 'CLAUDE.md');
  const useDotClaude = !(await fileExists(rootClaudeMd)) && (await fileExists(dotClaudeMd));
  const target = useDotClaude ? dotClaudeMd : rootClaudeMd;
  const prefix = useDotClaude ? '../' : '';
  const relTarget = useDotClaude ? '.claude/CLAUDE.md' : 'CLAUDE.md';

  const imports = [`@${prefix}AGENTS.md`];
  const legacyImports = [`@${prefix}.sdd/AGENTS.md`];

  let existing: string | null = null;
  if (await fileExists(target)) {
    const readResult = await readFile(target);
    if (!readResult.success) {
      return failure(new Error(`${relTarget}를 읽을 수 없습니다: ${readResult.error.message}`));
    }
    existing = readResult.data;
  }

  const next = buildClaudeMdContent(existing, imports, legacyImports);
  if (next === null) {
    return success({ file: relTarget, action: 'unchanged' });
  }

  const writeResult = await writeFile(target, next);
  if (!writeResult.success) {
    return failure(new Error(`${relTarget}를 쓸 수 없습니다: ${writeResult.error.message}`));
  }
  return success({ file: relTarget, action: existing === null ? 'created' : 'updated' });
}

/**
 * 루트 AGENTS.md의 새 내용 계산 (쓰기 전 검증용, 파일을 바꾸지 않음)
 *
 * @returns 써야 할 내용, 변경이 없으면 null. 마커가 깨져 있거나 읽을 수 없으면 실패
 */
async function planAgentsMdBlock(
  projectPath: string,
  projectName: string
): Promise<Result<string | null, Error>> {
  const target = path.join(projectPath, 'AGENTS.md');

  let existing: string | null = null;
  if (await fileExists(target)) {
    const readResult = await readFile(target);
    if (!readResult.success) {
      return failure(new Error(`AGENTS.md를 읽을 수 없습니다: ${readResult.error.message}`));
    }
    existing = readResult.data;
  }

  try {
    return success(buildAgentsMdContent(existing, generateAgentsMdBlock({ projectName })));
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

// Skill directories written by sdd init <= 1.6.0 that are no longer generated
const LEGACY_SKILL_DIRS = new Set([
  'dev-implement',
  'dev-next',
  'dev-review',
  'dev-scaffold',
  'dev-status',
  'dev-test',
  'sdd-new',
  'sdd-change',
]);

/**
 * 이전 버전의 sdd init이 만든, 더 이상 생성하지 않는 파일 탐지 (삭제하지 않음)
 */
export async function findStaleClaudeFiles(
  projectPath: string,
  legacyCommands = false
): Promise<string[]> {
  const stale: string[] = [];

  // Guide moved to the root AGENTS.md managed block (sdd init <= 1.6.0 wrote .sdd/AGENTS.md)
  if (await fileExists(path.join(projectPath, '.sdd', 'AGENTS.md'))) {
    stale.push('.sdd/AGENTS.md');
  }

  const skillsResult = await readDir(path.join(projectPath, '.claude', 'skills'));
  if (skillsResult.success) {
    for (const entry of skillsResult.data.sort()) {
      if (LEGACY_SKILL_DIRS.has(entry)) {
        stale.push(`.claude/skills/${entry}/`);
      }
    }
  }

  const commandsResult = await readDir(path.join(projectPath, '.claude', 'commands'));
  if (commandsResult.success) {
    for (const entry of commandsResult.data.sort()) {
      if (!/^sdd\..+\.md$/.test(entry)) continue;
      const removed = entry === 'sdd.new.md' || entry === 'sdd.change.md';
      if (removed || !legacyCommands) {
        stale.push(`.claude/commands/${entry}`);
      }
    }
  }

  return stale;
}

/**
 * Constitution 내용 생성 (테스트 가능)
 */
export function generateConstitutionContent(projectName: string): string {
  const today = new Date().toISOString().split('T')[0];

  return `---
version: 1.0.0
created: ${today}
---

# Constitution: ${projectName}

> 이 프로젝트의 모든 설계와 구현은 아래 원칙을 준수해야 한다(SHALL).

## 핵심 원칙

### 1. 품질 우선

- 모든 기능은 테스트와 함께 구현해야 한다(SHALL)
- 코드 리뷰 없이 머지해서는 안 된다(SHALL NOT)

### 2. 명세 우선

- 모든 기능은 스펙 문서가 먼저 작성되어야 한다(SHALL)
- 스펙은 RFC 2119 키워드를 사용해야 한다(SHALL)
- 모든 요구사항은 GIVEN-WHEN-THEN 시나리오를 포함해야 한다(SHALL)

## 금지 사항

- 스펙 없이 기능을 구현해서는 안 된다(SHALL NOT)
- 테스트 없이 배포해서는 안 된다(SHALL NOT)

## 기술 스택

- (프로젝트에 맞게 수정하세요)

## 품질 기준

- 테스트 커버리지: 80% 이상(SHOULD)
`;
}

/**
 * domains.yml 기본 템플릿 생성
 */
export function generateDomainsYaml(): string {
  return `# 도메인 설정 파일
# 프로젝트의 도메인 구조와 의존성을 정의합니다.

version: "1.0"

domains:
  core:
    description: "핵심 공통 기능"
    path: "src/core"
    specs: []
    dependencies:
      uses: []

# 도메인 추가 예시:
# auth:
#   description: "인증/인가"
#   path: "src/auth"
#   specs:
#     - user-login
#     - oauth-google
#   dependencies:
#     uses: [core]

# 도메인 간 규칙 (선택사항):
# rules:
#   - from: order
#     to: auth
#     type: uses
#     allowed: true
#     reason: "주문 시 인증 필요"
`;
}

/**
 * 스펙 템플릿 내용 생성 (테스트 가능)
 */
export function generateSpecTemplate(): string {
  const today = new Date().toISOString().split('T')[0];

  return `---
status: draft
created: ${today}
depends: null
---

# {{FEATURE_NAME}}

> 기능 설명

---

## Requirement: {{REQUIREMENT_TITLE}}

시스템은 {{DESCRIPTION}}해야 한다(SHALL).

### Scenario: {{SCENARIO_NAME}}

- **GIVEN** {{GIVEN_CONDITION}}
- **WHEN** {{WHEN_ACTION}}
- **THEN** {{THEN_RESULT}}

---

## 비고

추가 설명이나 제약 조건
`;
}

/**
 * 초기화 실행 (테스트 가능)
 */
export async function executeInit(
  projectPath: string,
  options: InitOptions
): Promise<Result<InitResult, Error>> {
  const sddPath = path.join(projectPath, '.sdd');
  const claudePath = path.join(projectPath, '.claude');

  // 기존 디렉토리 확인
  if (await directoryExists(sddPath)) {
    if (!options.force) {
      return failure(new Error('.sdd/ 디렉토리가 이미 존재합니다. --force 옵션으로 덮어쓸 수 있습니다.'));
    }
  }

  const projectName = path.basename(projectPath);

  // 루트 AGENTS.md 블록은 무엇이든 쓰기 전에 계산·검증 (마커가 깨져 있으면 아무것도 쓰지 않고 실패)
  const agentsMdPlan = await planAgentsMdBlock(projectPath, projectName);
  if (!agentsMdPlan.success) {
    return failure(agentsMdPlan.error);
  }

  const warnings: string[] = [];
  if (await fileExists(path.join(projectPath, 'AGENTS.override.md'))) {
    warnings.push(
      '루트 AGENTS.override.md가 있어 Codex가 AGENTS.md 대신 그 파일을 읽습니다. SDD 지침 블록이 Codex에 보이지 않을 수 있습니다.'
    );
  }

  const directories = getInitDirectories(options.withDomains, options.legacyCommands);
  const createdDirs: string[] = [];

  // 디렉토리 생성
  for (const dir of directories) {
    const result = await ensureDir(path.join(projectPath, dir));
    if (!result.success) {
      return failure(new Error(`디렉토리 생성 실패: ${dir}`));
    }
    createdDirs.push(dir);
  }

  const createdFiles: string[] = [];
  const backups: string[] = [];
  // User-editable .sdd files are backed up before being overwritten;
  // tool-owned skills, agents, and commands are regenerated in place
  const write = async (relativePath: string, content: string, backup = true): Promise<void> => {
    if (backup) {
      await writeGeneratedFile(projectPath, relativePath, content, backups);
    } else {
      await writeFile(path.join(projectPath, relativePath), content);
    }
    createdFiles.push(relativePath);
  };

  // constitution.md
  await write('.sdd/constitution.md', generateConstitutionContent(projectName));

  // domains.yml (--with-domains 옵션 사용 시)
  if (options.withDomains) {
    await write('.sdd/domains.yml', generateDomainsYaml());
  }

  // 템플릿 파일 생성
  await write('.sdd/templates/spec.md', generateSpecTemplate());
  await write('.sdd/templates/proposal.md', generateProposalTemplate());
  await write('.sdd/templates/delta.md', generateDeltaTemplate());
  await write('.sdd/templates/tasks.md', generateTasksTemplate());

  // Claude Code / Codex 스킬 생성 (기본, --no-skills 로 둘 다 제외 가능)
  if (options.skills !== false) {
    for (const skill of generateClaudeSkills()) {
      await write(`.claude/skills/${skill.name}/SKILL.md`, serializeSkill(skill), false);
      await write(`.agents/skills/${skill.name}/SKILL.md`, serializeCodexSkill(skill), false);
      const metadata = serializeCodexSkillMetadata(skill);
      if (metadata !== null) {
        await write(`.agents/skills/${skill.name}/agents/openai.yaml`, metadata, false);
      }
    }
  }

  // Claude Code / Codex 서브에이전트 생성
  for (const agent of generateAgents()) {
    await write(`.claude/agents/${agent.name}.md`, serializeClaudeAgent(agent), false);
    await write(`.codex/agents/${agent.name}.toml`, serializeCodexAgent(agent), false);
  }

  // 레거시 슬래시 커맨드 생성 (--legacy-commands 사용 시에만)
  if (options.legacyCommands) {
    for (const cmd of generateClaudeCommands()) {
      await write(`.claude/commands/${cmd.name}.md`, cmd.content, false);
    }
  }

  // 루트 AGENTS.md 의 SDD 관리 블록 (Codex 는 직접, Claude Code 는 CLAUDE.md import 로 읽음)
  if (agentsMdPlan.data !== null) {
    const agentsWrite = await writeFile(path.join(projectPath, 'AGENTS.md'), agentsMdPlan.data);
    if (!agentsWrite.success) {
      return failure(new Error(`AGENTS.md를 쓸 수 없습니다: ${agentsWrite.error.message}`));
    }
    createdFiles.push('AGENTS.md');
  }

  // CLAUDE.md 가 루트 AGENTS.md 를 import 하도록 보장 (사용자 내용 보존)
  const claudeMdResult = await ensureClaudeMdImport(projectPath);
  if (!claudeMdResult.success) {
    return failure(claudeMdResult.error);
  }
  if (claudeMdResult.data.action !== 'unchanged') {
    createdFiles.push(claudeMdResult.data.file);
  }

  return success({
    sddPath,
    claudePath,
    directories: createdDirs,
    files: createdFiles,
    staleFiles: await findStaleClaudeFiles(projectPath, options.legacyCommands),
    backups,
    warnings,
  });
}

/**
 * Proposal 템플릿 생성
 */
function generateProposalTemplate(): string {
  const today = new Date().toISOString().split('T')[0];

  return `---
id: CHG-{{ID}}
status: draft
created: ${today}
---

# 변경 제안: {{TITLE}}

> 변경 목적 및 배경 설명

---

## 배경

왜 이 변경이 필요한가?

---

## 영향 범위

### 영향받는 스펙

- \`specs/{{SPEC_PATH}}\`

### 변경 유형

- [ ] 신규 추가 (ADDED)
- [ ] 수정 (MODIFIED)
- [ ] 삭제 (REMOVED)

---

## 변경 내용

### ADDED

(새로 추가되는 내용)

### MODIFIED

#### Before

\`\`\`markdown
기존 내용
\`\`\`

#### After

\`\`\`markdown
변경된 내용
\`\`\`

### REMOVED

(삭제되는 내용)

---

## 리스크 평가

- 영향도: 낮음/중간/높음
- 복잡도: 낮음/중간/높음
`;
}

/**
 * Delta 템플릿 생성
 */
function generateDeltaTemplate(): string {
  const today = new Date().toISOString().split('T')[0];

  return `---
proposal: CHG-{{ID}}
created: ${today}
---

# Delta: {{TITLE}}

## ADDED

(추가되는 스펙 내용)

## MODIFIED

### {{SPEC_PATH}}

#### Before

\`\`\`markdown
기존 내용
\`\`\`

#### After

\`\`\`markdown
변경된 내용
\`\`\`

## REMOVED

(삭제되는 스펙 참조)
`;
}

/**
 * Tasks 템플릿 생성
 */
function generateTasksTemplate(): string {
  const today = new Date().toISOString().split('T')[0];

  return `---
spec: {{SPEC_ID}}
created: ${today}
---

# Tasks: {{FEATURE_NAME}}

## 개요

- 총 작업 수: N개
- 예상 복잡도: 낮음/중간/높음

---

## 작업 목록

### Phase 1: 기반 구축

- [ ] [P1] 작업 1 설명
- [ ] [P1] 작업 2 설명

### Phase 2: 핵심 구현

- [ ] [P2] 작업 3 설명
- [ ] [P2] 작업 4 설명

### Phase 3: 마무리

- [ ] [P3] 테스트 작성
- [ ] [P3] 문서화

---

## 의존성 그래프

\`\`\`mermaid
graph LR
    A[작업 1] --> B[작업 2]
    B --> C[작업 3]
\`\`\`

---

## 마커 범례

| 마커 | 의미 |
|------|------|
| [P1-3] | 우선순위 |
| [→T] | 테스트 필요 |
| [US] | 불확실/검토 필요 |
`;
}

/**
 * 사용자 입력 프롬프트 (y/n)
 */
async function askYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes' || normalized === '예');
    });
  });
}

/**
 * Git/CI-CD 설정 대화형 프롬프트
 */
async function promptGitSetup(projectPath: string, autoApprove: boolean): Promise<void> {
  logger.newline();
  logger.info('🔍 프로젝트 구조를 분석합니다...');
  logger.newline();

  const analysis = await analyzeProject(projectPath);
  const suggestions = generateSuggestions(analysis);

  // 분석 결과 출력
  console.log(formatAnalysis(analysis));
  logger.newline();

  // Git 저장소가 아니면 안내만 제공
  if (!analysis.isGitRepo) {
    logger.warn('Git 저장소가 아닙니다.');
    logger.info('Git 설정을 활성화하려면:');
    logger.listItem('git init');
    logger.listItem('sdd git setup');
    return;
  }

  // 모든 설정이 완료된 경우
  if (!suggestions.suggestGitHooks && !suggestions.suggestGitTemplate && !suggestions.suggestGitHubActions) {
    logger.success('Git 워크플로우가 이미 설정되어 있습니다!');
    return;
  }

  // 설정 제안
  logger.info('📋 권장 설정:');
  if (suggestions.suggestGitHooks) {
    logger.listItem('Git Hooks: 커밋/푸시 시 자동 스펙 검증');
  }
  if (suggestions.suggestGitTemplate) {
    logger.listItem('커밋 템플릿: 일관된 커밋 메시지 형식');
  }
  if (suggestions.suggestGitHubActions) {
    logger.listItem('GitHub Actions: PR 시 자동 검증 및 라벨링');
  }
  logger.newline();

  // Git Hooks + Template 설치
  if (suggestions.suggestGitHooks || suggestions.suggestGitTemplate) {
    const setupGitWorkflow = autoApprove || await askYesNo('Git 워크플로우(Hooks + 템플릿)를 설치하시겠습니까?');

    if (setupGitWorkflow) {
      logger.info('Git 워크플로우를 설치합니다...');
      const result = await setupGit(projectPath, { force: false });

      if (result.success) {
        logger.success('Git 워크플로우 설치 완료!');
        if (result.data.hooks.installed.length > 0) {
          logger.listItem(`Hooks: ${result.data.hooks.installed.join(', ')}`);
        }
        if (result.data.template.installed.length > 0) {
          logger.listItem(`템플릿: ${result.data.template.installed.join(', ')}`);
        }
      } else {
        logger.warn('Git 워크플로우 설치 실패: ' + result.error.message);
      }
      logger.newline();
    }
  }

  // GitHub Actions 설치
  if (suggestions.suggestGitHubActions) {
    const setupCicd = autoApprove || await askYesNo('GitHub Actions CI/CD를 설정하시겠습니까?');

    if (setupCicd) {
      logger.info('GitHub Actions를 설정합니다...');

      // cicd 모듈 동적 import
      try {
        const workflowDir = path.join(projectPath, '.github', 'workflows');
        await ensureDir(workflowDir);

        // 검증 워크플로우 생성
        const validateContent = generateGitHubValidateWorkflow();
        await writeFile(path.join(workflowDir, 'sdd-validate.yml'), validateContent);
        logger.success('sdd-validate.yml 생성 완료');

        // 라벨러 워크플로우 생성
        const labelerContent = generateGitHubLabelerWorkflow();
        await writeFile(path.join(workflowDir, 'sdd-labeler.yml'), labelerContent);
        logger.success('sdd-labeler.yml 생성 완료');
      } catch (error) {
        logger.warn('GitHub Actions 설정 실패: ' + (error instanceof Error ? error.message : String(error)));
      }
      logger.newline();
    }
  }
}

/**
 * GitHub Actions 검증 워크플로우 생성
 */
function generateGitHubValidateWorkflow(): string {
  return `# SDD 스펙 검증 워크플로우
# 이 파일은 sdd init으로 생성되었습니다.

name: SDD Validation

on:
  push:
    branches: [main, master, develop]
    paths:
      - '.sdd/**'
  pull_request:
    branches: [main, master, develop]
    paths:
      - '.sdd/**'

jobs:
  validate:
    name: Validate Specs
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # Only the global CLI is needed; project dependencies (and a lockfile) are not required
      - name: Install SDD Tool
        run: npm install -g sdd-tool

      - name: Validate specifications
        run: sdd validate
`;
}

/**
 * GitHub Actions 라벨러 워크플로우 생성
 */
function generateGitHubLabelerWorkflow(): string {
  return `# SDD PR 라벨러 워크플로우
# 변경된 도메인에 따라 자동으로 라벨을 추가합니다

name: SDD Labeler

on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - '.sdd/**'

jobs:
  label:
    name: Add Labels
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect Changes
        id: changes
        env:
          BASE_REF: \${{ github.base_ref }}
        run: |
          # 변경된 도메인 감지
          DOMAINS=$(git diff --name-only "origin/$BASE_REF" | \\
            grep "^\\.sdd/specs/" | \\
            cut -d'/' -f3 | \\
            sort -u | \\
            tr '\\n' ' ')
          echo "domains=$DOMAINS" >> $GITHUB_OUTPUT

          # Constitution 변경 감지
          if git diff --name-only "origin/$BASE_REF" | grep -q "constitution.md"; then
            echo "constitution=true" >> $GITHUB_OUTPUT
          else
            echo "constitution=false" >> $GITHUB_OUTPUT
          fi

      - name: Apply Labels
        uses: actions/github-script@v7
        env:
          DOMAINS: \${{ steps.changes.outputs.domains }}
          CONSTITUTION: \${{ steps.changes.outputs.constitution }}
        with:
          script: |
            const labels = [];
            const domains = (process.env.DOMAINS || '').trim().split(' ').filter(Boolean);
            labels.push(...domains.map(d => \`spec:\${d}\`));

            if (process.env.CONSTITUTION === 'true') {
              labels.push('constitution');
            }

            if (labels.length > 0) {
              await github.rest.issues.addLabels({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                labels: labels,
              });
            }
`;
}

/**
 * init 명령어 등록
 */
export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('SDD 프로젝트를 초기화합니다')
    .option('-f, --force', '기존 .sdd/ 디렉토리 덮어쓰기')
    .option('--skip-git-setup', 'Git/CI-CD 설정 건너뛰기')
    .option('--auto-approve', '모든 설정을 자동 승인')
    .option('--with-domains', '도메인 설정 파일(domains.yml) 생성')
    .option('--no-skills', '스킬 생성 건너뛰기 (.claude/skills/, .agents/skills/)')
    .option('--legacy-commands', '레거시 .claude/commands/ 슬래시 커맨드도 생성 (기본: 스킬만 생성)')
    // Kept as a hidden no-op so existing scripts using --no-commands keep working.
    .addOption(new Option('--no-commands').hideHelp())
    .action(async (options: InitOptions) => {
      try {
        await runInit(options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * 초기화 실행 (CLI 래퍼)
 */
async function runInit(options: InitOptions): Promise<void> {
  const cwd = process.cwd();

  // 기존 디렉토리 확인 시 경고 출력
  if (await directoryExists(path.join(cwd, '.sdd'))) {
    if (options.force) {
      logger.warn('기존 .sdd/ 디렉토리를 덮어씁니다.');
    }
  }

  logger.info('SDD 프로젝트를 초기화합니다...');

  const result = await executeInit(cwd, options);

  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const createdFiles = result.data.files;

  logger.success('SDD 프로젝트가 초기화되었습니다.');
  logger.newline();
  logger.info('생성된 구조:');
  const skillCount = generateClaudeSkills().length;
  const agentNames = generateAgents().map((agent) => agent.name);

  logger.listItem('.sdd/');
  logger.listItem('constitution.md', 1);
  logger.listItem('specs/', 1);
  logger.listItem('changes/', 1);
  logger.listItem('archive/', 1);
  logger.listItem('templates/', 1);
  logger.listItem('.claude/ (Claude Code)');
  if (options.skills !== false) {
    logger.listItem(`skills/ (${skillCount}개)`, 1);
  }
  logger.listItem(`agents/ (${agentNames.length}개)`, 1);
  if (options.legacyCommands) {
    logger.listItem('commands/ (레거시)', 1);
  }
  if (options.skills !== false) {
    logger.listItem(`.agents/skills/ (Codex 스킬 ${skillCount}개)`);
  }
  logger.listItem(`.codex/agents/ (Codex 서브에이전트 ${agentNames.length}개)`);
  if (createdFiles.includes('AGENTS.md')) {
    logger.listItem('AGENTS.md (SDD 워크플로우 지침 블록)');
  }
  for (const claudeMd of ['CLAUDE.md', '.claude/CLAUDE.md']) {
    if (createdFiles.includes(claudeMd)) {
      logger.listItem(`${claudeMd} (AGENTS.md import)`);
    }
  }

  if (options.skills !== false) {
    logger.newline();
    logger.info(`SDD 스킬 (${skillCount}개, Claude Code: /sdd-*, Codex: $sdd-*):`);
    logger.listItem('/sdd-start - 워크플로우 시작 (통합 진입점)');
    logger.listItem('/sdd-constitution - 프로젝트 원칙 관리');
    logger.listItem('/sdd-spec - 기능 명세 작성/수정');
    logger.listItem('/sdd-plan - 구현 계획 작성');
    logger.listItem('/sdd-tasks - 작업 분해');
    logger.listItem('/sdd-implement - 구현 진행');
    logger.listItem('/sdd-validate - 스펙 검증');
    logger.listItem('/sdd-status - 상태 확인');
  }
  logger.newline();
  logger.info(`서브에이전트 (.claude/agents/, .codex/agents/): ${agentNames.join(', ')}`);
  if (options.legacyCommands) {
    logger.newline();
    logger.info('레거시 슬래시 커맨드가 .claude/commands/ 에 생성되었습니다 (/sdd.*).');
  }
  if (result.data.backups.length > 0) {
    logger.newline();
    logger.warn('기존 파일 내용이 달라 덮어쓰기 전에 백업했습니다:');
    for (const backup of result.data.backups) {
      logger.listItem(`${backup.replace(/(\.\d+)?\.bak$/, '')} → ${backup}`);
    }
    logger.info('확인 후 *.bak 파일은 삭제해도 됩니다 (커밋하지 마세요. .gitignore에 .sdd/**/*.bak 추가 권장).');
  }
  for (const warning of result.data.warnings) {
    logger.newline();
    logger.warn(warning);
  }
  if (result.data.staleFiles.length > 0) {
    logger.newline();
    logger.warn('이전 버전이 생성한, 더 이상 사용하지 않는 파일이 있습니다 (삭제하지 않았습니다):');
    for (const stale of result.data.staleFiles) {
      logger.listItem(stale);
    }
    logger.info('필요 없다면 직접 삭제하세요. 레거시 커맨드를 계속 쓰려면 --legacy-commands 를 사용하세요.');
    if (result.data.staleFiles.includes('.sdd/AGENTS.md')) {
      logger.info('SDD 워크플로우 지침은 이제 루트 AGENTS.md의 sdd:begin/end 블록에 있습니다.');
    }
  }

  // Git/CI-CD 설정 프롬프트
  if (!options.skipGitSetup) {
    await promptGitSetup(cwd, options.autoApprove || false);
  }

  logger.newline();
  logger.info('다음 단계:');
  logger.listItem('constitution.md를 수정하여 프로젝트 원칙을 정의하세요');
  logger.listItem('/sdd-spec (Codex: $sdd-spec) 으로 첫 번째 기능 명세를 작성하세요');
}
