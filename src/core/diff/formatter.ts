/**
 * Diff 출력 포매터
 */
import type { DiffResult, RequirementDiff, ScenarioDiff, KeywordChange } from './schemas.js';

interface FormatterOptions {
  colors?: boolean;
  stat?: boolean;
  nameOnly?: boolean;
}

/**
 * ANSI 컬러 코드
 */
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

export class DiffFormatter {
  private options: FormatterOptions;

  constructor(options: FormatterOptions = {}) {
    this.options = {
      colors: options.colors ?? true,
      stat: options.stat ?? false,
      nameOnly: options.nameOnly ?? false,
    };
  }

  /**
   * 컬러 적용
   */
  private c(color: keyof typeof colors, text: string): string {
    if (!this.options.colors) return text;
    return `${colors[color]}${text}${colors.reset}`;
  }

  /**
   * 터미널 출력 포맷
   */
  formatTerminal(result: DiffResult): string {
    if (result.files.length === 0) {
      return this.c('gray', '변경된 스펙 파일이 없습니다.');
    }

    if (this.options.nameOnly) {
      return this.formatNameOnly(result);
    }

    if (this.options.stat) {
      return this.formatStat(result);
    }

    return this.formatFull(result);
  }

  /**
   * 파일명만 출력
   */
  private formatNameOnly(result: DiffResult): string {
    return result.files.map(f => f.file).join('\n');
  }

  /**
   * 통계 요약 출력
   */
  private formatStat(result: DiffResult): string {
    const lines: string[] = [];

    lines.push(this.c('bold', '=== SDD Diff --stat ==='));
    lines.push('');

    for (const file of result.files) {
      lines.push(this.c('cyan', file.file));

      const reqAdded = file.requirements.filter(r => r.type === 'added').length;
      const reqModified = file.requirements.filter(r => r.type === 'modified').length;
      const reqRemoved = file.requirements.filter(r => r.type === 'removed').length;

      const scenAdded = file.scenarios.filter(s => s.type === 'added').length;
      const scenModified = file.scenarios.filter(s => s.type === 'modified').length;
      const scenRemoved = file.scenarios.filter(s => s.type === 'removed').length;

      if (reqAdded + reqModified + reqRemoved > 0) {
        lines.push(`  요구사항: ${this.c('green', `+${reqAdded}`)}, ${this.c('yellow', `~${reqModified}`)}, ${this.c('red', `-${reqRemoved}`)}`);
      }

      if (scenAdded + scenModified + scenRemoved > 0) {
        lines.push(`  시나리오: ${this.c('green', `+${scenAdded}`)}, ${this.c('yellow', `~${scenModified}`)}, ${this.c('red', `-${scenRemoved}`)}`);
      }

      if (file.keywordChanges.length > 0) {
        const strengthened = file.keywordChanges.filter(k => k.impact === 'strengthened').length;
        const weakened = file.keywordChanges.filter(k => k.impact === 'weakened').length;
        lines.push(`  키워드 변경: ${file.keywordChanges.length}개 (강화: ${strengthened}, 약화: ${weakened})`);
      }

      lines.push('');
    }

    // 총 요약
    const { summary } = result;
    lines.push(this.c('bold', '총 변경:'));
    lines.push(`  ${summary.totalFiles}개 파일`);
    lines.push(`  요구사항: ${this.c('green', `+${summary.addedRequirements}`)} ${this.c('yellow', `~${summary.modifiedRequirements}`)} ${this.c('red', `-${summary.removedRequirements}`)}`);
    lines.push(`  시나리오: ${this.c('green', `+${summary.addedScenarios}`)} ${this.c('yellow', `~${summary.modifiedScenarios}`)} ${this.c('red', `-${summary.removedScenarios}`)}`);

    if (summary.keywordChanges > 0) {
      lines.push(`  키워드 변경: ${this.c('magenta', `${summary.keywordChanges}개`)}`);
    }

    return lines.join('\n');
  }

  /**
   * 전체 diff 출력
   */
  private formatFull(result: DiffResult): string {
    const lines: string[] = [];

    lines.push(this.c('bold', '=== SDD Diff ==='));
    lines.push('');

    for (const file of result.files) {
      lines.push(this.c('cyan', file.file));
      lines.push('');

      // 요구사항 변경
      if (file.requirements.length > 0) {
        lines.push(this.c('bold', '  요구사항 변경:'));
        for (const req of file.requirements) {
          lines.push(...this.formatRequirementDiff(req));
        }
        lines.push('');
      }

      // 시나리오 변경
      if (file.scenarios.length > 0) {
        lines.push(this.c('bold', '  시나리오 변경:'));
        for (const scen of file.scenarios) {
          lines.push(...this.formatScenarioDiff(scen));
        }
        lines.push('');
      }

      // 키워드 변경
      if (file.keywordChanges.length > 0) {
        lines.push(this.c('bold', '  키워드 변경:'));
        for (const kw of file.keywordChanges) {
          lines.push(this.formatKeywordChange(kw));
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * 요구사항 diff 포맷
   */
  private formatRequirementDiff(req: RequirementDiff): string[] {
    const lines: string[] = [];
    const prefix = req.type === 'added' ? '+' : req.type === 'removed' ? '-' : '~';
    const color = req.type === 'added' ? 'green' : req.type === 'removed' ? 'red' : 'yellow';

    lines.push(this.c(color, `  ${prefix} ${req.id}: ${req.title || ''}`));

    if (req.type === 'modified' && req.before && req.after) {
      // 변경 내용 표시 (간략화)
      const beforeLines = req.before.split('\n').slice(0, 2);
      const afterLines = req.after.split('\n').slice(0, 2);

      for (const line of beforeLines) {
        if (line.trim()) {
          lines.push(this.c('red', `    - ${line.trim()}`));
        }
      }
      for (const line of afterLines) {
        if (line.trim()) {
          lines.push(this.c('green', `    + ${line.trim()}`));
        }
      }
    } else if (req.type === 'added' && req.after) {
      const afterLines = req.after.split('\n').slice(0, 2);
      for (const line of afterLines) {
        if (line.trim()) {
          lines.push(this.c('green', `    + ${line.trim()}`));
        }
      }
    } else if (req.type === 'removed' && req.before) {
      const beforeLines = req.before.split('\n').slice(0, 2);
      for (const line of beforeLines) {
        if (line.trim()) {
          lines.push(this.c('red', `    - ${line.trim()}`));
        }
      }
    }

    return lines;
  }

  /**
   * 시나리오 diff 포맷
   */
  private formatScenarioDiff(scen: ScenarioDiff): string[] {
    const lines: string[] = [];
    const prefix = scen.type === 'added' ? '+' : scen.type === 'removed' ? '-' : '~';
    const color = scen.type === 'added' ? 'green' : scen.type === 'removed' ? 'red' : 'yellow';

    lines.push(this.c(color, `  ${prefix} ${scen.name}`));

    // GIVEN/WHEN/THEN 표시
    const content = scen.after || scen.before || '';
    const gwt = content.match(/\*\*(GIVEN|WHEN|THEN)\*\*\s*(.+)/gi);
    if (gwt) {
      for (const match of gwt.slice(0, 3)) {
        lines.push(this.c('gray', `    ${match.trim()}`));
      }
    }

    return lines;
  }

  /**
   * 키워드 변경 포맷
   */
  private formatKeywordChange(kw: KeywordChange): string {
    const impactEmoji = kw.impact === 'strengthened' ? '⚠️' : kw.impact === 'weakened' ? '⚡' : '🔄';
    const impactText = kw.impact === 'strengthened' ? '강화' : kw.impact === 'weakened' ? '약화' : '변경';
    const impactColor = kw.impact === 'strengthened' ? 'yellow' : kw.impact === 'weakened' ? 'magenta' : 'blue';

    return `    ${impactEmoji} ${kw.reqId}: ${this.c('red', kw.before)} → ${this.c('green', kw.after)} (${this.c(impactColor, impactText)})`;
  }

  /**
   * JSON 출력 포맷
   */
  formatJson(result: DiffResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * 마크다운 출력 포맷
   */
  formatMarkdown(result: DiffResult): string {
    const lines: string[] = [];

    lines.push('# SDD Diff 리포트');
    lines.push('');

    // 요약
    lines.push('## 요약');
    lines.push('');
    lines.push('| 항목 | 값 |');
    lines.push('|------|-----|');
    lines.push(`| 변경된 파일 | ${result.summary.totalFiles}개 |`);
    lines.push(`| 추가된 요구사항 | ${result.summary.addedRequirements}개 |`);
    lines.push(`| 수정된 요구사항 | ${result.summary.modifiedRequirements}개 |`);
    lines.push(`| 삭제된 요구사항 | ${result.summary.removedRequirements}개 |`);
    lines.push(`| 추가된 시나리오 | ${result.summary.addedScenarios}개 |`);
    lines.push(`| 수정된 시나리오 | ${result.summary.modifiedScenarios}개 |`);
    lines.push(`| 삭제된 시나리오 | ${result.summary.removedScenarios}개 |`);
    lines.push(`| 키워드 변경 | ${result.summary.keywordChanges}개 |`);
    lines.push('');

    // 파일별 상세
    for (const file of result.files) {
      lines.push(`## ${file.file}`);
      lines.push('');

      if (file.requirements.length > 0) {
        lines.push('### 요구사항 변경');
        lines.push('');
        for (const req of file.requirements) {
          const emoji = req.type === 'added' ? '➕' : req.type === 'removed' ? '➖' : '✏️';
          lines.push(`- ${emoji} **${req.id}**: ${req.title || ''}`);
        }
        lines.push('');
      }

      if (file.scenarios.length > 0) {
        lines.push('### 시나리오 변경');
        lines.push('');
        for (const scen of file.scenarios) {
          const emoji = scen.type === 'added' ? '➕' : scen.type === 'removed' ? '➖' : '✏️';
          lines.push(`- ${emoji} **${scen.name}**`);
        }
        lines.push('');
      }

      if (file.keywordChanges.length > 0) {
        lines.push('### 키워드 변경');
        lines.push('');
        for (const kw of file.keywordChanges) {
          const emoji = kw.impact === 'strengthened' ? '⚠️' : kw.impact === 'weakened' ? '⚡' : '🔄';
          lines.push(`- ${emoji} **${kw.reqId}**: \`${kw.before}\` → \`${kw.after}\``);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}
