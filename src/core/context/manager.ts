/**
 * 컨텍스트 매니저
 * 현재 작업 도메인 컨텍스트 관리
 */

import { Result, success, failure } from '../../types/index.js';
import { ContextStorage, ContextData } from './storage.js';
import { DomainService } from '../domain/service.js';
import { DomainInfo } from '../../schemas/domains.schema.js';

/**
 * 컨텍스트 정보
 */
export interface ContextInfo {
  /** 활성 도메인 (편집 가능) */
  activeDomains: string[];
  /** 읽기 전용 도메인 (의존성으로 자동 포함) */
  readOnlyDomains: string[];
  /** 활성 도메인 상세 정보 */
  activeDomainInfos: DomainInfo[];
  /** 읽기 전용 도메인 상세 정보 */
  readOnlyDomainInfos: DomainInfo[];
  /** 총 접근 가능한 스펙 수 */
  totalSpecs: number;
  /** 마지막 업데이트 시간 */
  updatedAt?: string;
  /** 의존성 자동 포함 여부 */
  includeDependencies: boolean;
}

/**
 * 컨텍스트 설정 옵션
 */
export interface SetContextOptions {
  /** 의존성 도메인 자동 포함 */
  includeDependencies?: boolean;
}

/**
 * 컨텍스트 매니저 클래스
 */
export class ContextManager {
  private storage: ContextStorage;
  private domainService: DomainService;

  constructor(projectPath: string) {
    this.storage = new ContextStorage(projectPath);
    this.domainService = new DomainService(projectPath);
  }

  /**
   * 현재 컨텍스트 조회
   */
  async get(): Promise<Result<ContextInfo, Error>> {
    const loadResult = await this.storage.load();
    if (!loadResult.success) {
      return loadResult;
    }

    return this.buildContextInfo(loadResult.data);
  }

  /**
   * 컨텍스트 설정
   */
  async set(domainIds: string[], options: SetContextOptions = {}): Promise<Result<ContextInfo, Error>> {
    const { includeDependencies = true } = options;

    // 도메인 존재 검증
    const domainsResult = await this.domainService.list();
    if (!domainsResult.success) {
      return domainsResult;
    }

    const existingDomains = domainsResult.data.map((d) => d.id);
    const invalidDomains = domainIds.filter((id) => !existingDomains.includes(id));

    if (invalidDomains.length > 0) {
      return failure(new Error(`존재하지 않는 도메인: ${invalidDomains.join(', ')}`));
    }

    // 읽기 전용 도메인 계산 (의존성)
    let readOnlyDomains: string[] = [];
    if (includeDependencies) {
      readOnlyDomains = await this.collectDependencies(domainIds, existingDomains);
      // 활성 도메인은 읽기 전용에서 제외
      readOnlyDomains = readOnlyDomains.filter((id) => !domainIds.includes(id));
    }

    // 저장
    const data: ContextData = {
      activeDomains: domainIds,
      readOnlyDomains,
      updatedAt: new Date().toISOString(),
      includeDependencies,
    };

    const saveResult = await this.storage.save(data);
    if (!saveResult.success) {
      return saveResult;
    }

    return this.buildContextInfo(data);
  }

  /**
   * 활성 도메인 추가
   */
  async addDomain(domainId: string, options: SetContextOptions = {}): Promise<Result<ContextInfo, Error>> {
    const currentResult = await this.storage.load();
    if (!currentResult.success) {
      return currentResult;
    }

    const current = currentResult.data;
    if (current.activeDomains.includes(domainId)) {
      return this.buildContextInfo(current);
    }

    return this.set([...current.activeDomains, domainId], options);
  }

  /**
   * 활성 도메인 제거
   */
  async removeDomain(domainId: string): Promise<Result<ContextInfo, Error>> {
    const currentResult = await this.storage.load();
    if (!currentResult.success) {
      return currentResult;
    }

    const current = currentResult.data;
    const newDomains = current.activeDomains.filter((id) => id !== domainId);

    if (newDomains.length === current.activeDomains.length) {
      return this.buildContextInfo(current);
    }

    return this.set(newDomains, { includeDependencies: current.includeDependencies });
  }

  /**
   * 컨텍스트 초기화
   */
  async clear(): Promise<Result<void, Error>> {
    return this.storage.clear();
  }

  /**
   * 컨텍스트가 설정되어 있는지 확인
   */
  async isActive(): Promise<boolean> {
    const result = await this.storage.load();
    if (!result.success) {
      return false;
    }
    return result.data.activeDomains.length > 0;
  }

  /**
   * 특정 도메인이 현재 컨텍스트에 포함되어 있는지 확인
   */
  async isDomainInContext(domainId: string): Promise<boolean> {
    const result = await this.storage.load();
    if (!result.success) {
      return false;
    }
    return result.data.activeDomains.includes(domainId) || result.data.readOnlyDomains.includes(domainId);
  }

  /**
   * 특정 도메인이 활성 상태인지 확인 (편집 가능)
   */
  async isDomainActive(domainId: string): Promise<boolean> {
    const result = await this.storage.load();
    if (!result.success) {
      return false;
    }
    return result.data.activeDomains.includes(domainId);
  }

  /**
   * 컨텍스트 기반 스펙 필터링
   * 현재 컨텍스트에 포함된 도메인의 스펙만 반환
   */
  async filterSpecs<T extends { domain?: string }>(specs: T[]): Promise<Result<{ active: T[]; readOnly: T[] }, Error>> {
    const contextResult = await this.storage.load();
    if (!contextResult.success) {
      return contextResult;
    }

    const context = contextResult.data;

    // 컨텍스트가 없으면 모든 스펙 반환
    if (context.activeDomains.length === 0 && context.readOnlyDomains.length === 0) {
      return success({ active: specs, readOnly: [] });
    }

    const active = specs.filter((spec) => spec.domain && context.activeDomains.includes(spec.domain));
    const readOnly = specs.filter((spec) => spec.domain && context.readOnlyDomains.includes(spec.domain));

    return success({ active, readOnly });
  }

  /**
   * 컨텍스트에 포함된 모든 스펙 ID 목록
   */
  async getContextSpecs(): Promise<Result<{ active: string[]; readOnly: string[] }, Error>> {
    const domainsResult = await this.domainService.list();
    if (!domainsResult.success) {
      return domainsResult;
    }

    const contextResult = await this.storage.load();
    if (!contextResult.success) {
      return contextResult;
    }

    const context = contextResult.data;

    const activeSpecs: string[] = [];
    const readOnlySpecs: string[] = [];

    for (const domain of domainsResult.data) {
      if (context.activeDomains.includes(domain.id)) {
        activeSpecs.push(...domain.specs);
      } else if (context.readOnlyDomains.includes(domain.id)) {
        readOnlySpecs.push(...domain.specs);
      }
    }

    return success({ active: activeSpecs, readOnly: readOnlySpecs });
  }

  /**
   * 의존성 도메인 수집
   */
  private async collectDependencies(domainIds: string[], allDomainIds: string[]): Promise<string[]> {
    const domainsResult = await this.domainService.list();
    if (!domainsResult.success) {
      return [];
    }

    const domainMap = new Map(domainsResult.data.map((d) => [d.id, d]));
    const collected = new Set<string>();
    const queue = [...domainIds];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const domain = domainMap.get(current);

      if (!domain) {
        continue;
      }

      for (const dep of domain.dependsOn) {
        if (!collected.has(dep) && allDomainIds.includes(dep)) {
          collected.add(dep);
          queue.push(dep);
        }
      }
    }

    return Array.from(collected);
  }

  /**
   * ContextData를 ContextInfo로 변환
   */
  private async buildContextInfo(data: ContextData): Promise<Result<ContextInfo, Error>> {
    const domainsResult = await this.domainService.list();
    if (!domainsResult.success) {
      return domainsResult;
    }

    const domainMap = new Map(domainsResult.data.map((d) => [d.id, d]));

    const activeDomainInfos = data.activeDomains.map((id) => domainMap.get(id)).filter((d): d is DomainInfo => !!d);

    const readOnlyDomainInfos = data.readOnlyDomains.map((id) => domainMap.get(id)).filter((d): d is DomainInfo => !!d);

    const totalSpecs =
      activeDomainInfos.reduce((sum, d) => sum + d.specs.length, 0) +
      readOnlyDomainInfos.reduce((sum, d) => sum + d.specs.length, 0);

    return success({
      activeDomains: data.activeDomains,
      readOnlyDomains: data.readOnlyDomains,
      activeDomainInfos,
      readOnlyDomainInfos,
      totalSpecs,
      updatedAt: data.updatedAt,
      includeDependencies: data.includeDependencies,
    });
  }
}

/**
 * 컨텍스트 매니저 인스턴스 생성 헬퍼
 */
export function createContextManager(projectPath: string): ContextManager {
  return new ContextManager(projectPath);
}
