/**
 * CHANGELOG 관리
 */
import { ChangelogEntry, ChangeType, bumpVersion, type VersionBumpType } from './schemas.js';
import { Result, success, failure } from '../../types/index.js';
import { ValidationError, ErrorCode } from '../../errors/index.js';

/**
 * CHANGELOG 헤더
 */
const CHANGELOG_HEADER = `# Constitution Changelog

All notable changes to the Constitution will be documented in this file.

`;

/**
 * CHANGELOG 생성
 */
export function generateChangelog(entries: ChangelogEntry[]): string {
  let content = CHANGELOG_HEADER;

  for (const entry of entries) {
    content += formatChangelogEntry(entry);
    content += '\n---\n\n';
  }

  return content;
}

/**
 * CHANGELOG 항목 포맷팅
 */
export function formatChangelogEntry(entry: ChangelogEntry): string {
  let content = `## [${entry.version}] - ${entry.date}\n\n`;

  // 변경 유형별 그룹화
  const grouped: Record<ChangeType, string[]> = {
    added: [],
    changed: [],
    deprecated: [],
    removed: [],
    fixed: [],
  };

  for (const change of entry.changes) {
    grouped[change.type].push(change.description);
  }

  // 그룹별 출력
  const typeLabels: Record<ChangeType, string> = {
    added: 'Added',
    changed: 'Changed',
    deprecated: 'Deprecated',
    removed: 'Removed',
    fixed: 'Fixed',
  };

  for (const [type, items] of Object.entries(grouped)) {
    if (items.length > 0) {
      content += `### ${typeLabels[type as ChangeType]}\n`;
      for (const item of items) {
        content += `- ${item}\n`;
      }
      content += '\n';
    }
  }

  // 변경 사유
  if (entry.reason) {
    content += `### Reason\n- ${entry.reason}\n\n`;
  }

  return content;
}

/**
 * CHANGELOG 파싱
 */
export function parseChangelog(content: string): Result<ChangelogEntry[], ValidationError> {
  const entries: ChangelogEntry[] = [];

  // ## [version] - date 형태 찾기
  const entryRegex = /##\s+\[(\d+\.\d+\.\d+)\]\s+-\s+(\d{4}-\d{2}-\d{2})([\s\S]*?)(?=\n##\s+\[|\n---|\n$)/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(content)) !== null) {
    const version = match[1];
    const date = match[2];
    const entryContent = match[3];

    const changes: { type: ChangeType; description: string }[] = [];
    let reason: string | undefined;

    // 변경 유형별 파싱
    const typeRegex = /###\s+(Added|Changed|Deprecated|Removed|Fixed|Reason)\n([\s\S]*?)(?=\n###|\n##|\n---|\n$)/gi;
    let typeMatch: RegExpExecArray | null;

    while ((typeMatch = typeRegex.exec(entryContent)) !== null) {
      const typeLabel = typeMatch[1].toLowerCase();
      const typeContent = typeMatch[2];

      if (typeLabel === 'reason') {
        const reasonMatch = typeContent.match(/-\s+(.+)/);
        if (reasonMatch) {
          reason = reasonMatch[1].trim();
        }
      } else {
        // 항목 추출
        const itemRegex = /-\s+(.+?)(?:\n|$)/g;
        let itemMatch: RegExpExecArray | null;

        while ((itemMatch = itemRegex.exec(typeContent)) !== null) {
          changes.push({
            type: typeLabel as ChangeType,
            description: itemMatch[1].trim(),
          });
        }
      }
    }

    entries.push({ version, date, changes, reason });
  }

  return success(entries);
}

/**
 * 새 CHANGELOG 항목 생성
 */
export function createChangelogEntry(
  currentVersion: string,
  bumpType: VersionBumpType,
  changes: { type: ChangeType; description: string }[],
  reason?: string
): ChangelogEntry {
  const newVersion = bumpVersion(currentVersion, bumpType);
  const today = new Date().toISOString().split('T')[0];

  return {
    version: newVersion,
    date: today,
    changes,
    reason,
  };
}

/**
 * 버전 범프 유형 추천
 */
export function suggestBumpType(changes: { type: ChangeType; description: string }[]): VersionBumpType {
  // removed나 breaking change가 있으면 MAJOR
  for (const change of changes) {
    if (change.type === 'removed') return 'major';
    if (change.description.toLowerCase().includes('breaking')) return 'major';
    // 기존 규칙 변경도 MAJOR
    if (change.type === 'changed' &&
        (change.description.includes('→') || change.description.includes('->'))) {
      return 'major';
    }
  }

  // added가 있으면 MINOR
  if (changes.some((c) => c.type === 'added')) return 'minor';

  // 그 외 PATCH
  return 'patch';
}
