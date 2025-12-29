/**
 * 컨텍스트 스토리지
 * .sdd/.context.json 파일로 컨텍스트 상태 영속화
 */

import path from 'node:path';
import { z } from 'zod';
import { Result, success, failure } from '../../types/index.js';
import { fileExists, readFile, writeFile, ensureDir } from '../../utils/fs.js';

/**
 * 컨텍스트 파일 경로
 */
export const CONTEXT_FILE = '.sdd/.context.json';

/**
 * 컨텍스트 데이터 스키마
 */
export const contextDataSchema = z.object({
  /** 활성 도메인 (편집 가능) */
  activeDomains: z.array(z.string()).default([]),
  /** 읽기 전용 도메인 (의존성으로 자동 포함) */
  readOnlyDomains: z.array(z.string()).default([]),
  /** 마지막 업데이트 시간 */
  updatedAt: z.string().datetime().optional(),
  /** 의존성 자동 포함 여부 */
  includeDependencies: z.boolean().default(true),
});

export type ContextData = z.infer<typeof contextDataSchema>;

/**
 * 빈 컨텍스트 생성
 */
export function createEmptyContext(): ContextData {
  return {
    activeDomains: [],
    readOnlyDomains: [],
    updatedAt: undefined,
    includeDependencies: true,
  };
}

/**
 * 컨텍스트 스토리지 클래스
 */
export class ContextStorage {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * 컨텍스트 파일 경로
   */
  get contextPath(): string {
    return path.join(this.projectPath, CONTEXT_FILE);
  }

  /**
   * 컨텍스트 로드
   */
  async load(): Promise<Result<ContextData, Error>> {
    const exists = await fileExists(this.contextPath);

    if (!exists) {
      return success(createEmptyContext());
    }

    const contentResult = await readFile(this.contextPath);
    if (!contentResult.success) {
      return failure(new Error(`컨텍스트 파일 읽기 실패: ${contentResult.error.message}`));
    }

    try {
      const raw = JSON.parse(contentResult.data);
      const parsed = contextDataSchema.safeParse(raw);

      if (!parsed.success) {
        return failure(new Error(`컨텍스트 파일 파싱 실패: ${parsed.error.message}`));
      }

      return success(parsed.data);
    } catch (e) {
      return failure(new Error(`컨텍스트 JSON 파싱 실패: ${e instanceof Error ? e.message : String(e)}`));
    }
  }

  /**
   * 컨텍스트 저장
   */
  async save(data: ContextData): Promise<Result<void, Error>> {
    // 디렉토리 확인
    const dirPath = path.dirname(this.contextPath);
    const ensureResult = await ensureDir(dirPath);
    if (!ensureResult.success) {
      return failure(new Error(`디렉토리 생성 실패: ${ensureResult.error.message}`));
    }

    // 업데이트 시간 설정
    const dataWithTimestamp: ContextData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(dataWithTimestamp, null, 2);
    const writeResult = await writeFile(this.contextPath, json);
    if (!writeResult.success) {
      return failure(new Error(`컨텍스트 파일 저장 실패: ${writeResult.error.message}`));
    }

    return success(undefined);
  }

  /**
   * 컨텍스트 삭제 (초기화)
   */
  async clear(): Promise<Result<void, Error>> {
    const exists = await fileExists(this.contextPath);
    if (!exists) {
      return success(undefined);
    }

    return this.save(createEmptyContext());
  }

  /**
   * 컨텍스트 존재 여부
   */
  async exists(): Promise<boolean> {
    return fileExists(this.contextPath);
  }
}

/**
 * 컨텍스트 스토리지 인스턴스 생성 헬퍼
 */
export function createContextStorage(projectPath: string): ContextStorage {
  return new ContextStorage(projectPath);
}
