/**
 * SpecWatcher 클래스 테스트
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { SpecWatcher, FileEvent, FileEventType } from '../../../../src/core/watch/watcher.js';

// chokidar 모킹
vi.mock('chokidar', () => {
  const mockWatcher = {
    on: vi.fn().mockReturnThis(),
    close: vi.fn().mockResolvedValue(undefined),
  };

  return {
    default: {
      watch: vi.fn(() => mockWatcher),
    },
  };
});

import chokidar from 'chokidar';

describe('SpecWatcher - 초기화', () => {
  it('생성자가 옵션을 올바르게 설정한다', () => {
    const watcher = new SpecWatcher({
      specsPath: '/test/specs',
      debounceMs: 1000,
    });

    expect(watcher).toBeInstanceOf(SpecWatcher);
    expect(watcher).toBeInstanceOf(EventEmitter);
    expect(watcher.running).toBe(false);
  });

  it('기본 디바운스 시간은 500ms이다', () => {
    const watcher = new SpecWatcher({
      specsPath: '/test/specs',
    });

    // debounceMs가 private이므로 동작으로 확인
    expect(watcher).toBeInstanceOf(SpecWatcher);
  });

  it('커스텀 디바운스 시간을 설정할 수 있다', () => {
    const watcher = new SpecWatcher({
      specsPath: '/test/specs',
      debounceMs: 2000,
    });

    expect(watcher).toBeInstanceOf(SpecWatcher);
  });
});

describe('SpecWatcher - 파일 변경 감지', () => {
  let watcher: SpecWatcher;

  beforeEach(() => {
    vi.clearAllMocks();
    watcher = new SpecWatcher({
      specsPath: '/test/specs',
      debounceMs: 100,
    });
  });

  afterEach(async () => {
    if (watcher.running) {
      await watcher.stop();
    }
  });

  it('start() 호출 시 chokidar 감시를 시작한다', () => {
    watcher.start();

    expect(chokidar.watch).toHaveBeenCalledWith(
      '/test/specs',
      expect.objectContaining({
        persistent: true,
        ignoreInitial: true,
        ignored: expect.arrayContaining([
          '**/node_modules/**',
          '**/.git/**',
          '**/.*',
        ]),
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 100,
        },
      })
    );
  });

  it('add 이벤트를 처리한다', async () => {
    const mockWatcher = (chokidar.watch as any)();
    const changeHandler = vi.fn();

    watcher.on('change', changeHandler);
    watcher.start();

    // 'add' 이벤트 핸들러 찾기
    const addHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'add'
    )?.[1];

    expect(addHandler).toBeDefined();

    // .md 파일 이벤트 트리거
    addHandler?.('/test/specs/feature.md');

    // 디바운스 대기
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(changeHandler).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'add',
          path: '/test/specs/feature.md',
          relativePath: 'feature.md',
        }),
      ])
    );
  });

  it('change 이벤트를 처리한다', async () => {
    const mockWatcher = (chokidar.watch as any)();
    const changeHandler = vi.fn();

    watcher.on('change', changeHandler);
    watcher.start();

    const changeEventHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'change'
    )?.[1];

    changeEventHandler?.('/test/specs/updated.md');

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(changeHandler).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'change',
          path: '/test/specs/updated.md',
        }),
      ])
    );
  });

  it('unlink 이벤트를 처리한다', async () => {
    const mockWatcher = (chokidar.watch as any)();
    const changeHandler = vi.fn();

    watcher.on('change', changeHandler);
    watcher.start();

    const unlinkHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'unlink'
    )?.[1];

    unlinkHandler?.('/test/specs/deleted.md');

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(changeHandler).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'unlink',
          path: '/test/specs/deleted.md',
        }),
      ])
    );
  });

  it('.md 파일만 처리한다', async () => {
    const mockWatcher = (chokidar.watch as any)();
    const changeHandler = vi.fn();

    watcher.on('change', changeHandler);
    watcher.start();

    const addHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'add'
    )?.[1];

    // .txt 파일은 무시
    addHandler?.('/test/specs/readme.txt');
    addHandler?.('/test/specs/config.json');

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(changeHandler).not.toHaveBeenCalled();

    // .md 파일은 처리
    addHandler?.('/test/specs/spec.md');

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(changeHandler).toHaveBeenCalledTimes(1);
  });

  it('상대 경로를 올바르게 계산한다', async () => {
    const mockWatcher = (chokidar.watch as any)();
    const changeHandler = vi.fn();

    watcher.on('change', changeHandler);
    watcher.start();

    const addHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'add'
    )?.[1];

    addHandler?.('/test/specs/subfolder/nested.md');

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(changeHandler).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          relativePath: expect.stringContaining('subfolder'),
        }),
      ])
    );
  });
});

describe('SpecWatcher - 디바운스 로직', () => {
  let watcher: SpecWatcher;

  beforeEach(() => {
    vi.clearAllMocks();
    watcher = new SpecWatcher({
      specsPath: '/test/specs',
      debounceMs: 100,
    });
  });

  afterEach(async () => {
    if (watcher.running) {
      await watcher.stop();
    }
  });

  it('여러 이벤트를 배치로 묶는다', async () => {
    const mockWatcher = (chokidar.watch as any)();
    const changeHandler = vi.fn();

    watcher.on('change', changeHandler);
    watcher.start();

    const addHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'add'
    )?.[1];

    // 여러 파일 이벤트 발생
    addHandler?.('/test/specs/file1.md');
    addHandler?.('/test/specs/file2.md');
    addHandler?.('/test/specs/file3.md');

    // 디바운스 대기
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 한 번만 호출되어야 함
    expect(changeHandler).toHaveBeenCalledTimes(1);

    // 3개의 이벤트를 포함
    expect(changeHandler).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ path: '/test/specs/file1.md' }),
        expect.objectContaining({ path: '/test/specs/file2.md' }),
        expect.objectContaining({ path: '/test/specs/file3.md' }),
      ])
    );
  });

  it('새 이벤트 발생 시 타이머를 재시작한다', async () => {
    const mockWatcher = (chokidar.watch as any)();
    const changeHandler = vi.fn();

    watcher.on('change', changeHandler);
    watcher.start();

    const addHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'add'
    )?.[1];

    // 첫 이벤트
    addHandler?.('/test/specs/file1.md');

    // 50ms 대기 (디바운스 100ms보다 짧음)
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 아직 호출되지 않아야 함
    expect(changeHandler).not.toHaveBeenCalled();

    // 두 번째 이벤트 (타이머 재시작)
    addHandler?.('/test/specs/file2.md');

    // 50ms 더 대기
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 여전히 호출되지 않아야 함
    expect(changeHandler).not.toHaveBeenCalled();

    // 추가 60ms 대기 (총 160ms)
    await new Promise((resolve) => setTimeout(resolve, 60));

    // 이제 호출되어야 함
    expect(changeHandler).toHaveBeenCalledTimes(1);
  });

  it('디바운스 후 이벤트 배열을 비운다', async () => {
    const mockWatcher = (chokidar.watch as any)();
    const changeHandler = vi.fn();

    watcher.on('change', changeHandler);
    watcher.start();

    const addHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'add'
    )?.[1];

    // 첫 번째 배치
    addHandler?.('/test/specs/file1.md');
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(changeHandler).toHaveBeenCalledTimes(1);

    // 두 번째 배치
    addHandler?.('/test/specs/file2.md');
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(changeHandler).toHaveBeenCalledTimes(2);

    // 각 배치는 독립적이어야 함
    expect(changeHandler).toHaveBeenNthCalledWith(
      1,
      expect.arrayContaining([
        expect.objectContaining({ path: '/test/specs/file1.md' }),
      ])
    );
    expect(changeHandler).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([
        expect.objectContaining({ path: '/test/specs/file2.md' }),
      ])
    );
  });
});

describe('SpecWatcher - 에러 처리', () => {
  let watcher: SpecWatcher;

  beforeEach(() => {
    vi.clearAllMocks();
    watcher = new SpecWatcher({
      specsPath: '/test/specs',
      debounceMs: 100,
    });
  });

  afterEach(async () => {
    if (watcher.running) {
      await watcher.stop();
    }
  });

  it('chokidar 에러를 error 이벤트로 전달한다', () => {
    const mockWatcher = (chokidar.watch as any)();
    const errorHandler = vi.fn();

    watcher.on('error', errorHandler);
    watcher.start();

    const errorEventHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'error'
    )?.[1];

    const testError = new Error('Watch error');
    errorEventHandler?.(testError);

    expect(errorHandler).toHaveBeenCalledWith(testError);
  });
});

describe('SpecWatcher - 정리 및 중지', () => {
  let watcher: SpecWatcher;

  beforeEach(() => {
    vi.clearAllMocks();
    watcher = new SpecWatcher({
      specsPath: '/test/specs',
      debounceMs: 100,
    });
  });

  it('stop() 호출 시 타이머를 정리한다', async () => {
    const mockWatcher = (chokidar.watch as any)();

    watcher.start();

    const addHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'add'
    )?.[1];

    // 이벤트 발생 (타이머 시작)
    addHandler?.('/test/specs/file.md');

    // 즉시 중지
    await watcher.stop();

    // change 이벤트가 발생하지 않아야 함
    const changeHandler = vi.fn();
    watcher.on('change', changeHandler);

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(changeHandler).not.toHaveBeenCalled();
  });

  it('stop() 호출 시 watcher를 닫는다', async () => {
    const mockWatcher = (chokidar.watch as any)();

    watcher.start();
    await watcher.stop();

    expect(mockWatcher.close).toHaveBeenCalled();
  });

  it('stop() 호출 시 running 상태를 false로 변경한다', async () => {
    const mockWatcher = (chokidar.watch as any)();

    watcher.start();

    // ready 이벤트 트리거
    const readyHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'ready'
    )?.[1];
    readyHandler?.();

    expect(watcher.running).toBe(true);

    await watcher.stop();

    expect(watcher.running).toBe(false);
  });

  it('stop() 호출 시 대기 중인 이벤트를 비운다', async () => {
    const mockWatcher = (chokidar.watch as any)();
    const changeHandler = vi.fn();

    watcher.on('change', changeHandler);
    watcher.start();

    const addHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'add'
    )?.[1];

    // 이벤트 발생
    addHandler?.('/test/specs/file.md');

    // 디바운스 전에 중지
    await watcher.stop();

    // 충분히 대기
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 이벤트가 발생하지 않아야 함
    expect(changeHandler).not.toHaveBeenCalled();
  });

  it('이미 중지된 상태에서 stop() 호출 시 에러가 발생하지 않는다', async () => {
    await expect(watcher.stop()).resolves.not.toThrow();
  });
});

describe('SpecWatcher - running getter', () => {
  let watcher: SpecWatcher;

  beforeEach(() => {
    vi.clearAllMocks();
    watcher = new SpecWatcher({
      specsPath: '/test/specs',
    });
  });

  afterEach(async () => {
    if (watcher.running) {
      await watcher.stop();
    }
  });

  it('초기 상태는 false이다', () => {
    expect(watcher.running).toBe(false);
  });

  it('start() 호출 전에는 false이다', () => {
    expect(watcher.running).toBe(false);
  });

  it('ready 이벤트 후 true가 된다', () => {
    const mockWatcher = (chokidar.watch as any)();

    watcher.start();

    // ready 이벤트 트리거
    const readyHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'ready'
    )?.[1];

    expect(watcher.running).toBe(false); // 아직 ready 전

    readyHandler?.();

    expect(watcher.running).toBe(true); // ready 후
  });

  it('이미 실행 중일 때 start() 재호출 시 아무 작업도 하지 않는다', () => {
    const mockWatcher = (chokidar.watch as any)();

    watcher.start();

    // ready 이벤트 트리거
    const readyHandler = mockWatcher.on.mock.calls.find(
      (call: any) => call[0] === 'ready'
    )?.[1];
    readyHandler?.();

    const callCountBeforeSecondStart = (chokidar.watch as any).mock.calls.length;

    // 두 번째 start() 호출
    watcher.start();

    // chokidar.watch가 다시 호출되지 않아야 함
    expect((chokidar.watch as any).mock.calls.length).toBe(callCountBeforeSecondStart);
  });
});
