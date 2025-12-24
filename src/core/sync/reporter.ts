/**
 * 리포터 - 동기화 결과 출력
 */
import type { SyncResult, RequirementStatus, CodeLocation } from './schemas.js';

/**
 * 터미널 컬러 (ANSI 코드)
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

export class SyncReporter {
  private useColors: boolean;

  constructor(options: { colors?: boolean } = {}) {
    this.useColors = options.colors !== false;
  }

  /**
   * 터미널 출력용 포맷
   */
  formatTerminal(result: SyncResult): string {
    const lines: string[] = [];

    lines.push(this.header('SDD Sync: 스펙-코드 동기화 검증'));
    lines.push('');

    // 요약
    lines.push(
      `스펙: ${result.specs.length}개, 요구사항: ${result.totalRequirements}개`
    );
    lines.push('');

    // 구현된 요구사항
    if (result.implemented.length > 0) {
      lines.push(this.success(`✓ 구현됨 (${result.implemented.length}/${result.totalRequirements})`));
      for (const status of result.requirements.filter(r => r.status === 'implemented')) {
        lines.push(this.formatImplementedReq(status));
      }
      lines.push('');
    }

    // 미구현 요구사항
    if (result.missing.length > 0) {
      lines.push(this.error(`✗ 미구현 (${result.missing.length}/${result.totalRequirements})`));
      for (const reqId of result.missing) {
        const status = result.requirements.find(r => r.id === reqId);
        lines.push(`  - ${reqId}${status?.title ? `: ${status.title}` : ''}`);
      }
      lines.push('');
    }

    // 고아 코드
    if (result.orphans.length > 0) {
      lines.push(this.warning(`⚠ 스펙 없는 코드 (${result.orphans.length}개)`));
      for (const orphan of result.orphans) {
        lines.push(`  - ${orphan.file}:${orphan.line} (${orphan.text || 'orphan'})`);
      }
      lines.push('');
    }

    // 동기화율
    const rateColor = result.syncRate >= 80 ? 'green' : result.syncRate >= 50 ? 'yellow' : 'red';
    lines.push(
      this.colorize(
        `동기화율: ${result.syncRate}% (${result.totalImplemented}/${result.totalRequirements})`,
        rateColor
      )
    );

    return lines.join('\n');
  }

  /**
   * JSON 출력용 포맷
   */
  formatJson(result: SyncResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * 마크다운 출력용 포맷
   */
  formatMarkdown(result: SyncResult): string {
    const lines: string[] = [];

    lines.push('# SDD Sync 리포트');
    lines.push('');
    lines.push(`> 생성일: ${new Date().toISOString().split('T')[0]}`);
    lines.push('');

    // 요약
    lines.push('## 요약');
    lines.push('');
    lines.push(`| 지표 | 값 |`);
    lines.push(`|------|-----|`);
    lines.push(`| 스펙 수 | ${result.specs.length}개 |`);
    lines.push(`| 요구사항 수 | ${result.totalRequirements}개 |`);
    lines.push(`| 구현됨 | ${result.totalImplemented}개 |`);
    lines.push(`| 미구현 | ${result.missing.length}개 |`);
    lines.push(`| 동기화율 | ${result.syncRate}% |`);
    lines.push('');

    // 스펙별 현황
    lines.push('## 스펙별 현황');
    lines.push('');
    lines.push('| 스펙 | 요구사항 | 구현 | 미구현 | 동기화율 |');
    lines.push('|------|----------|------|--------|----------|');
    for (const spec of result.specs) {
      lines.push(
        `| ${spec.id} | ${spec.requirementCount} | ${spec.implementedCount} | ${spec.missingCount} | ${spec.syncRate}% |`
      );
    }
    lines.push('');

    // 구현된 요구사항
    if (result.implemented.length > 0) {
      lines.push('## 구현된 요구사항');
      lines.push('');
      for (const status of result.requirements.filter(r => r.status === 'implemented')) {
        lines.push(`### ${status.id}${status.title ? `: ${status.title}` : ''}`);
        lines.push('');
        if (status.locations.length > 0) {
          lines.push('**참조 위치:**');
          for (const loc of status.locations) {
            lines.push(`- \`${loc.file}:${loc.line}\` (${loc.type})`);
          }
        }
        lines.push('');
      }
    }

    // 미구현 요구사항
    if (result.missing.length > 0) {
      lines.push('## 미구현 요구사항');
      lines.push('');
      for (const reqId of result.missing) {
        const status = result.requirements.find(r => r.id === reqId);
        lines.push(`- **${reqId}**${status?.title ? `: ${status.title}` : ''}`);
      }
      lines.push('');
    }

    // 고아 코드
    if (result.orphans.length > 0) {
      lines.push('## 스펙 없는 코드');
      lines.push('');
      lines.push('> 다음 코드들은 스펙에 없는 REQ-xxx를 참조하고 있습니다.');
      lines.push('');
      for (const orphan of result.orphans) {
        lines.push(`- \`${orphan.file}:${orphan.line}\`: ${orphan.text || ''}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 구현된 요구사항 포맷
   */
  private formatImplementedReq(status: RequirementStatus): string {
    const title = status.title ? `: ${status.title}` : '';
    const locations = status.locations
      .slice(0, 2)
      .map(loc => `${loc.file}:${loc.line}`)
      .join(', ');
    const more = status.locations.length > 2 ? ` +${status.locations.length - 2}` : '';

    return `  - ${status.id}${title} ${this.gray(`(${locations}${more})`)}`;
  }

  /**
   * 컬러 적용
   */
  private colorize(text: string, color: keyof typeof colors): string {
    if (!this.useColors) return text;
    return `${colors[color]}${text}${colors.reset}`;
  }

  private header(text: string): string {
    return this.colorize(`=== ${text} ===`, 'bold');
  }

  private success(text: string): string {
    return this.colorize(text, 'green');
  }

  private error(text: string): string {
    return this.colorize(text, 'red');
  }

  private warning(text: string): string {
    return this.colorize(text, 'yellow');
  }

  private gray(text: string): string {
    return this.colorize(text, 'gray');
  }
}
