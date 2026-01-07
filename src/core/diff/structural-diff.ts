/**
 * 구조적 Diff - 스펙 파일의 구조적 비교
 */
import type {
  RequirementDiff,
  ScenarioDiff,
  MetadataDiff,
  SpecDiff,
} from './schemas.js';
import { extractKeywords } from './keyword-diff.js';
import type { KeywordChange } from './schemas.js';

/**
 * 파싱된 스펙 구조
 */
interface ParsedSpec {
  metadata: Record<string, unknown>;
  requirements: Map<string, { title: string; content: string }>;
  scenarios: Map<string, string>;
}

/**
 * YAML frontmatter 파싱
 */
function parseMetadata(content: string): Record<string, unknown> {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return {};

  const yaml = frontmatterMatch[1];
  const metadata: Record<string, unknown> = {};

  for (const line of yaml.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();

      // 따옴표 제거
      const cleanValue = value.replace(/^["']|["']$/g, '');
      metadata[key] = cleanValue;
    }
  }

  return metadata;
}

/**
 * 요구사항 파싱
 * 패턴: ### REQ-xxx: 제목
 */
function parseRequirements(content: string): Map<string, { title: string; content: string }> {
  const requirements = new Map<string, { title: string; content: string }>();

  // ### REQ-xxx 또는 ## REQ-xxx 패턴

  const lines = content.split('\n');
  let currentReqId: string | null = null;
  let currentTitle = '';
  let currentContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const reqMatch = line.match(/^#{2,3}\s+(REQ-\d+):?\s*(.*)$/);

    if (reqMatch) {
      // 이전 요구사항 저장
      if (currentReqId) {
        requirements.set(currentReqId, {
          title: currentTitle,
          content: currentContent.join('\n').trim(),
        });
      }

      // 새 요구사항 시작
      currentReqId = reqMatch[1];
      currentTitle = reqMatch[2] || '';
      currentContent = [];
    } else if (currentReqId) {
      // 다음 섹션 헤더면 종료
      if (line.match(/^#{1,3}\s+/) && !line.match(/^#{2,3}\s+REQ-\d+/)) {
        requirements.set(currentReqId, {
          title: currentTitle,
          content: currentContent.join('\n').trim(),
        });
        currentReqId = null;
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
  }

  // 마지막 요구사항 저장
  if (currentReqId) {
    requirements.set(currentReqId, {
      title: currentTitle,
      content: currentContent.join('\n').trim(),
    });
  }

  return requirements;
}

/**
 * 시나리오 파싱
 * 패턴: ### Scenario N: 이름 또는 Scenario: 이름
 */
function parseScenarios(content: string): Map<string, string> {
  const scenarios = new Map<string, string>();

  const lines = content.split('\n');
  let currentScenario: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const scenarioMatch = line.match(/^#{2,3}\s+Scenario\s*\d*:?\s*(.*)$/i);

    if (scenarioMatch) {
      // 이전 시나리오 저장
      if (currentScenario) {
        scenarios.set(currentScenario, currentContent.join('\n').trim());
      }

      // 새 시나리오 시작
      currentScenario = scenarioMatch[1] || `Scenario ${scenarios.size + 1}`;
      currentContent = [];
    } else if (currentScenario) {
      // 다음 섹션 헤더면 종료
      if (line.match(/^#{1,3}\s+/) && !line.match(/GIVEN|WHEN|THEN|AND/i)) {
        scenarios.set(currentScenario, currentContent.join('\n').trim());
        currentScenario = null;
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
  }

  // 마지막 시나리오 저장
  if (currentScenario) {
    scenarios.set(currentScenario, currentContent.join('\n').trim());
  }

  return scenarios;
}

/**
 * 스펙 파일 파싱
 */
function parseSpec(content: string): ParsedSpec {
  return {
    metadata: parseMetadata(content),
    requirements: parseRequirements(content),
    scenarios: parseScenarios(content),
  };
}

/**
 * 메타데이터 비교
 */
function diffMetadata(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): MetadataDiff | undefined {
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changedFields: string[] = [];

  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changedFields.push(key);
    }
  }

  if (changedFields.length === 0) {
    return undefined;
  }

  const beforeEmpty = Object.keys(before).length === 0;
  const afterEmpty = Object.keys(after).length === 0;

  return {
    type: beforeEmpty ? 'added' : afterEmpty ? 'removed' : 'modified',
    before: beforeEmpty ? undefined : before,
    after: afterEmpty ? undefined : after,
    changedFields,
  };
}

/**
 * 요구사항 비교
 */
function diffRequirements(
  before: Map<string, { title: string; content: string }>,
  after: Map<string, { title: string; content: string }>
): RequirementDiff[] {
  const diffs: RequirementDiff[] = [];
  const allIds = new Set([...before.keys(), ...after.keys()]);

  for (const id of allIds) {
    const beforeReq = before.get(id);
    const afterReq = after.get(id);

    if (!beforeReq && afterReq) {
      // 추가됨
      diffs.push({
        id,
        type: 'added',
        title: afterReq.title,
        after: afterReq.content,
      });
    } else if (beforeReq && !afterReq) {
      // 삭제됨
      diffs.push({
        id,
        type: 'removed',
        title: beforeReq.title,
        before: beforeReq.content,
      });
    } else if (beforeReq && afterReq) {
      // 수정 여부 확인
      const beforeFull = `${beforeReq.title}\n${beforeReq.content}`;
      const afterFull = `${afterReq.title}\n${afterReq.content}`;

      if (beforeFull !== afterFull) {
        diffs.push({
          id,
          type: 'modified',
          title: afterReq.title || beforeReq.title,
          before: beforeReq.content,
          after: afterReq.content,
        });
      }
    }
  }

  return diffs.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * 시나리오 비교
 */
function diffScenarios(
  before: Map<string, string>,
  after: Map<string, string>
): ScenarioDiff[] {
  const diffs: ScenarioDiff[] = [];
  const allNames = new Set([...before.keys(), ...after.keys()]);

  for (const name of allNames) {
    const beforeScenario = before.get(name);
    const afterScenario = after.get(name);

    if (!beforeScenario && afterScenario) {
      diffs.push({
        name,
        type: 'added',
        after: afterScenario,
      });
    } else if (beforeScenario && !afterScenario) {
      diffs.push({
        name,
        type: 'removed',
        before: beforeScenario,
      });
    } else if (beforeScenario && afterScenario && beforeScenario !== afterScenario) {
      diffs.push({
        name,
        type: 'modified',
        before: beforeScenario,
        after: afterScenario,
      });
    }
  }

  return diffs;
}

/**
 * 키워드 변경 감지
 */
function diffKeywords(
  beforeReqs: Map<string, { title: string; content: string }>,
  afterReqs: Map<string, { title: string; content: string }>
): KeywordChange[] {
  const changes: KeywordChange[] = [];

  for (const [id, afterReq] of afterReqs) {
    const beforeReq = beforeReqs.get(id);
    if (!beforeReq) continue;

    const beforeKeywords = extractKeywords(beforeReq.content);
    const afterKeywords = extractKeywords(afterReq.content);

    // 키워드 변경 감지 (간단하게 첫 번째 키워드만 비교)
    if (beforeKeywords.length > 0 && afterKeywords.length > 0) {
      const beforeMain = beforeKeywords[0];
      const afterMain = afterKeywords[0];

      if (beforeMain !== afterMain) {
        changes.push({
          reqId: id,
          before: beforeMain,
          after: afterMain,
          impact: getKeywordImpact(beforeMain, afterMain),
        });
      }
    }
  }

  return changes;
}

/**
 * 키워드 변경 영향도 판단
 */
function getKeywordImpact(
  before: string,
  after: string
): 'strengthened' | 'weakened' | 'changed' {
  const strength: Record<string, number> = {
    'SHALL': 3,
    'MUST': 3,
    'REQUIRED': 3,
    'SHALL NOT': 3,
    'MUST NOT': 3,
    'SHOULD': 2,
    'RECOMMENDED': 2,
    'SHOULD NOT': 2,
    'MAY': 1,
    'OPTIONAL': 1,
  };

  const beforeStrength = strength[before] || 0;
  const afterStrength = strength[after] || 0;

  if (afterStrength > beforeStrength) return 'strengthened';
  if (afterStrength < beforeStrength) return 'weakened';
  return 'changed';
}

/**
 * 두 스펙 파일 내용을 구조적으로 비교
 */
export function compareSpecs(
  beforeContent: string | undefined,
  afterContent: string | undefined,
  filePath: string
): SpecDiff {
  const beforeSpec = beforeContent ? parseSpec(beforeContent) : {
    metadata: {},
    requirements: new Map(),
    scenarios: new Map(),
  };

  const afterSpec = afterContent ? parseSpec(afterContent) : {
    metadata: {},
    requirements: new Map(),
    scenarios: new Map(),
  };

  return {
    file: filePath,
    requirements: diffRequirements(beforeSpec.requirements, afterSpec.requirements),
    scenarios: diffScenarios(beforeSpec.scenarios, afterSpec.scenarios),
    metadata: diffMetadata(beforeSpec.metadata, afterSpec.metadata),
    keywordChanges: diffKeywords(beforeSpec.requirements, afterSpec.requirements),
  };
}
