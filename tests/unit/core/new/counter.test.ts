/**
 * 기능 번호 카운터 관리 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  readCounter,
  saveCounter,
  getNextFeatureNumber,
  peekNextFeatureNumber,
  getFeatureHistory,
  resetCounter,
  setNextFeatureNumber,
  extractFeatureNumberFromBranch,
  isValidFeatureId,
  type CounterData,
} from '../../../../src/core/new/counter.js';

describe('readCounter', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-counter-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('파일이 없으면 기본값을 반환한다', async () => {
    const result = await readCounter(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nextFeatureNumber).toBe(1);
      expect(result.data.history).toHaveLength(0);
    }
  });

  it('기존 카운터 파일을 읽는다', async () => {
    const counterData: CounterData = {
      nextFeatureNumber: 5,
      lastUpdated: '2025-01-01T00:00:00Z',
      history: [
        { number: 1, name: 'auth', fullId: '001-auth', createdAt: '2025-01-01T00:00:00Z' },
      ],
    };
    await fs.writeFile(
      path.join(tempDir, 'counter.json'),
      JSON.stringify(counterData)
    );

    const result = await readCounter(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nextFeatureNumber).toBe(5);
      expect(result.data.history).toHaveLength(1);
    }
  });

  it('잘못된 JSON 형식은 에러를 반환한다', async () => {
    await fs.writeFile(path.join(tempDir, 'counter.json'), 'invalid json');

    const result = await readCounter(tempDir);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('PARSE_ERROR');
    }
  });
});

describe('saveCounter', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-counter-save-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('카운터 데이터를 저장한다', async () => {
    const data: CounterData = {
      nextFeatureNumber: 10,
      lastUpdated: '2025-01-01T00:00:00Z',
      history: [],
    };

    const result = await saveCounter(tempDir, data);

    expect(result.success).toBe(true);

    const saved = await fs.readFile(path.join(tempDir, 'counter.json'), 'utf-8');
    const parsed = JSON.parse(saved);
    expect(parsed.nextFeatureNumber).toBe(10);
  });
});

describe('getNextFeatureNumber', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-counter-next-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('다음 기능 번호를 반환하고 증가시킨다', async () => {
    const result1 = await getNextFeatureNumber(tempDir, 'auth');

    expect(result1.success).toBe(true);
    if (result1.success) {
      expect(result1.data.number).toBe(1);
      expect(result1.data.fullId).toBe('001-auth');
      expect(result1.data.branchName).toBe('feature/001-auth');
    }

    const result2 = await getNextFeatureNumber(tempDir, 'user');

    expect(result2.success).toBe(true);
    if (result2.success) {
      expect(result2.data.number).toBe(2);
      expect(result2.data.fullId).toBe('002-user');
    }
  });

  it('기능 이름을 정규화한다', async () => {
    const result = await getNextFeatureNumber(tempDir, 'My Feature Name!');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullId).toBe('001-my-feature-name');
    }
  });

  it('이력에 기록한다', async () => {
    await getNextFeatureNumber(tempDir, 'auth');
    await getNextFeatureNumber(tempDir, 'user');

    const historyResult = await getFeatureHistory(tempDir);

    expect(historyResult.success).toBe(true);
    if (historyResult.success) {
      expect(historyResult.data).toHaveLength(2);
      expect(historyResult.data[0].name).toBe('auth');
      expect(historyResult.data[1].name).toBe('user');
    }
  });
});

describe('peekNextFeatureNumber', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-counter-peek-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('다음 번호를 반환하지만 증가시키지 않는다', async () => {
    const peek1 = await peekNextFeatureNumber(tempDir);
    const peek2 = await peekNextFeatureNumber(tempDir);

    expect(peek1.success).toBe(true);
    expect(peek2.success).toBe(true);
    if (peek1.success && peek2.success) {
      expect(peek1.data).toBe(1);
      expect(peek2.data).toBe(1); // 증가하지 않음
    }
  });
});

describe('resetCounter', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-counter-reset-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('카운터를 초기화한다', async () => {
    await getNextFeatureNumber(tempDir, 'auth');
    await getNextFeatureNumber(tempDir, 'user');

    await resetCounter(tempDir);

    const result = await peekNextFeatureNumber(tempDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(1);
    }
  });

  it('시작 번호를 지정할 수 있다', async () => {
    await resetCounter(tempDir, 100);

    const result = await peekNextFeatureNumber(tempDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(100);
    }
  });
});

describe('setNextFeatureNumber', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-counter-set-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('다음 번호를 설정하되 이력은 유지한다', async () => {
    await getNextFeatureNumber(tempDir, 'auth');

    await setNextFeatureNumber(tempDir, 50);

    const peekResult = await peekNextFeatureNumber(tempDir);
    const historyResult = await getFeatureHistory(tempDir);

    expect(peekResult.success).toBe(true);
    expect(historyResult.success).toBe(true);
    if (peekResult.success && historyResult.success) {
      expect(peekResult.data).toBe(50);
      expect(historyResult.data).toHaveLength(1); // 이력 유지
    }
  });
});

describe('extractFeatureNumberFromBranch', () => {
  it('feature/001-name 형식에서 번호를 추출한다', () => {
    expect(extractFeatureNumberFromBranch('feature/001-auth')).toBe(1);
    expect(extractFeatureNumberFromBranch('feature/042-user-management')).toBe(42);
    expect(extractFeatureNumberFromBranch('feature/999-last')).toBe(999);
  });

  it('001-name 형식에서도 번호를 추출한다', () => {
    expect(extractFeatureNumberFromBranch('001-auth')).toBe(1);
    expect(extractFeatureNumberFromBranch('123-test')).toBe(123);
  });

  it('잘못된 형식은 null을 반환한다', () => {
    expect(extractFeatureNumberFromBranch('main')).toBeNull();
    expect(extractFeatureNumberFromBranch('feature/auth')).toBeNull();
    expect(extractFeatureNumberFromBranch('1-auth')).toBeNull(); // 3자리 아님
  });
});

describe('isValidFeatureId', () => {
  it('유효한 기능 ID를 인식한다', () => {
    expect(isValidFeatureId('001-auth')).toBe(true);
    expect(isValidFeatureId('042-user-management')).toBe(true);
    expect(isValidFeatureId('999-a-b-c')).toBe(true);
  });

  it('유효하지 않은 ID를 거부한다', () => {
    expect(isValidFeatureId('auth')).toBe(false);
    expect(isValidFeatureId('1-auth')).toBe(false); // 3자리 아님
    expect(isValidFeatureId('001_auth')).toBe(false); // 언더스코어
    expect(isValidFeatureId('001-Auth')).toBe(false); // 대문자
    expect(isValidFeatureId('feature/001-auth')).toBe(false); // prefix 포함
  });
});
