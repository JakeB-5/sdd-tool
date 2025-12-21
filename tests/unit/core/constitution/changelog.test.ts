/**
 * CHANGELOG 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  generateChangelog,
  formatChangelogEntry,
  parseChangelog,
  createChangelogEntry,
  suggestBumpType,
} from '../../../../src/core/constitution/changelog.js';

describe('formatChangelogEntry', () => {
  it('CHANGELOG 항목을 포맷팅한다', () => {
    const entry = {
      version: '1.1.0',
      date: '2025-12-21',
      changes: [
        { type: 'added' as const, description: 'Redis 기술 스택 추가' },
      ],
      reason: '캐시 레이어 도입',
    };

    const result = formatChangelogEntry(entry);

    expect(result).toContain('## [1.1.0] - 2025-12-21');
    expect(result).toContain('### Added');
    expect(result).toContain('- Redis 기술 스택 추가');
    expect(result).toContain('### Reason');
    expect(result).toContain('- 캐시 레이어 도입');
  });

  it('여러 변경 유형을 그룹화한다', () => {
    const entry = {
      version: '2.0.0',
      date: '2025-12-21',
      changes: [
        { type: 'added' as const, description: '새 기능' },
        { type: 'changed' as const, description: '변경된 기능' },
        { type: 'removed' as const, description: '삭제된 기능' },
      ],
    };

    const result = formatChangelogEntry(entry);

    expect(result).toContain('### Added');
    expect(result).toContain('### Changed');
    expect(result).toContain('### Removed');
  });
});

describe('generateChangelog', () => {
  it('여러 항목을 포함한 CHANGELOG를 생성한다', () => {
    const entries = [
      {
        version: '1.1.0',
        date: '2025-12-21',
        changes: [{ type: 'added' as const, description: '새 기능' }],
      },
      {
        version: '1.0.0',
        date: '2025-12-20',
        changes: [{ type: 'added' as const, description: '초기 생성' }],
      },
    ];

    const result = generateChangelog(entries);

    expect(result).toContain('# Constitution Changelog');
    expect(result).toContain('[1.1.0]');
    expect(result).toContain('[1.0.0]');
  });
});

describe('parseChangelog', () => {
  it('CHANGELOG를 파싱한다', () => {
    const content = `# Constitution Changelog

## [1.1.0] - 2025-12-21

### Added
- Redis 기술 스택 추가

### Reason
- 캐시 레이어 도입

---

## [1.0.0] - 2025-12-20

### Added
- 초기 Constitution 생성
`;

    const result = parseChangelog(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(2);
      expect(result.data[0].version).toBe('1.1.0');
      expect(result.data[0].changes.length).toBe(1);
      expect(result.data[0].reason).toBe('캐시 레이어 도입');
    }
  });
});

describe('createChangelogEntry', () => {
  it('새 CHANGELOG 항목을 생성한다', () => {
    const entry = createChangelogEntry(
      '1.0.0',
      'minor',
      [{ type: 'added', description: '새 기능' }],
      '테스트'
    );

    expect(entry.version).toBe('1.1.0');
    expect(entry.changes.length).toBe(1);
    expect(entry.reason).toBe('테스트');
  });
});

describe('suggestBumpType', () => {
  it('removed가 있으면 MAJOR를 추천한다', () => {
    const changes = [{ type: 'removed' as const, description: '기능 삭제' }];
    expect(suggestBumpType(changes)).toBe('major');
  });

  it('breaking이 있으면 MAJOR를 추천한다', () => {
    const changes = [{ type: 'changed' as const, description: 'Breaking: API 변경' }];
    expect(suggestBumpType(changes)).toBe('major');
  });

  it('값 변경이 있으면 MAJOR를 추천한다', () => {
    const changes = [{ type: 'changed' as const, description: '커버리지 80% → 90%' }];
    expect(suggestBumpType(changes)).toBe('major');
  });

  it('added만 있으면 MINOR를 추천한다', () => {
    const changes = [{ type: 'added' as const, description: '새 기능' }];
    expect(suggestBumpType(changes)).toBe('minor');
  });

  it('fixed만 있으면 PATCH를 추천한다', () => {
    const changes = [{ type: 'fixed' as const, description: '오타 수정' }];
    expect(suggestBumpType(changes)).toBe('patch');
  });
});
