/**
 * 기능 번호 카운터 관리
 *
 * .sdd/counter.json 파일을 사용하여 feature 번호를 자동 관리합니다.
 * 형식: feature/001-name, feature/002-name, ...
 */
import path from 'node:path';
import { fileExists, readFile, writeFile } from '../../utils/fs.js';
import { Result, success, failure } from '../../types/index.js';

/**
 * 카운터 데이터 구조
 */
export interface CounterData {
  /** 다음 기능 번호 */
  nextFeatureNumber: number;
  /** 마지막 업데이트 시간 */
  lastUpdated: string;
  /** 생성된 기능 이력 */
  history: FeatureHistoryEntry[];
}

/**
 * 기능 이력 항목
 */
export interface FeatureHistoryEntry {
  /** 기능 번호 */
  number: number;
  /** 기능 이름 */
  name: string;
  /** 전체 ID (예: feature/001-auth) */
  fullId: string;
  /** 생성 시간 */
  createdAt: string;
}

/**
 * 카운터 에러
 */
export class CounterError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'CounterError';
  }
}

/**
 * 기본 카운터 데이터
 */
function getDefaultCounterData(): CounterData {
  return {
    nextFeatureNumber: 1,
    lastUpdated: new Date().toISOString(),
    history: [],
  };
}

/**
 * 카운터 파일 경로
 */
function getCounterPath(sddPath: string): string {
  return path.join(sddPath, 'counter.json');
}

/**
 * 카운터 데이터 읽기
 */
export async function readCounter(sddPath: string): Promise<Result<CounterData, CounterError>> {
  const counterPath = getCounterPath(sddPath);

  if (!(await fileExists(counterPath))) {
    return success(getDefaultCounterData());
  }

  const readResult = await readFile(counterPath);
  if (!readResult.success) {
    return failure(new CounterError('카운터 파일을 읽을 수 없습니다', 'READ_ERROR'));
  }

  try {
    const data = JSON.parse(readResult.data) as CounterData;
    return success(data);
  } catch {
    return failure(new CounterError('카운터 파일 형식이 올바르지 않습니다', 'PARSE_ERROR'));
  }
}

/**
 * 카운터 데이터 저장
 */
export async function saveCounter(sddPath: string, data: CounterData): Promise<Result<void, CounterError>> {
  const counterPath = getCounterPath(sddPath);

  try {
    await writeFile(counterPath, JSON.stringify(data, null, 2));
    return success(undefined);
  } catch {
    return failure(new CounterError('카운터 파일을 저장할 수 없습니다', 'WRITE_ERROR'));
  }
}

/**
 * 다음 기능 번호 가져오기 및 증가
 */
export async function getNextFeatureNumber(
  sddPath: string,
  featureName: string
): Promise<Result<{ number: number; fullId: string; branchName: string }, CounterError>> {
  const counterResult = await readCounter(sddPath);
  if (!counterResult.success) {
    return failure(counterResult.error);
  }

  const data = counterResult.data;
  const currentNumber = data.nextFeatureNumber;

  // 번호 포맷팅 (3자리, 앞에 0 채움)
  const paddedNumber = String(currentNumber).padStart(3, '0');

  // 기능 이름 정규화
  const normalizedName = featureName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const fullId = `${paddedNumber}-${normalizedName}`;
  const branchName = `feature/${fullId}`;

  // 카운터 업데이트
  data.nextFeatureNumber = currentNumber + 1;
  data.lastUpdated = new Date().toISOString();
  data.history.push({
    number: currentNumber,
    name: featureName,
    fullId,
    createdAt: new Date().toISOString(),
  });

  const saveResult = await saveCounter(sddPath, data);
  if (!saveResult.success) {
    return failure(saveResult.error);
  }

  return success({
    number: currentNumber,
    fullId,
    branchName,
  });
}

/**
 * 현재 카운터 상태 조회 (증가하지 않음)
 */
export async function peekNextFeatureNumber(sddPath: string): Promise<Result<number, CounterError>> {
  const counterResult = await readCounter(sddPath);
  if (!counterResult.success) {
    return failure(counterResult.error);
  }

  return success(counterResult.data.nextFeatureNumber);
}

/**
 * 기능 이력 조회
 */
export async function getFeatureHistory(sddPath: string): Promise<Result<FeatureHistoryEntry[], CounterError>> {
  const counterResult = await readCounter(sddPath);
  if (!counterResult.success) {
    return failure(counterResult.error);
  }

  return success(counterResult.data.history);
}

/**
 * 카운터 초기화 (주의: 모든 이력 삭제)
 */
export async function resetCounter(sddPath: string, startFrom: number = 1): Promise<Result<void, CounterError>> {
  const data: CounterData = {
    nextFeatureNumber: startFrom,
    lastUpdated: new Date().toISOString(),
    history: [],
  };

  return saveCounter(sddPath, data);
}

/**
 * 카운터 설정 (이력 유지)
 */
export async function setNextFeatureNumber(
  sddPath: string,
  nextNumber: number
): Promise<Result<void, CounterError>> {
  const counterResult = await readCounter(sddPath);
  if (!counterResult.success) {
    return failure(counterResult.error);
  }

  const data = counterResult.data;
  data.nextFeatureNumber = nextNumber;
  data.lastUpdated = new Date().toISOString();

  return saveCounter(sddPath, data);
}

/**
 * 브랜치 이름에서 기능 번호 추출
 */
export function extractFeatureNumberFromBranch(branchName: string): number | null {
  // feature/001-name 또는 001-name 형식
  const match = branchName.match(/(?:feature\/)?(\d{3})-/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * 기능 ID 형식 검증
 */
export function isValidFeatureId(id: string): boolean {
  // 001-name 형식
  return /^\d{3}-[a-z0-9]+(-[a-z0-9]+)*$/.test(id);
}
