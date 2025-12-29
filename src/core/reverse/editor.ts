/**
 * 인라인 편집 모듈
 *
 * 리뷰 중 스펙을 직접 편집할 수 있는 기능을 제공합니다.
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { Result, success, failure } from '../../types/index.js';
import { fileExists } from '../../utils/fs.js';
import type { ExtractedSpec, ExtractedScenario, ExtractedContract } from './spec-generator.js';

/**
 * 편집 작업 타입
 */
export type EditOperation =
  | { type: 'update-name'; value: string }
  | { type: 'update-description'; value: string }
  | { type: 'update-scenario'; index: number; scenario: Partial<ExtractedScenario> }
  | { type: 'add-scenario'; scenario: ExtractedScenario }
  | { type: 'remove-scenario'; index: number }
  | { type: 'update-contract'; index: number; contract: Partial<ExtractedContract> }
  | { type: 'add-contract'; contract: ExtractedContract }
  | { type: 'remove-contract'; index: number }
  | { type: 'update-domain'; value: string }
  | { type: 'add-related-spec'; specId: string }
  | { type: 'remove-related-spec'; specId: string };

/**
 * 편집 히스토리 항목
 */
export interface EditHistoryEntry {
  /** 타임스탬프 */
  timestamp: Date;
  /** 작업 */
  operation: EditOperation;
  /** 이전 값 */
  previousValue: unknown;
  /** 새 값 */
  newValue: unknown;
}

/**
 * 스펙 에디터 클래스
 */
export class SpecEditor {
  private spec: ExtractedSpec;
  private history: EditHistoryEntry[] = [];
  private currentIndex = -1;

  constructor(spec: ExtractedSpec) {
    this.spec = JSON.parse(JSON.stringify(spec)); // 깊은 복사
  }

  /**
   * 현재 스펙 반환
   */
  getSpec(): ExtractedSpec {
    return this.spec;
  }

  /**
   * 편집 히스토리 반환
   */
  getHistory(): EditHistoryEntry[] {
    return [...this.history];
  }

  /**
   * 실행 취소 가능 여부
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * 다시 실행 가능 여부
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * 편집 작업 적용
   */
  apply(operation: EditOperation): Result<void, Error> {
    const previousValue = this.getValueForOperation(operation);

    try {
      this.applyOperation(operation);

      // 히스토리 추가
      const entry: EditHistoryEntry = {
        timestamp: new Date(),
        operation,
        previousValue,
        newValue: this.getValueForOperation(operation),
      };

      // 현재 위치 이후의 히스토리 삭제 (새 분기)
      this.history = this.history.slice(0, this.currentIndex + 1);
      this.history.push(entry);
      this.currentIndex++;

      return success(undefined);
    } catch (error) {
      return failure(new Error(`편집 작업 실패: ${error}`));
    }
  }

  /**
   * 실행 취소
   */
  undo(): Result<void, Error> {
    if (!this.canUndo()) {
      return failure(new Error('실행 취소할 작업이 없습니다'));
    }

    const entry = this.history[this.currentIndex];
    this.revertOperation(entry.operation, entry.previousValue);
    this.currentIndex--;

    return success(undefined);
  }

  /**
   * 다시 실행
   */
  redo(): Result<void, Error> {
    if (!this.canRedo()) {
      return failure(new Error('다시 실행할 작업이 없습니다'));
    }

    this.currentIndex++;
    const entry = this.history[this.currentIndex];
    this.applyOperation(entry.operation);

    return success(undefined);
  }

  /**
   * 이름 업데이트
   */
  updateName(name: string): Result<void, Error> {
    return this.apply({ type: 'update-name', value: name });
  }

  /**
   * 설명 업데이트
   */
  updateDescription(description: string): Result<void, Error> {
    return this.apply({ type: 'update-description', value: description });
  }

  /**
   * 시나리오 업데이트
   */
  updateScenario(index: number, scenario: Partial<ExtractedScenario>): Result<void, Error> {
    if (index < 0 || index >= this.spec.scenarios.length) {
      return failure(new Error('유효하지 않은 시나리오 인덱스'));
    }
    return this.apply({ type: 'update-scenario', index, scenario });
  }

  /**
   * 시나리오 추가
   */
  addScenario(scenario: ExtractedScenario): Result<void, Error> {
    return this.apply({ type: 'add-scenario', scenario });
  }

  /**
   * 시나리오 제거
   */
  removeScenario(index: number): Result<void, Error> {
    if (index < 0 || index >= this.spec.scenarios.length) {
      return failure(new Error('유효하지 않은 시나리오 인덱스'));
    }
    return this.apply({ type: 'remove-scenario', index });
  }

  /**
   * 계약 업데이트
   */
  updateContract(index: number, contract: Partial<ExtractedContract>): Result<void, Error> {
    if (index < 0 || index >= this.spec.contracts.length) {
      return failure(new Error('유효하지 않은 계약 인덱스'));
    }
    return this.apply({ type: 'update-contract', index, contract });
  }

  /**
   * 계약 추가
   */
  addContract(contract: ExtractedContract): Result<void, Error> {
    return this.apply({ type: 'add-contract', contract });
  }

  /**
   * 계약 제거
   */
  removeContract(index: number): Result<void, Error> {
    if (index < 0 || index >= this.spec.contracts.length) {
      return failure(new Error('유효하지 않은 계약 인덱스'));
    }
    return this.apply({ type: 'remove-contract', index });
  }

  /**
   * 도메인 업데이트
   */
  updateDomain(domain: string): Result<void, Error> {
    return this.apply({ type: 'update-domain', value: domain });
  }

  /**
   * 관련 스펙 추가
   */
  addRelatedSpec(specId: string): Result<void, Error> {
    if (this.spec.relatedSpecs.includes(specId)) {
      return failure(new Error('이미 연결된 스펙입니다'));
    }
    return this.apply({ type: 'add-related-spec', specId });
  }

  /**
   * 관련 스펙 제거
   */
  removeRelatedSpec(specId: string): Result<void, Error> {
    if (!this.spec.relatedSpecs.includes(specId)) {
      return failure(new Error('연결되지 않은 스펙입니다'));
    }
    return this.apply({ type: 'remove-related-spec', specId });
  }

  /**
   * 작업에 해당하는 현재 값 반환
   */
  private getValueForOperation(operation: EditOperation): unknown {
    switch (operation.type) {
      case 'update-name':
        return this.spec.name;
      case 'update-description':
        return this.spec.description;
      case 'update-scenario':
        return JSON.parse(JSON.stringify(this.spec.scenarios[operation.index]));
      case 'add-scenario':
        return null;
      case 'remove-scenario':
        return JSON.parse(JSON.stringify(this.spec.scenarios[operation.index]));
      case 'update-contract':
        return JSON.parse(JSON.stringify(this.spec.contracts[operation.index]));
      case 'add-contract':
        return null;
      case 'remove-contract':
        return JSON.parse(JSON.stringify(this.spec.contracts[operation.index]));
      case 'update-domain':
        return this.spec.domain;
      case 'add-related-spec':
        return null;
      case 'remove-related-spec':
        return operation.specId;
      default:
        return null;
    }
  }

  /**
   * 작업 적용
   */
  private applyOperation(operation: EditOperation): void {
    switch (operation.type) {
      case 'update-name':
        this.spec.name = operation.value;
        break;
      case 'update-description':
        this.spec.description = operation.value;
        break;
      case 'update-scenario':
        this.spec.scenarios[operation.index] = {
          ...this.spec.scenarios[operation.index],
          ...operation.scenario,
        };
        break;
      case 'add-scenario':
        this.spec.scenarios.push(operation.scenario);
        break;
      case 'remove-scenario':
        this.spec.scenarios.splice(operation.index, 1);
        break;
      case 'update-contract':
        this.spec.contracts[operation.index] = {
          ...this.spec.contracts[operation.index],
          ...operation.contract,
        };
        break;
      case 'add-contract':
        this.spec.contracts.push(operation.contract);
        break;
      case 'remove-contract':
        this.spec.contracts.splice(operation.index, 1);
        break;
      case 'update-domain':
        this.spec.domain = operation.value;
        // ID도 업데이트
        const name = this.spec.id.split('/')[1];
        this.spec.id = `${operation.value}/${name}`;
        break;
      case 'add-related-spec':
        this.spec.relatedSpecs.push(operation.specId);
        break;
      case 'remove-related-spec':
        this.spec.relatedSpecs = this.spec.relatedSpecs.filter(
          id => id !== operation.specId
        );
        break;
    }
  }

  /**
   * 작업 되돌리기
   */
  private revertOperation(operation: EditOperation, previousValue: unknown): void {
    switch (operation.type) {
      case 'update-name':
        this.spec.name = previousValue as string;
        break;
      case 'update-description':
        this.spec.description = previousValue as string;
        break;
      case 'update-scenario':
        this.spec.scenarios[operation.index] = previousValue as ExtractedScenario;
        break;
      case 'add-scenario':
        this.spec.scenarios.pop();
        break;
      case 'remove-scenario':
        this.spec.scenarios.splice(operation.index, 0, previousValue as ExtractedScenario);
        break;
      case 'update-contract':
        this.spec.contracts[operation.index] = previousValue as ExtractedContract;
        break;
      case 'add-contract':
        this.spec.contracts.pop();
        break;
      case 'remove-contract':
        this.spec.contracts.splice(operation.index, 0, previousValue as ExtractedContract);
        break;
      case 'update-domain':
        const prevDomain = previousValue as string;
        const name = this.spec.id.split('/')[1];
        this.spec.domain = prevDomain;
        this.spec.id = `${prevDomain}/${name}`;
        break;
      case 'add-related-spec':
        this.spec.relatedSpecs = this.spec.relatedSpecs.filter(
          id => id !== operation.specId
        );
        break;
      case 'remove-related-spec':
        this.spec.relatedSpecs.push(previousValue as string);
        break;
    }
  }

  /**
   * 변경 사항 미리보기
   */
  preview(): SpecDiff {
    return {
      hasChanges: this.history.length > 0,
      changeCount: this.history.length,
      operations: this.history.map(h => ({
        type: h.operation.type,
        timestamp: h.timestamp,
      })),
    };
  }

  /**
   * 모든 변경 사항 초기화
   */
  reset(): void {
    while (this.canUndo()) {
      this.undo();
    }
    this.history = [];
    this.currentIndex = -1;
  }
}

/**
 * 스펙 변경 내역
 */
export interface SpecDiff {
  hasChanges: boolean;
  changeCount: number;
  operations: Array<{ type: string; timestamp: Date }>;
}

/**
 * 편집된 스펙을 파일에 저장
 */
export async function saveEditedSpec(
  sddPath: string,
  spec: ExtractedSpec
): Promise<Result<string, Error>> {
  const draftsPath = path.join(sddPath, '.reverse-drafts', spec.domain);
  const specName = spec.id.split('/')[1];
  const filePath = path.join(draftsPath, `${specName}.json`);

  try {
    await fs.mkdir(draftsPath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(spec, null, 2), 'utf-8');
    return success(filePath);
  } catch (error) {
    return failure(new Error(`스펙 저장 실패: ${error}`));
  }
}

/**
 * 편집을 위한 스펙 로드
 */
export async function loadSpecForEditing(
  sddPath: string,
  specId: string
): Promise<Result<SpecEditor, Error>> {
  const [domain, name] = specId.split('/');
  const filePath = path.join(sddPath, '.reverse-drafts', domain, `${name}.json`);

  if (!await fileExists(filePath)) {
    return failure(new Error(`스펙을 찾을 수 없습니다: ${specId}`));
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const spec = JSON.parse(content) as ExtractedSpec;
    return success(new SpecEditor(spec));
  } catch (error) {
    return failure(new Error(`스펙 로드 실패: ${error}`));
  }
}

/**
 * 편집 세션 관리자
 */
export class EditSessionManager {
  private sessions: Map<string, SpecEditor> = new Map();

  /**
   * 편집 세션 시작
   */
  startSession(spec: ExtractedSpec): SpecEditor {
    const editor = new SpecEditor(spec);
    this.sessions.set(spec.id, editor);
    return editor;
  }

  /**
   * 편집 세션 가져오기
   */
  getSession(specId: string): SpecEditor | undefined {
    return this.sessions.get(specId);
  }

  /**
   * 편집 세션 종료
   */
  endSession(specId: string): ExtractedSpec | undefined {
    const editor = this.sessions.get(specId);
    if (editor) {
      this.sessions.delete(specId);
      return editor.getSpec();
    }
    return undefined;
  }

  /**
   * 활성 세션 목록
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * 모든 세션 종료
   */
  endAllSessions(): Map<string, ExtractedSpec> {
    const result = new Map<string, ExtractedSpec>();
    for (const [id, editor] of this.sessions) {
      result.set(id, editor.getSpec());
    }
    this.sessions.clear();
    return result;
  }
}

/**
 * 전역 편집 세션 관리자
 */
export const editSessionManager = new EditSessionManager();
