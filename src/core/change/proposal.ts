/**
 * Proposal 파서 및 생성기
 */
import matter from 'gray-matter';
import { z } from 'zod';
import {
  ChangeStatus,
  DeltaType,
  ImpactLevel,
} from './schemas.js';
import { success, failure, Result } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';

/**
 * Proposal 파싱 결과
 */
export interface ParsedProposal {
  metadata: {
    id: string;
    status: ChangeStatus;
    created: string;
    updated?: string;
    target?: string;
  };
  title: string;
  rationale: string;
  affectedSpecs: string[];
  changeType: DeltaType[];
  summary: string;
  riskLevel: ImpactLevel;
  complexity: ImpactLevel;
  rawContent: string;
}

/**
 * Proposal 메타데이터 전처리
 */
const PreprocessedProposalMetadataSchema = z.object({
  id: z.string().regex(/^CHG-\d{3,}$/, 'ID 형식: CHG-XXX'),
  status: z.preprocess(
    (val) => (typeof val === 'string' ? val : 'draft'),
    z.enum(['draft', 'proposed', 'approved', 'applied', 'archived', 'rejected'])
  ),
  created: z.preprocess(
    (val) => {
      if (val instanceof Date) {
        return val.toISOString().split('T')[0];
      }
      return val;
    },
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식: YYYY-MM-DD')
  ),
  updated: z.preprocess(
    (val) => {
      if (val instanceof Date) {
        return val.toISOString().split('T')[0];
      }
      return val;
    },
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  ),
  target: z.string().optional(),
});

/**
 * Proposal 파싱
 */
export function parseProposal(content: string): Result<ParsedProposal, ChangeError> {
  try {
    const { data: frontmatter, content: body } = matter(content);

    // 메타데이터 검증
    const metadataResult = PreprocessedProposalMetadataSchema.safeParse(frontmatter);
    if (!metadataResult.success) {
      return failure(
        new ChangeError(`Proposal 메타데이터 오류: ${metadataResult.error.message}`)
      );
    }

    // 제목 추출 (첫 번째 # 헤더)
    const titleMatch = body.match(/^#\s+(?:변경\s+제안:\s*)?(.+)$/m);
    const title = titleMatch?.[1]?.trim() || '';

    // 배경/이유 추출
    const rationaleMatch = body.match(/##\s*배경\s*([\s\S]*?)(?=\n##|$)/i);
    const rationale = rationaleMatch?.[1]?.trim() || '';

    // 영향받는 스펙 추출
    const specsMatch = body.match(/##\s*영향\s*범위[\s\S]*?영향받는\s*스펙\s*([\s\S]*?)(?=\n###|\n##|$)/i);
    const affectedSpecs: string[] = [];
    if (specsMatch) {
      const specLines = specsMatch[1].match(/`([^`]+)`/g);
      if (specLines) {
        specLines.forEach((line) => {
          affectedSpecs.push(line.replace(/`/g, ''));
        });
      }
    }

    // 변경 유형 추출
    const changeType: DeltaType[] = [];
    if (body.includes('[x] 신규 추가') || body.includes('[X] 신규 추가')) {
      changeType.push('ADDED');
    }
    if (body.includes('[x] 수정') || body.includes('[X] 수정')) {
      changeType.push('MODIFIED');
    }
    if (body.includes('[x] 삭제') || body.includes('[X] 삭제')) {
      changeType.push('REMOVED');
    }

    // 변경 내용 요약 추출
    const summaryMatch = body.match(/##\s*변경\s*내용\s*([\s\S]*?)(?=\n##|$)/i);
    const summary = summaryMatch?.[1]?.trim() || '';

    // 리스크 평가 추출
    const riskMatch = body.match(/영향도:\s*(낮음|중간|높음)/i);
    const riskLevel: ImpactLevel = riskMatch
      ? (riskMatch[1] === '낮음' ? 'low' : riskMatch[1] === '높음' ? 'high' : 'medium')
      : 'medium';

    const complexityMatch = body.match(/복잡도:\s*(낮음|중간|높음)/i);
    const complexity: ImpactLevel = complexityMatch
      ? (complexityMatch[1] === '낮음' ? 'low' : complexityMatch[1] === '높음' ? 'high' : 'medium')
      : 'medium';

    return success({
      metadata: metadataResult.data,
      title,
      rationale,
      affectedSpecs,
      changeType,
      summary,
      riskLevel,
      complexity,
      rawContent: body,
    });
  } catch (error) {
    return failure(
      new ChangeError(
        `Proposal 파싱 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * Proposal 생성 옵션
 */
export interface GenerateProposalOptions {
  id: string;
  title: string;
  rationale?: string;
  affectedSpecs?: string[];
  changeType?: DeltaType[];
}

/**
 * Proposal 템플릿 생성
 */
export function generateProposal(options: GenerateProposalOptions): string {
  const today = new Date().toISOString().split('T')[0];
  const specs = options.affectedSpecs || [];
  const types = options.changeType || ['MODIFIED'];

  return `---
id: ${options.id}
status: draft
created: ${today}
---

# 변경 제안: ${options.title}

> ${options.rationale || '변경 목적 및 배경 설명'}

---

## 배경

${options.rationale || '왜 이 변경이 필요한가?'}

---

## 영향 범위

### 영향받는 스펙

${specs.length > 0 ? specs.map((s) => `- \`${s}\``).join('\n') : '- `specs/{{SPEC_PATH}}`'}

### 변경 유형

- [${types.includes('ADDED') ? 'x' : ' '}] 신규 추가 (ADDED)
- [${types.includes('MODIFIED') ? 'x' : ' '}] 수정 (MODIFIED)
- [${types.includes('REMOVED') ? 'x' : ' '}] 삭제 (REMOVED)

---

## 변경 내용

### ADDED

(새로 추가되는 내용)

### MODIFIED

#### Before

\`\`\`markdown
기존 내용
\`\`\`

#### After

\`\`\`markdown
변경된 내용
\`\`\`

### REMOVED

(삭제되는 내용)

---

## 리스크 평가

- 영향도: 중간
- 복잡도: 중간
`;
}

/**
 * Proposal 상태 업데이트
 */
export function updateProposalStatus(
  content: string,
  newStatus: ChangeStatus
): Result<string, ChangeError> {
  try {
    const { data: frontmatter, content: body } = matter(content);
    const today = new Date().toISOString().split('T')[0];

    const updatedFrontmatter = {
      ...frontmatter,
      status: newStatus,
      updated: today,
    };

    return success(matter.stringify(body, updatedFrontmatter));
  } catch (error) {
    return failure(
      new ChangeError(
        `상태 업데이트 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}
