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
  DomainDefinition,
  toDomainInfoList,
  createDefaultDomainsConfig,
  createEmptyDomainsConfig,
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
  getDomainIds,
  findDomainById,
} from './parser.js';
import { DomainGraph } from './graph.js';
import { validateDomains, DomainValidationResult, DomainValidationOptions } from '../validators/domain-validator.js';
import { generateDomainMd, domainInfoToTemplateOptions } from '../../templates/domain.md.js';

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
    options: { unlinkSpecs?: boolean } = {}
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

    // 저장
    const saveResult = await this.save(removeResult.data);
    if (!saveResult.success) {
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
  async rename(oldId: string, newId: string): Promise<Result<void, Error>> {
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
    for (const [id, def] of Object.entries(newConfig.domains)) {
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

    // 저장
    const saveResult = await this.save(newConfig);
    if (!saveResult.success) {
      return saveResult;
    }

    // 디렉토리 이동
    try {
      const oldDir = path.join(this.domainsDir, oldId);
      const newDir = path.join(this.domainsDir, newId);
      if (await directoryExists(oldDir)) {
        await fs.rename(oldDir, newDir);
      }
    } catch {
      // 무시
    }

    return success(undefined);
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
