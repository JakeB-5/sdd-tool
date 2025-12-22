/**
 * 로깅 유틸리티 테스트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as logger from '../../../src/utils/logger.js';

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // 기본 로그 레벨로 초기화
    logger.setLogLevel('info');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setLogLevel', () => {
    it('로그 레벨을 설정한다', () => {
      logger.setLogLevel('debug');
      logger.debug('debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('debug 레벨에서는 모든 로그가 출력된다', () => {
      logger.setLogLevel('debug');

      logger.debug('debug');
      logger.info('info');
      logger.success('success');
      logger.warn('warn');
      logger.error('error');

      expect(consoleLogSpy).toHaveBeenCalledTimes(4); // debug, info, success, warn
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
    });

    it('error 레벨에서는 에러만 출력된다', () => {
      logger.setLogLevel('error');

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleLogSpy).toHaveBeenCalledTimes(0);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('debug', () => {
    it('debug 레벨에서 메시지를 출력한다', () => {
      logger.setLogLevel('debug');
      logger.debug('test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('DEBUG');
    });

    it('info 레벨에서는 출력하지 않는다', () => {
      logger.setLogLevel('info');
      logger.debug('test message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('info 레벨에서 메시지를 출력한다', () => {
      logger.setLogLevel('info');
      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('ℹ');
    });

    it('추가 인자를 전달한다', () => {
      logger.info('message', 'arg1', 123);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String),
        'arg1',
        123
      );
    });
  });

  describe('success', () => {
    it('성공 메시지를 출력한다', () => {
      logger.success('operation completed');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('✓');
    });
  });

  describe('warn', () => {
    it('경고 메시지를 출력한다', () => {
      logger.warn('warning message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('⚠');
    });

    it('warn 레벨에서 출력된다', () => {
      logger.setLogLevel('warn');
      logger.warn('warning');

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('에러 메시지를 출력한다', () => {
      logger.error('error message');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain('✗');
    });

    it('error 레벨에서 출력된다', () => {
      logger.setLogLevel('error');
      logger.error('error');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('title', () => {
    it('제목을 출력한다', () => {
      logger.title('Test Title');

      expect(consoleLogSpy).toHaveBeenCalled();
      // 빈 줄, 제목, 구분선
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('listItem', () => {
    it('목록 항목을 출력한다', () => {
      logger.listItem('item 1');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('•');
    });

    it('들여쓰기를 적용한다', () => {
      logger.listItem('indented item', 2);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('    •'); // 2 levels of indent
    });
  });

  describe('newline', () => {
    it('빈 줄을 출력한다', () => {
      logger.newline();

      expect(consoleLogSpy).toHaveBeenCalledWith();
    });
  });
});
