/**
 * 파일 감시 모듈
 *
 * .sdd/specs/ 디렉토리의 파일 변경을 감시합니다.
 */
import chokidar, { FSWatcher } from 'chokidar';
import path from 'node:path';
import { EventEmitter } from 'node:events';

/**
 * 파일 이벤트 타입
 */
export type FileEventType = 'add' | 'change' | 'unlink';

/**
 * 파일 이벤트
 */
export interface FileEvent {
  type: FileEventType;
  path: string;
  relativePath: string;
  timestamp: Date;
}

/**
 * Watch 옵션
 */
export interface WatchOptions {
  specsPath: string;
  debounceMs?: number;
  ignored?: string[];
}

/**
 * Watch 결과
 */
export interface WatchResult {
  events: FileEvent[];
  duration: number;
}

/**
 * 파일 감시자 클래스
 */
export class SpecWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private specsPath: string;
  private debounceMs: number;
  private debounceTimer: NodeJS.Timeout | null = null;
  private pendingEvents: FileEvent[] = [];
  private isRunning = false;

  constructor(options: WatchOptions) {
    super();
    this.specsPath = options.specsPath;
    this.debounceMs = options.debounceMs ?? 500;
  }

  /**
   * 감시 시작
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    const ignored = [
      '**/node_modules/**',
      '**/.git/**',
      '**/.*',
    ];

    this.watcher = chokidar.watch(this.specsPath, {
      persistent: true,
      ignoreInitial: true,
      ignored,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', (filePath) => this.handleEvent('add', filePath))
      .on('change', (filePath) => this.handleEvent('change', filePath))
      .on('unlink', (filePath) => this.handleEvent('unlink', filePath))
      .on('error', (error) => this.emit('error', error))
      .on('ready', () => {
        this.isRunning = true;
        this.emit('ready');
      });
  }

  /**
   * 감시 중지
   */
  async stop(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    this.isRunning = false;
    this.pendingEvents = [];
  }

  /**
   * 실행 상태 확인
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * 파일 이벤트 처리
   */
  private handleEvent(type: FileEventType, filePath: string): void {
    // .md 파일만 처리
    if (!filePath.endsWith('.md')) {
      return;
    }

    const event: FileEvent = {
      type,
      path: filePath,
      relativePath: path.relative(this.specsPath, filePath),
      timestamp: new Date(),
    };

    this.pendingEvents.push(event);

    // 디바운싱
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flushEvents();
    }, this.debounceMs);
  }

  /**
   * 대기 중인 이벤트 처리
   */
  private flushEvents(): void {
    if (this.pendingEvents.length === 0) {
      return;
    }

    const events = [...this.pendingEvents];
    this.pendingEvents = [];
    this.debounceTimer = null;

    this.emit('change', events);
  }
}

/**
 * 감시자 생성 헬퍼
 */
export function createWatcher(options: WatchOptions): SpecWatcher {
  return new SpecWatcher(options);
}
