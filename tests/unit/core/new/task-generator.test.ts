/**
 * 작업 분해 생성기 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  generateTasks,
  parseTasks,
  updateTaskStatus,
  getNextTask,
  normalizeTaskStatus,
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

  it('다음 단계는 현재 스킬/CLI 이름만 안내한다', () => {
    const content = generateTasks({ featureId: 'test', featureTitle: '테스트', tasks: [] });

    expect(content).not.toMatch(/\/?sdd:/);
    expect(content).not.toContain('archive');
    expect(content).toContain('`/sdd-validate`');
    expect(content).toContain('`$sdd-validate`');
    expect(content).toContain('`sdd sync`');
  });

  it('완료 조건은 테스트를 구현보다 먼저 둔다', () => {
    const content = generateTasks({ featureId: 'test', featureTitle: '테스트', tasks: [] });

    expect(content.indexOf('실패하는 테스트 먼저 작성')).toBeGreaterThan(-1);
    expect(content.indexOf('실패하는 테스트 먼저 작성')).toBeLessThan(
      content.indexOf('테스트를 통과하는 구현 작성')
    );
  });
});

describe('normalizeTaskStatus', () => {
  it.each([
    ['pending', 'pending'],
    ['Pending', 'pending'],
    ['대기', 'pending'],
    ['in-progress', 'in_progress'],
    ['in_progress', 'in_progress'],
    ['IN-PROGRESS', 'in_progress'],
    ['진행 중', 'in_progress'],
    ['진행중', 'in_progress'],
    ['completed', 'completed'],
    ['Completed', 'completed'],
    ['완료', 'completed'],
    ['완료 (2026-10-27)', 'completed'],
    ['완료(2026-10-27)', 'completed'],
    ['**완료**', 'completed'],
    ['`completed`', 'completed'],
    ['✅ 완료', 'completed'],
    ['In Progress', 'in_progress'],
    ['blocked', 'blocked'],
    ['BLOCKED', 'blocked'],
    ['차단됨', 'blocked'],
    ['차단됨: API 대기', 'blocked'],
    ['차단', 'blocked'],
  ] as const)('%s → %s', (raw, expected) => {
    expect(normalizeTaskStatus(raw)).toBe(expected);
  });

  it('알 수 없는 값은 undefined', () => {
    expect(normalizeTaskStatus('someday')).toBeUndefined();
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

  it('영문 **Status:** 레이블과 스킬 값(in-progress 등)을 파싱한다', () => {
    const content = `### cart-task-001: Model

- **Status:** completed
- **Priority:** 🔴 HIGH

#### Description
Cart model

### cart-task-002: API

- **Status:** in-progress

### cart-task-003: UI

- **status:** Blocked

### cart-task-004: Docs

- **Status:** pending
`;

    const tasks = parseTasks(content);

    expect(tasks.map((t) => t.status)).toEqual(['completed', 'in_progress', 'blocked', 'pending']);
  });

  it('**Status**: 형식(콜론이 볼드 밖)도 파싱한다', () => {
    const content = `### t-001: A

- **Status**: completed

### t-002: B

- **상태**: 진행 중
`;

    expect(parseTasks(content).map((t) => t.status)).toEqual(['completed', 'in_progress']);
  });

  it('영문 Priority/Dependencies 레이블을 파싱한다', () => {
    const content = `### cart-task-002: API

- **Status:** pending
- **Priority:** 🔴 HIGH
- **Dependencies:** cart-task-001, cart-task-000
`;

    const [task] = parseTasks(content);

    expect(task.priority).toBe('high');
    expect(task.dependencies).toEqual(['cart-task-001', 'cart-task-000']);
  });

  it.each(['none', 'None', '없음', '-', 'N/A'])('의존성 "%s"는 빈 배열이다', (value) => {
    const content = `### t-001: A

- **상태:** 대기
- **의존성:** ${value}
`;

    const tasks = parseTasks(content);

    expect(tasks[0].dependencies).toEqual([]);
    expect(getNextTask(tasks)?.id).toBe('t-001');
  });

  it('한글 기능 ID의 작업 제목을 파싱한다', () => {
    const content = `### 장바구니-task-001: 모델

- **상태:** 완료
`;

    const tasks = parseTasks(content);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('장바구니-task-001');
    expect(tasks[0].status).toBe('completed');
  });

  it('CRLF 줄바꿈 파일을 파싱한다', () => {
    const content = '### t-001: A\r\n\r\n- **Status:** in-progress\r\n- **Priority:** LOW\r\n';

    const [task] = parseTasks(content);

    expect(task.title).toBe('A');
    expect(task.status).toBe('in_progress');
    expect(task.priority).toBe('low');
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

  it('"진행 중" 값을 통째로 교체한다', () => {
    const content = `### t-001: A

- **상태:** 진행 중
`;

    const updated = updateTaskStatus(content, 't-001', 'completed');

    expect(updated).toContain('- **상태:** 완료\n');
    expect(updated).not.toContain('완료 중');
  });

  it('영문 레이블은 영문 레이블·값으로 유지한다', () => {
    const content = `### cart-task-001: Model

- **Status:** pending
- **Priority:** 🔴 HIGH

### cart-task-002: API

- **Status:** pending
`;

    const updated = updateTaskStatus(content, 'cart-task-002', 'in_progress');

    expect(updated).toContain('### cart-task-002: API\n\n- **Status:** in-progress');
    expect(updated).not.toContain('상태');
    expect(parseTasks(updated).map((t) => t.status)).toEqual(['pending', 'in_progress']);
  });

  it('상태 줄이 없는 작업은 다음 작업의 상태를 바꾸지 않는다', () => {
    const content = `### t-001: A

- **우선순위:** 🔴 HIGH

### t-002: B

- **상태:** 대기
`;

    const updated = updateTaskStatus(content, 't-001', 'completed');

    expect(updated).toBe(content);
  });

  it('--- 구분선 너머의 상태 줄은 바꾸지 않는다', () => {
    const content = `### t-001: A

- **우선순위:** 🔴 HIGH

---

- **상태:** 대기
`;

    expect(updateTaskStatus(content, 't-001', 'completed')).toBe(content);
  });

  it('**Status**: 형식은 형식을 유지하며 갱신한다', () => {
    const content = `### t-001: A

- **Status**: pending
`;

    expect(updateTaskStatus(content, 't-001', 'blocked')).toContain('- **Status**: blocked\n');
  });

  it('CRLF 파일은 CRLF를 유지하며 상태와 진행 상황을 갱신한다', () => {
    const content = [
      '---',
      'completed: 0',
      '---',
      '',
      '## 진행 상황',
      '',
      '- 대기: 1',
      '- 진행 중: 0',
      '- 완료: 0',
      '- 차단됨: 0',
      '',
      '---',
      '',
      '### t-001: A',
      '',
      '- **상태:** 대기',
      '- **우선순위:** 🔴 HIGH',
      '',
    ].join('\r\n');

    const updated = updateTaskStatus(content, 't-001', 'completed');

    expect(updated).toContain('- **상태:** 완료\r\n- **우선순위:**');
    expect(updated).toContain('- 대기: 0\r\n');
    expect(updated).toContain('- 완료: 1\r\n');
    expect(updated).toContain('completed: 1');
    expect(updated.replace(/\r\n/g, '')).not.toContain('\n');
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
