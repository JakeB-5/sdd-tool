/**
 * 도메인 서비스
 * 도메인 CRUD 및 비즈니스 로직
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { Result, success, failure } from '../../types/index.js';
import { fileExists, ensureDir, writeFile, readFile, directoryExists } from '../../utils/fs.js';
import {
  DomainsConfig,
  DomainInfo,
  toDomainInfoList,
  createDefaultDomainsConfig,
  createEmptyDomainsConfig,
  isValidDomainId,
} from '../../schemas/domains.schema.js';
import {
  parseDomainYaml,
  stringifyDomainConfig,
  addDomain as addDomainToConfig,
  removeDomain as removeDomainFromConfig,
  addSpecToDomain as addSpecToConfig,
  removeSpecFromDomain as removeSpecFromConfig,
  addDomainDependency as addDependencyToConfig,
  removeDomainDependency as removeDependencyFromConfig,
  findDomainById,
} from './parser.js';
import { DomainGraph } from './graph.js';
import { validateDomains, DomainValidationResult, DomainValidationOptions } from '../validators/domain-validator.js';
import { generateDomainMd } from '../../templates/domain.md.js';
import { parseDocument } from 'yaml';
import { listSpecs } from '../spec/locator.js';
import {
  readFrontmatter,
  updateFrontmatter,
  normalizeLineEndings,
} from '../../utils/frontmatter.js';

/**
 * 도메인 이름 변경 결과 (갱신된 항목 수)
 */
export interface DomainRenameReport {
  /** frontmatter `domain`이 갱신된 스펙 수 */
  specDomainFields: number;
  /** `<old>/...` → `<new>/...`로 바뀐 참조 수 (스펙 depends/dependencies, 변경 제안 target) */
  references: number;
}

/**
 * 계획된 파일 수정 (실패 시 original로 되돌림)
 */
interface FileEdit {
  path: string;
  original: string;
  updated: string;
}

/**
 * 파일 수정 적용 - 하나라도 실패하면 이미 쓴 파일을 되돌리고 실패 반환
 */
async function applyFileEdits(edits: FileEdit[]): Promise<Result<void, Error>> {
  const applied: FileEdit[] = [];
  for (const edit of edits) {
    const writeResult = await writeFile(edit.path, edit.updated);
    if (!writeResult.success) {
      await restoreFileEdits(applied);
      return failure(new Error(`${edit.path} 저장 실패: ${writeResult.error.message}`));
    }
    applied.push(edit);
  }
  return success(undefined);
}

/**
 * 파일 수정 되돌리기 (best effort)
 */
async function restoreFileEdits(edits: FileEdit[]): Promise<void> {
  for (const edit of edits) {
    await writeFile(edit.path, edit.original);
  }
}

/** Opening delimiter, YAML, closing delimiter (same shape as utils/frontmatter) */
const FRONTMATTER_BLOCK = /^---[ \t]*\n((?:[\s\S]*?\n)?)---[ \t]*(?:\n|$)/;

/**
 * frontmatter에서 키 하나만 제거 (주석/서식/나머지 키 유지, 본문 그대로)
 *
 * Throws on missing or invalid frontmatter so callers never rewrite unparsed content.
 */
function removeFrontmatterKey(content: string, key: string): string {
  const normalized = normalizeLineEndings(content);
  const match = normalized.match(FRONTMATTER_BLOCK);
  if (!match) {
    throw new Error('frontmatter가 없어 파일을 수정할 수 없습니다');
  }
  const doc = parseDocument(match[1]);
  if (doc.errors.length > 0) {
    throw new Error(`frontmatter YAML 오류로 파일을 수정할 수 없습니다: ${doc.errors[0].message}`);
  }
  doc.delete(key);
  // flowCollectionPadding: false keeps `[a, b]` as written instead of `[ a, b ]`
  const yamlText =
    doc.contents === null ? '' : doc.toString({ lineWidth: 0, flowCollectionPadding: false });
  return `---\n${yamlText}---\n${normalized.slice(match[0].length)}`;
}

/**
 * domains.yml 파일 경로
 */
export const DOMAINS_FILE = '.sdd/domains.yml';

/**
 * 도메인 문서 디렉토리
 */
export const DOMAINS_DIR = '.sdd/domains';

/**
 * 도메인 서비스 클래스
 */
export class DomainService {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * domains.yml 경로
   */
  get configPath(): string {
    return path.join(this.projectPath, DOMAINS_FILE);
  }

  /**
   * 도메인 디렉토리 경로
   */
  get domainsDir(): string {
    return path.join(this.projectPath, DOMAINS_DIR);
  }

  /**
   * 스펙 디렉토리 경로 (.sdd/specs)
   */
  get specsDir(): string {
    return path.join(this.projectPath, '.sdd', 'specs');
  }

  /**
   * domains.yml 로드
   */
  async load(): Promise<Result<DomainsConfig, Error>> {
    const configExists = await fileExists(this.configPath);

    if (!configExists) {
      // 파일이 없으면 빈 설정 반환
      return success(createEmptyDomainsConfig());
    }

    const contentResult = await readFile(this.configPath);
    if (!contentResult.success) {
      return failure(new Error(`domains.yml 읽기 실패: ${contentResult.error.message}`));
    }

    const parseResult = parseDomainYaml(contentResult.data);
    if (!parseResult.success) {
      const errors = parseResult.error.map((e) => e.message).join('\n');
      return failure(new Error(`domains.yml 파싱 실패:\n${errors}`));
    }

    return success(parseResult.data.config);
  }

  /**
   * domains.yml 저장
   */
  async save(config: DomainsConfig): Promise<Result<void, Error>> {
    const yaml = stringifyDomainConfig(config);
    const dirPath = path.dirname(this.configPath);

    // 디렉토리 확인
    const dirExists = await directoryExists(dirPath);
    if (!dirExists) {
      const ensureResult = await ensureDir(dirPath);
      if (!ensureResult.success) {
        return failure(new Error(`디렉토리 생성 실패: ${ensureResult.error.message}`));
      }
    }

    const writeResult = await writeFile(this.configPath, yaml);
    if (!writeResult.success) {
      return failure(new Error(`domains.yml 저장 실패: ${writeResult.error.message}`));
    }

    return success(undefined);
  }

  /**
   * 도메인 목록 가져오기
   */
  async list(): Promise<Result<DomainInfo[], Error>> {
    const loadResult = await this.load();
    if (!loadResult.success) {
      return loadResult;
    }

    return success(toDomainInfoList(loadResult.data));
  }

  /**
   * 특정 도메인 조회
   */
  async get(domainId: string): Promise<Result<DomainInfo | undefined, Error>> {
    const loadResult = await this.load();
    if (!loadResult.success) {
      return loadResult;
    }

    return success(findDomainById(loadResult.data, domainId));
  }

  /**
   * 도메인 생성
   */
  async create(
    id: string,
    options: {
      description: string;
      path?: string;
      uses?: string[];
      extends?: string[];
      implements?: string[];
      owner?: string;
      tags?: string[];
    }
  ): Promise<Result<DomainInfo, Error>> {
    // 설정 로드
    const loadResult = await this.load();
    if (!loadResult.success) {
      return loadResult;
    }

    const config = loadResult.data;

    // 도메인 추가
    const addResult = addDomainToConfig(config, id, options);
    if (!addResult.success) {
      return addResult;
    }

    // 저장
    const saveResult = await this.save(addResult.data);
    if (!saveResult.success) {
      return saveResult;
    }

    // domain.md 생성
    const domainDocResult = await this.createDomainDocument(id, options);
    if (!domainDocResult.success) {
      // domain.md 생성 실패는 경고만
      console.warn(`domain.md 생성 실패: ${domainDocResult.error.message}`);
    }

    // 생성된 도메인 정보 반환
    const newDomain = findDomainById(addResult.data, id);
    if (!newDomain) {
      return failure(new Error('도메인 생성 후 조회 실패'));
    }

    return success(newDomain);
  }

  /**
   * domain.md 문서 생성
   */
  private async createDomainDocument(
    id: string,
    options: {
      description: string;
      path?: string;
      uses?: string[];
      extends?: string[];
      implements?: string[];
      owner?: string;
      tags?: string[];
    }
  ): Promise<Result<void, Error>> {
    const domainDir = path.join(this.domainsDir, id);
    const domainMdPath = path.join(domainDir, 'domain.md');

    // 디렉토리 생성
    const ensureResult = await ensureDir(domainDir);
    if (!ensureResult.success) {
      return failure(new Error(`도메인 디렉토리 생성 실패: ${ensureResult.error.message}`));
    }

    // domain.md 내용 생성
    const content = generateDomainMd({
      id,
      description: options.description,
      path: options.path,
      uses: options.uses,
      extends: options.extends,
      implements: options.implements,
      owner: options.owner,
      tags: options.tags,
    });

    // 파일 저장
    const writeResult = await writeFile(domainMdPath, content);
    if (!writeResult.success) {
      return failure(new Error(`domain.md 저장 실패: ${writeResult.error.message}`));
    }

    return success(undefined);
  }

  /**
   * 도메인 삭제
   */
  async delete(
    id: string,
    options: {
      /** Allow deleting a domain that still has linked specs (links go with the domain) */
      unlinkSpecs?: boolean;
      /** Also remove `domain: <id>` from spec frontmatter */
      clearSpecDomainField?: boolean;
    } = {}
  ): Promise<Result<void, Error>> {
    const loadResult = await this.load();
    if (!loadResult.success) {
      return loadResult;
    }

    const config = loadResult.data;
    const domain = findDomainById(config, id);

    if (!domain) {
      return failure(new Error(`도메인을 찾을 수 없습니다: ${id}`));
    }

    // 스펙이 있으면 확인
    if (domain.specs.length > 0 && !options.unlinkSpecs) {
      return failure(
        new Error(
          `도메인 "${id}"에 ${domain.specs.length}개의 스펙이 연결되어 있습니다. --unlink-specs 옵션을 사용하세요.`
        )
      );
    }

    // 도메인 삭제
    const removeResult = removeDomainFromConfig(config, id);
    if (!removeResult.success) {
      return removeResult;
    }

    // 스펙 frontmatter를 먼저 수정하고, 설정 저장이 실패하면 되돌림
    let edits: FileEdit[] = [];
    if (options.clearSpecDomainField) {
      const planResult = await this.planDomainFieldRemoval(id);
      if (!planResult.success) {
        return planResult;
      }
      edits = planResult.data;
      const applyResult = await applyFileEdits(edits);
      if (!applyResult.success) {
        return applyResult;
      }
    }

    // 저장
    const saveResult = await this.save(removeResult.data);
    if (!saveResult.success) {
      await restoreFileEdits(edits);
      return saveResult;
    }

    // domain.md 삭제 (실패해도 무시)
    try {
      const domainDir = path.join(this.domainsDir, id);
      await fs.rm(domainDir, { recursive: true, force: true });
    } catch {
      // 무시
    }

    return success(undefined);
  }

  /**
   * 도메인 이름 변경
   */
  async rename(oldId: string, newId: string): Promise<Result<DomainRenameReport, Error>> {
    // ID 형식 확인 (경로 조작 방지)
    if (!isValidDomainId(newId)) {
      return failure(
        new Error(
          `유효하지 않은 도메인 ID입니다: ${newId} (영문 소문자로 시작하고, 소문자/숫자/하이픈만 사용할 수 있습니다)`
        )
      );
    }

    const loadResult = await this.load();
    if (!loadResult.success) {
      return loadResult;
    }

    const config = loadResult.data;
    const domain = config.domains[oldId];

    if (!domain) {
      return failure(new Error(`도메인을 찾을 수 없습니다: ${oldId}`));
    }

    if (config.domains[newId]) {
      return failure(new Error(`도메인이 이미 존재합니다: ${newId}`));
    }

    // 스펙 폴더(.sdd/specs/<old>/) 이동 가능 여부를 설정 변경 전에 확인
    const oldSpecsDir = path.join(this.specsDir, oldId);
    const newSpecsDir = path.join(this.specsDir, newId);
    // A top-level folder containing spec.md is a legacy flat spec, not a domain folder
    const moveSpecs =
      (await directoryExists(oldSpecsDir)) && !(await fileExists(path.join(oldSpecsDir, 'spec.md')));
    if (moveSpecs && (await fileExists(newSpecsDir))) {
      return failure(new Error(`스펙 폴더가 이미 존재합니다: ${path.relative(this.projectPath, newSpecsDir)}`));
    }

    // 새 이름으로 추가
    const newConfig: DomainsConfig = {
      ...config,
      domains: {
        ...config.domains,
        [newId]: domain,
      },
    };

    // 기존 이름 삭제
    delete newConfig.domains[oldId];

    // 다른 도메인의 의존성도 업데이트
    for (const [_id, def] of Object.entries(newConfig.domains)) {
      if (def.dependencies) {
        if (def.dependencies.uses?.includes(oldId)) {
          def.dependencies.uses = def.dependencies.uses.map((d) => (d === oldId ? newId : d));
        }
        if (def.dependencies.extends?.includes(oldId)) {
          def.dependencies.extends = def.dependencies.extends.map((d) => (d === oldId ? newId : d));
        }
        if (def.dependencies.implements?.includes(oldId)) {
          def.dependencies.implements = def.dependencies.implements.map((d) => (d === oldId ? newId : d));
        }
      }
    }

    // 규칙도 업데이트
    if (newConfig.rules) {
      newConfig.rules = newConfig.rules.map((rule) => ({
        ...rule,
        from: rule.from === oldId ? newId : rule.from,
        to: rule.to === oldId ? newId : rule.to,
      }));
    }

    // 스펙 폴더 이동 (설정 저장 전: 이동 실패 시 아무것도 바뀌지 않음)
    if (moveSpecs) {
      try {
        await fs.rename(oldSpecsDir, newSpecsDir);
      } catch (error) {
        return failure(
          new Error(`스펙 폴더 이동 실패: ${error instanceof Error ? error.message : String(error)}`)
        );
      }
    }
    // Roll back the folder move so the project stays consistent on later failures
    const undoMove = async (): Promise<void> => {
      if (moveSpecs) {
        await fs.rename(newSpecsDir, oldSpecsDir).catch(() => undefined);
      }
    };

    // 스펙 domain 필드와 `<old>/...` 참조(depends, 변경 제안 target)를 먼저 갱신
    const planResult = await this.planRenameEdits(oldId, newId);
    if (!planResult.success) {
      await undoMove();
      return planResult;
    }
    const { edits, report } = planResult.data;
    const applyResult = await applyFileEdits(edits);
    if (!applyResult.success) {
      await undoMove();
      return applyResult;
    }

    // 설정 저장 (실패 시 파일 수정과 폴더 이동을 모두 되돌림)
    const saveResult = await this.save(newConfig);
    if (!saveResult.success) {
      await restoreFileEdits(edits);
      await undoMove();
      return saveResult;
    }

    // 도메인 문서 디렉토리 이동
    try {
      const oldDir = path.join(this.domainsDir, oldId);
      const newDir = path.join(this.domainsDir, newId);
      if (await directoryExists(oldDir)) {
        await fs.rename(oldDir, newDir);
      }
    } catch {
      // 무시
    }

    return success(report);
  }

  /**
   * 도메인 이름 변경에 필요한 frontmatter 수정 계획 (파일은 쓰지 않음)
   *
   * - 스펙 `domain: <old>` → `<new>`
   * - 스펙 `depends`/`dependencies`의 `<old>/<feature>` → `<new>/<feature>`
   * - 변경 제안(.sdd/changes/*\/proposal.md) `target`의 `<old>/...` → `<new>/...`
   */
  private async planRenameEdits(
    oldId: string,
    newId: string
  ): Promise<Result<{ edits: FileEdit[]; report: DomainRenameReport }, Error>> {
    const edits: FileEdit[] = [];
    const report: DomainRenameReport = { specDomainFields: 0, references: 0 };
    const renameRef = (ref: string): string =>
      ref.startsWith(`${oldId}/`) ? `${newId}/${ref.slice(oldId.length + 1)}` : ref;

    const sddPath = path.join(this.projectPath, '.sdd');
    const files = (await listSpecs(sddPath)).map((s) => s.specPath);
    const changesDir = path.join(sddPath, 'changes');
    for (const entry of await fs.readdir(changesDir).catch(() => [] as string[])) {
      const proposalPath = path.join(changesDir, entry, 'proposal.md');
      if (await fileExists(proposalPath)) files.push(proposalPath);
    }

    for (const filePath of files) {
      const readResult = await readFile(filePath);
      if (!readResult.success) continue;
      const doc = readFrontmatter(readResult.data);
      if (!doc.hasFrontmatter) continue;

      const updates: Record<string, unknown> = {};
      if (doc.data.domain === oldId) {
        updates.domain = newId;
        report.specDomainFields++;
      }
      for (const key of ['depends', 'dependencies', 'target'] as const) {
        const value = doc.data[key];
        if (typeof value === 'string') {
          const refs = value.split(',').map((s) => s.trim());
          const renamed = refs.map(renameRef);
          const count = renamed.filter((r, i) => r !== refs[i]).length;
          if (count > 0) {
            updates[key] = renamed.join(', ');
            report.references += count;
          }
        } else if (Array.isArray(value)) {
          const renamed = value.map((v) => (typeof v === 'string' ? renameRef(v) : v));
          const count = renamed.filter((r, i) => r !== value[i]).length;
          if (count > 0) {
            updates[key] = renamed;
            report.references += count;
          }
        }
      }
      if (Object.keys(updates).length === 0) continue;

      try {
        edits.push({
          path: filePath,
          original: readResult.data,
          updated: updateFrontmatter(readResult.data, updates),
        });
      } catch (error) {
        return failure(
          new Error(`${filePath} 수정 실패: ${error instanceof Error ? error.message : String(error)}`)
        );
      }
    }

    return success({ edits, report });
  }

  /**
   * frontmatter `domain`이 `domainId`인 스펙에서 domain 필드를 제거하는 수정 계획 (파일은 쓰지 않음)
   */
  private async planDomainFieldRemoval(domainId: string): Promise<Result<FileEdit[], Error>> {
    const edits: FileEdit[] = [];
    for (const spec of await listSpecs(path.join(this.projectPath, '.sdd'))) {
      const readResult = await readFile(spec.specPath);
      if (!readResult.success) continue;
      const doc = readFrontmatter(readResult.data);
      if (!doc.hasFrontmatter || doc.data.domain !== domainId) continue;

      try {
        edits.push({
          path: spec.specPath,
          original: readResult.data,
          updated: removeFrontmatterKey(readResult.data, 'domain'),
        });
      } catch (error) {
        return failure(
          new Error(`${spec.specPath} 수정 실패: ${error instanceof Error ? error.message : String(error)}`)
        );
      }
    }
    return success(edits);
  }

  /**
   * 도메인 정보 업데이트
   */
  async update(
    id: string,
    updates: {
      description?: string;
      path?: string;
      owner?: string;
      tags?: string[];
    }
  ): Promise<Result<void, Error>> {
    const loadResult = await this.load();
    if (!loadResult.success) {
      return loadResult;
    }

    const config = loadResult.data;
    const domain = config.domains[id];

    if (!domain) {
      return failure(new Error(`도메인을 찾을 수 없습니다: ${id}`));
    }

    // 업데이트 적용
    if (updates.description !== undefined) {
      domain.description = updates.description;
    }
    if (updates.path !== undefined) {
      domain.path = updates.path;
    }
    if (updates.owner !== undefined) {
      domain.owner = updates.owner;
    }
    if (updates.tags !== undefined) {
      domain.tags = updates.tags;
    }

    return this.save(config);
  }

  /**
   * 스펙을 도메인에 연결
   */
  async linkSpec(domainId: string, specId: string): Promise<Result<void, Error>> {
    const loadResult = await this.load();
    if (!loadResult.success) {
      return loadResult;
    }

    const addResult = addSpecToConfig(loadResult.data, domainId, specId);
    if (!addResult.success) {
      return addResult;
    }

    return this.save(addResult.data);
  }

  /**
   * 스펙에서 도메인 연결 해제
   */
  async unlinkSpec(domainId: string, specId: string): Promise<Result<void, Error>> {
    const loadResult = await this.load();
    if (!loadResult.success) {
      return loadResult;
    }

    const removeResult = removeSpecFromConfig(loadResult.data, domainId, specId);
    if (!removeResult.success) {
      return removeResult;
    }

    return this.save(removeResult.data);
  }

  /**
   * 도메인 의존성 추가
   */
  async addDependency(
    fromDomainId: string,
    toDomainId: string,
    type: 'uses' | 'extends' | 'implements'
  ): Promise<Result<void, Error>> {
    const loadResult = await this.load();
    if (!loadResult.success) {
      return loadResult;
    }

    const addResult = addDependencyToConfig(loadResult.data, fromDomainId, toDomainId, type);
    if (!addResult.success) {
      return addResult;
    }

    return this.save(addResult.data);
  }

  /**
   * 도메인 의존성 제거
   */
  async removeDependency(
    fromDomainId: string,
    toDomainId: string,
    type: 'uses' | 'extends' | 'implements'
  ): Promise<Result<void, Error>> {
    const loadResult = await this.load();
    if (!loadResult.success) {
      return loadResult;
    }

    const removeResult = removeDependencyFromConfig(loadResult.data, fromDomainId, toDomainId, type);
    if (!removeResult.success) {
      return removeResult;
    }

    return this.save(removeResult.data);
  }

  /**
   * 도메인 그래프 가져오기
   */
  async getGraph(): Promise<Result<DomainGraph, Error>> {
    const loadResult = await this.load();
    if (!loadResult.success) {
      return loadResult;
    }

    return success(new DomainGraph(loadResult.data));
  }

  /**
   * 도메인 검증
   */
  async validate(options: DomainValidationOptions = {}): Promise<Result<DomainValidationResult, Error>> {
    const loadResult = await this.load();
    if (!loadResult.success) {
      return loadResult;
    }

    return success(validateDomains(loadResult.data, options));
  }

  /**
   * 기본 domains.yml 초기화
   */
  async initialize(): Promise<Result<void, Error>> {
    const exists = await fileExists(this.configPath);
    if (exists) {
      return failure(new Error('domains.yml이 이미 존재합니다.'));
    }

    const defaultConfig = createDefaultDomainsConfig();
    return this.save(defaultConfig);
  }
}

/**
 * 도메인 서비스 인스턴스 생성 헬퍼
 */
export function createDomainService(projectPath: string): DomainService {
  return new DomainService(projectPath);
}
