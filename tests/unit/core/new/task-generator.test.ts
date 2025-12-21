/**
 * 작업 분해 생성기 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  generateTasks,
  parseTasks,
  updateTaskStatus,
  getNextTask,
} from '../../../../src/core/new/task-generator.js';

describe('generateTasks', () => {
  it('작업 목록 파일을 생성한다', () => {
    const content = generateTasks({
      featureId: 'auth-login',
      featureTitle: '로그인 기능',
      tasks: [
        { title: '로그인 폼 구현', priority: 'high' },
        { title: '유효성 검증 추가', priority: 'medium' },
      ],
    });

    expect(content).toContain('feature: auth-login');
    expect(content).toContain('total: 2');
    expect(content).toContain('completed: 0');
    expect(content).toContain('# 작업 목록: 로그인 기능');
    expect(content).toContain('auth-login-task-001');
    expect(content).toContain('auth-login-task-002');
    expect(content).toContain('로그인 폼 구현');
    expect(content).toContain('유효성 검증 추가');
  });

  it('우선순위별 아이콘을 표시한다', () => {
    const content = generateTasks({
      featureId: 'test',
      featureTitle: '테스트',
      tasks: [
        { title: '높음', priority: 'high' },
        { title: '중간', priority: 'medium' },
        { title: '낮음', priority: 'low' },
      ],
    });

    expect(content).toContain('🔴 HIGH');
    expect(content).toContain('🟡 MEDIUM');
    expect(content).toContain('🟢 LOW');
  });

  it('작업 설명을 포함할 수 있다', () => {
    const content = generateTasks({
      featureId: 'test',
      featureTitle: '테스트',
      tasks: [
        {
          title: '작업',
          description: '상세 설명',
          priority: 'high',
        },
      ],
    });

    expect(content).toContain('**설명:** 상세 설명');
  });

  it('관련 파일을 포함할 수 있다', () => {
    const content = generateTasks({
      featureId: 'test',
      featureTitle: '테스트',
      tasks: [
        {
          title: '작업',
          priority: 'high',
          files: ['src/a.ts', 'src/b.ts'],
        },
      ],
    });

    expect(content).toContain('`src/a.ts`');
    expect(content).toContain('`src/b.ts`');
  });

  it('의존성을 포함할 수 있다', () => {
    const content = generateTasks({
      featureId: 'test',
      featureTitle: '테스트',
      tasks: [
        {
          title: '작업',
          priority: 'high',
          dependencies: ['other-task-001', 'other-task-002'],
        },
      ],
    });

    expect(content).toContain('**의존성:** other-task-001, other-task-002');
  });
});

describe('parseTasks', () => {
  it('작업 목록을 파싱한다', () => {
    const content = `---
feature: auth
---

# 작업 목록

---

## 작업 목록

### auth-task-001: 로그인 폼 구현

- **상태:** 대기
- **우선순위:** 🔴 HIGH
- **설명:** 폼 구현

### auth-task-002: 유효성 검증

- **상태:** 진행 중
- **우선순위:** 🟡 MEDIUM

---
`;

    const tasks = parseTasks(content);

    expect(tasks).toHaveLength(2);
    expect(tasks[0].id).toBe('auth-task-001');
    expect(tasks[0].title).toBe('로그인 폼 구현');
    expect(tasks[0].status).toBe('pending');
    expect(tasks[0].priority).toBe('high');
    expect(tasks[0].description).toBe('폼 구현');
    expect(tasks[1].status).toBe('in_progress');
    expect(tasks[1].priority).toBe('medium');
  });

  it('관련 파일을 파싱한다', () => {
    const content = `### task-001: 작업

- **상태:** 대기
- **우선순위:** 🔴 HIGH
- **관련 파일:**
  - \`src/a.ts\`
  - \`src/b.ts\`

---
`;

    const tasks = parseTasks(content);

    expect(tasks[0].files).toEqual(['src/a.ts', 'src/b.ts']);
  });
});

describe('updateTaskStatus', () => {
  it('작업 상태를 업데이트한다', () => {
    const content = `---
feature: auth
completed: 0
---

## 진행 상황

- 대기: 2
- 진행 중: 0
- 완료: 0
- 차단됨: 0

---

## 작업 목록

### auth-task-001: 로그인 폼

- **상태:** 대기
- **우선순위:** 🔴 HIGH

### auth-task-002: 유효성 검증

- **상태:** 대기
- **우선순위:** 🟡 MEDIUM
`;

    const updated = updateTaskStatus(content, 'auth-task-001', 'completed');

    expect(updated).toContain('### auth-task-001: 로그인 폼');
    expect(updated).toContain('**상태:** 완료');
    expect(updated).toContain('완료: 1');
    expect(updated).toContain('대기: 1');
    expect(updated).toContain('completed: 1');
  });
});

describe('getNextTask', () => {
  it('진행 중인 작업이 있으면 반환한다', () => {
    const tasks = [
      { id: 't1', title: '작업1', status: 'pending' as const, priority: 'high' as const },
      { id: 't2', title: '작업2', status: 'in_progress' as const, priority: 'medium' as const },
    ];

    const next = getNextTask(tasks);
    expect(next?.id).toBe('t2');
  });

  it('우선순위가 높은 작업을 먼저 반환한다', () => {
    const tasks = [
      { id: 't1', title: '작업1', status: 'pending' as const, priority: 'low' as const },
      { id: 't2', title: '작업2', status: 'pending' as const, priority: 'high' as const },
      { id: 't3', title: '작업3', status: 'pending' as const, priority: 'medium' as const },
    ];

    const next = getNextTask(tasks);
    expect(next?.id).toBe('t2');
  });

  it('의존성이 완료되지 않은 작업은 건너뛴다', () => {
    const tasks = [
      { id: 't1', title: '작업1', status: 'pending' as const, priority: 'high' as const, dependencies: ['t2'] },
      { id: 't2', title: '작업2', status: 'pending' as const, priority: 'medium' as const },
    ];

    const next = getNextTask(tasks);
    expect(next?.id).toBe('t2');
  });

  it('의존성이 완료된 작업을 반환한다', () => {
    const tasks = [
      { id: 't1', title: '작업1', status: 'pending' as const, priority: 'high' as const, dependencies: ['t2'] },
      { id: 't2', title: '작업2', status: 'completed' as const, priority: 'medium' as const },
    ];

    const next = getNextTask(tasks);
    expect(next?.id).toBe('t1');
  });

  it('모든 작업이 완료되면 null을 반환한다', () => {
    const tasks = [
      { id: 't1', title: '작업1', status: 'completed' as const, priority: 'high' as const },
    ];

    const next = getNextTask(tasks);
    expect(next).toBeNull();
  });
});
