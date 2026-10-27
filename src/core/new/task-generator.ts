/**
 * 작업 분해 생성기
 */
import { TaskItem, TaskStatus, TaskPriority, generateTaskId } from './schemas.js';

/**
 * 작업 생성 옵션
 */
export interface GenerateTasksOptions {
  featureId: string;
  featureTitle: string;
  tasks: Array<{
    title: string;
    description?: string;
    priority?: TaskPriority;
    files?: string[];
    dependencies?: string[];
  }>;
}

/**
 * tasks.md 파일 내용 생성
 */
export function generateTasks(options: GenerateTasksOptions): string {
  const today = new Date().toISOString().split('T')[0];

  let content = `---
feature: ${options.featureId}
created: ${today}
total: ${options.tasks.length}
completed: 0
---

# 작업 목록: ${options.featureTitle}

> 총 ${options.tasks.length}개 작업

---

## 진행 상황

- 대기: ${options.tasks.length}
- 진행 중: 0
- 완료: 0
- 차단됨: 0

---

## 작업 목록

`;

  options.tasks.forEach((task, index) => {
    const taskId = generateTaskId(options.featureId, index + 1);
    const priority = task.priority || 'medium';
    const priorityIcon = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';

    content += `### ${taskId}: ${task.title}

- **상태:** 대기
- **우선순위:** ${priorityIcon} ${priority.toUpperCase()}
`;

    if (task.description) {
      content += `- **설명:** ${task.description}
`;
    }

    if (task.files?.length) {
      content += `- **관련 파일:**
${task.files.map(f => `  - \`${f}\``).join('\n')}
`;
    }

    if (task.dependencies?.length) {
      content += `- **의존성:** ${task.dependencies.join(', ')}
`;
    }

    content += '\n';
  });

  content += `---

## 완료 조건

각 작업 완료 시 (테스트 우선):
1. [ ] 실패하는 테스트 먼저 작성 (Red)
2. [ ] 테스트를 통과하는 구현 작성 (Green)
3. [ ] 리팩터링 후 테스트 재통과 (Refactor)
4. [ ] 코드 리뷰 완료
5. [ ] 문서 업데이트

---

## 다음 단계

1. 첫 번째 작업부터 순차적으로 진행 (Claude Code: \`/sdd-implement\`, Codex: \`$sdd-implement\`)
2. 각 작업 완료 후 상태 업데이트 (대기 · 진행 중 · 완료 · 차단됨)
3. 모든 작업 완료 시 \`sdd validate\`와 \`sdd sync\`로 명세 검증 및 추적성 확인 (Claude Code: \`/sdd-validate\`, Codex: \`$sdd-validate\`)
`;

  return content;
}

/**
 * Task status line: Korean (`**상태:**`) or English (`**Status:**`) label.
 * Group 1 = label, group 2 = raw value (rest of the line).
 */
const STATUS_LINE_PATTERN = /\*\*(상태|status):\*\*[ \t]*([^\n]*)/i;

/**
 * Accepted status values (case-insensitive) mapped to the internal enum.
 */
const STATUS_ALIASES: Record<string, TaskStatus> = {
  pending: 'pending',
  대기: 'pending',
  'in-progress': 'in_progress',
  in_progress: 'in_progress',
  '진행 중': 'in_progress',
  진행중: 'in_progress',
  진행: 'in_progress',
  completed: 'completed',
  완료: 'completed',
  blocked: 'blocked',
  차단됨: 'blocked',
};

/**
 * Normalize a raw status value to the internal enum; undefined when unrecognized.
 * Trailing notes are tolerated (e.g. `완료 (2026-10-27)`, `in-progress - reviewing`).
 */
export function normalizeTaskStatus(raw: string): TaskStatus | undefined {
  const value = raw.trim().replace(/\s+/g, ' ').toLowerCase();
  const tokens = value.split(' ');
  for (const candidate of [value, tokens.slice(0, 2).join(' '), tokens[0]]) {
    const status = STATUS_ALIASES[candidate];
    if (status) return status;
  }
  return undefined;
}

/**
 * Status text written back to the file, matching the label language in use.
 */
function formatTaskStatus(status: TaskStatus, english: boolean): string {
  if (english) {
    return status === 'in_progress' ? 'in-progress' : status;
  }
  return status === 'pending' ? '대기'
    : status === 'in_progress' ? '진행 중'
    : status === 'completed' ? '완료'
    : '차단됨';
}

/**
 * 작업 목록 파싱
 */
export function parseTasks(content: string): TaskItem[] {
  const tasks: TaskItem[] = [];
  const taskMatches = content.matchAll(/### ([a-z0-9-]+): ([^\n]+)\s*\n([\s\S]*?)(?=\n###|\n---|$)/gi);

  for (const match of taskMatches) {
    const id = match[1];
    const title = match[2];
    const body = match[3];

    // 상태 추출 (`**상태:**` / `**Status:**`)
    const statusMatch = body.match(STATUS_LINE_PATTERN);
    const status: TaskStatus = statusMatch
      ? normalizeTaskStatus(statusMatch[2]) ?? 'pending'
      : 'pending';

    // 우선순위 추출
    const priorityMatch = body.match(/\*\*우선순위:\*\*\s*(?:[🔴🟡🟢]\s*)?([A-Za-z]+)/u);
    let priority: TaskPriority = 'medium';
    if (priorityMatch) {
      const p = priorityMatch[1].toLowerCase();
      if (p === 'high' || p === '높음') priority = 'high';
      else if (p === 'low' || p === '낮음') priority = 'low';
    }

    // 설명 추출
    const descMatch = body.match(/\*\*설명:\*\*\s*([^\n]+)/);
    const description = descMatch ? descMatch[1] : undefined;

    // 파일 추출
    const filesMatch = body.match(/\*\*관련 파일:\*\*\s*\n([\s\S]*?)(?=\n-\s*\*\*|\n\n|$)/);
    const files = filesMatch
      ? filesMatch[1]
          .split('\n')
          .filter(l => l.includes('`'))
          .map(l => l.match(/`([^`]+)`/)?.[1] || '')
          .filter(Boolean)
      : undefined;

    // 의존성 추출
    const depsMatch = body.match(/\*\*의존성:\*\*\s*([^\n]+)/);
    const dependencies = depsMatch
      ? depsMatch[1].split(',').map(d => d.trim()).filter(Boolean)
      : undefined;

    tasks.push({
      id,
      title,
      description,
      status,
      priority,
      files,
      dependencies,
    });
  }

  return tasks;
}

/**
 * 작업 상태 업데이트
 */
export function updateTaskStatus(
  content: string,
  taskId: string,
  newStatus: TaskStatus
): string {
  // 작업 상태 업데이트: stay within this task's section and keep the label form in the file
  const escapedId = taskId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const taskRegex = new RegExp(
    `(### ${escapedId}:[^\\n]*\\n(?:(?!#{1,3} )[^\\n]*\\n)*?[^\\n]*\\*\\*(상태|status):\\*\\*)[ \\t]*[^\\n]*`,
    'i'
  );

  let updated = content.replace(taskRegex, (_match, prefix: string, label: string) => {
    const english = label.toLowerCase() === 'status';
    return `${prefix} ${formatTaskStatus(newStatus, english)}`;
  });

  // 진행 상황 업데이트
  const tasks = parseTasks(updated);
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const blocked = tasks.filter(t => t.status === 'blocked').length;

  updated = updated.replace(
    /## 진행 상황\s*\n\n[\s\S]*?(?=\n---)/,
    `## 진행 상황

- 대기: ${pending}
- 진행 중: ${inProgress}
- 완료: ${completed}
- 차단됨: ${blocked}
`
  );

  // frontmatter completed 업데이트
  updated = updated.replace(
    /completed:\s*\d+/,
    `completed: ${completed}`
  );

  return updated;
}

/**
 * 다음 작업 가져오기
 */
export function getNextTask(tasks: TaskItem[]): TaskItem | null {
  // 진행 중인 작업이 있으면 반환
  const inProgress = tasks.find(t => t.status === 'in_progress');
  if (inProgress) return inProgress;

  // 의존성이 모두 완료된 대기 중 작업 찾기 (우선순위 순)
  const priorityOrder: TaskPriority[] = ['high', 'medium', 'low'];
  const completedIds = new Set(
    tasks.filter(t => t.status === 'completed').map(t => t.id)
  );

  for (const priority of priorityOrder) {
    const candidate = tasks.find(t => {
      if (t.status !== 'pending' || t.priority !== priority) return false;

      // 의존성 확인
      if (t.dependencies?.length) {
        return t.dependencies.every(dep => completedIds.has(dep));
      }
      return true;
    });

    if (candidate) return candidate;
  }

  return null;
}
