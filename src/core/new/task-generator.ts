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

각 작업 완료 시:
1. [ ] 코드 작성 완료
2. [ ] 테스트 작성 및 통과
3. [ ] 코드 리뷰 완료
4. [ ] 문서 업데이트

---

## 다음 단계

1. 첫 번째 작업부터 순차적으로 진행
2. 각 작업 완료 후 상태 업데이트
3. 모든 작업 완료 시 \`/sdd:archive\` 실행
`;

  return content;
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

    // 상태 추출
    const statusMatch = body.match(/\*\*상태:\*\*\s*(\S+)/);
    let status: TaskStatus = 'pending';
    if (statusMatch) {
      const statusText = statusMatch[1].toLowerCase();
      if (statusText.includes('진행') || statusText === 'in_progress') {
        status = 'in_progress';
      } else if (statusText.includes('완료') || statusText === 'completed') {
        status = 'completed';
      } else if (statusText.includes('차단') || statusText === 'blocked') {
        status = 'blocked';
      }
    }

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
  const statusText = newStatus === 'pending' ? '대기'
    : newStatus === 'in_progress' ? '진행 중'
    : newStatus === 'completed' ? '완료'
    : '차단됨';

  // 작업 상태 업데이트
  const taskRegex = new RegExp(
    `(### ${taskId}:[^\\n]+\\s*\\n[\\s\\S]*?\\*\\*상태:\\*\\*)\\s*\\S+`,
    'i'
  );

  let updated = content.replace(taskRegex, `$1 ${statusText}`);

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
