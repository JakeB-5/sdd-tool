import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'SDD Tool',
  description: 'Spec-Driven Development CLI - AI와 함께하는 명세 기반 개발 도구',
  lang: 'ko-KR',
  base: '/sdd-tool/',

  head: [['link', { rel: 'icon', href: '/sdd-tool/favicon.ico' }]],

  themeConfig: {
    nav: [
      { text: '가이드', link: '/guide/getting-started' },
      { text: 'CLI', link: '/cli/' },
      { text: '슬래시 커맨드', link: '/commands/' },
      { text: '스펙 작성', link: '/spec-writing/' },
      { text: '튜토리얼', link: '/tutorial/greenfield' },
      { text: '로드맵', link: '/roadmap/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '시작하기',
          items: [
            { text: '소개', link: '/guide/getting-started' },
            { text: '설치', link: '/guide/installation' },
            { text: '첫 프로젝트', link: '/guide/first-project' },
          ],
        },
        {
          text: '핵심 개념',
          items: [
            { text: '워크플로우', link: '/guide/workflow' },
            { text: '모범 사례', link: '/guide/best-practices' },
          ],
        },
        {
          text: 'Git 워크플로우',
          items: [
            { text: '커밋 컨벤션', link: '/guide/commit-convention' },
            { text: '브랜치 전략', link: '/guide/branch-strategy' },
            { text: '단일 스펙 변경', link: '/guide/workflow-single-spec' },
            { text: '다중 스펙 변경', link: '/guide/workflow-bundle-spec' },
            { text: 'Constitution 변경', link: '/guide/workflow-constitution' },
            { text: 'CI/CD 설정', link: '/guide/cicd-setup' },
          ],
        },
        {
          text: '대규모 프로젝트',
          items: [
            { text: '도메인 시스템', link: '/guide/domains' },
            { text: '컨텍스트 가이드', link: '/guide/context' },
            { text: '역추출 가이드', link: '/guide/reverse-extraction' },
            { text: '대규모 프로젝트', link: '/guide/large-projects' },
          ],
        },
        {
          text: 'Serena 통합',
          items: [
            { text: 'Serena 설정', link: '/guide/serena-setup' },
          ],
        },
      ],
      '/tutorial/': [
        {
          text: '튜토리얼',
          items: [
            { text: '그린필드 프로젝트', link: '/tutorial/greenfield' },
            { text: '브라운필드 프로젝트', link: '/tutorial/brownfield' },
          ],
        },
      ],
      '/roadmap/': [
        {
          text: '로드맵',
          items: [
            { text: '개요', link: '/roadmap/' },
            { text: '현재 한계점', link: '/roadmap/current-limits' },
          ],
        },
        {
          text: '메인 로드맵',
          items: [
            { text: '로드맵 v2 (전체)', link: '/roadmap/overview' },
          ],
        },
        {
          text: 'Phase별 상세',
          items: [
            { text: 'Phase 0: Git 워크플로우', link: '/roadmap/scaling' },
            { text: 'Phase 1-R: 역방향 추출', link: '/roadmap/reverse-extraction' },
          ],
        },
        {
          text: '참고',
          items: [
            { text: '엔터프라이즈 로드맵', link: '/roadmap/enterprise' },
          ],
        },
      ],
      '/cli/': [
        {
          text: 'CLI 명령어',
          items: [
            { text: '개요', link: '/cli/' },
            { text: 'sdd init', link: '/cli/init' },
            { text: 'sdd new', link: '/cli/new' },
            { text: 'sdd validate', link: '/cli/validate' },
            { text: 'sdd prepare', link: '/cli/prepare' },
            { text: 'sdd status', link: '/cli/status' },
            { text: 'sdd list', link: '/cli/list' },
            { text: 'sdd sync', link: '/cli/sync' },
            { text: 'sdd diff', link: '/cli/diff' },
            { text: 'sdd export', link: '/cli/export' },
            { text: 'sdd git', link: '/cli/git' },
            { text: 'sdd cicd', link: '/cli/cicd' },
          ],
        },
        {
          text: '도메인 & 컨텍스트',
          items: [
            { text: 'sdd domain', link: '/cli/domain' },
            { text: 'sdd context', link: '/cli/context' },
          ],
        },
        {
          text: '역추출',
          items: [
            { text: 'sdd reverse', link: '/cli/reverse' },
          ],
        },
      ],
      '/commands/': [
        {
          text: '핵심 워크플로우',
          items: [
            { text: '개요', link: '/commands/' },
            { text: '/sdd.start', link: '/commands/sdd-start' },
            { text: '/sdd.constitution', link: '/commands/sdd-constitution' },
            { text: '/sdd.new', link: '/commands/sdd-new' },
            { text: '/sdd.plan', link: '/commands/sdd-plan' },
            { text: '/sdd.tasks', link: '/commands/sdd-tasks' },
            { text: '/sdd.prepare', link: '/commands/sdd-prepare' },
            { text: '/sdd.implement', link: '/commands/sdd-implement' },
            { text: '/sdd.validate', link: '/commands/sdd-validate' },
          ],
        },
        {
          text: '도메인 & 역추출',
          items: [
            { text: '/sdd.reverse', link: '/commands/sdd-reverse' },
            { text: '/sdd.domain', link: '/commands/sdd-domain' },
            { text: '/sdd.context', link: '/commands/sdd-context' },
          ],
        },
        {
          text: '개발 스킬',
          items: [
            { text: '/dev-implement', link: '/commands/dev-implement' },
            { text: '/dev-next', link: '/commands/dev-next' },
            { text: '/dev-review', link: '/commands/dev-review' },
            { text: '/dev-scaffold', link: '/commands/dev-scaffold' },
            { text: '/dev-status', link: '/commands/dev-status' },
            { text: '/dev-test', link: '/commands/dev-test' },
          ],
        },
      ],
      '/spec-writing/': [
        {
          text: '스펙 작성 가이드',
          items: [
            { text: '개요', link: '/spec-writing/' },
            { text: 'RFC 2119 키워드', link: '/spec-writing/rfc2119' },
            { text: 'GIVEN-WHEN-THEN', link: '/spec-writing/given-when-then' },
            { text: '요구사항 작성', link: '/spec-writing/requirements' },
            { text: 'Constitution', link: '/spec-writing/constitution' },
          ],
        },
      ],
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '검색', buttonAriaLabel: '검색' },
          modal: {
            searchBox: {
              resetButtonTitle: '검색어 지우기',
              resetButtonAriaLabel: '검색어 지우기',
              cancelButtonText: '취소',
              cancelButtonAriaLabel: '취소',
            },
            startScreen: {
              recentSearchesTitle: '최근 검색',
              noRecentSearchesText: '최근 검색 없음',
              saveRecentSearchButtonTitle: '최근 검색에 저장',
              removeRecentSearchButtonTitle: '최근 검색에서 삭제',
            },
            errorScreen: {
              titleText: '결과를 가져올 수 없습니다',
              helpText: '네트워크 연결을 확인하세요',
            },
            footer: {
              selectText: '선택',
              navigateText: '이동',
              closeText: '닫기',
            },
            noResultsScreen: {
              noResultsText: '검색 결과가 없습니다',
              suggestedQueryText: '다른 검색어를 시도해보세요',
            },
          },
        },
      },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/JakeB-5/sdd-tool' },
    ],

    footer: {
      message: 'MIT License',
      copyright: 'Copyright © 2025 JakeB-5',
    },

    editLink: {
      pattern: 'https://github.com/JakeB-5/sdd-tool/edit/main/docs/:path',
      text: '이 페이지 수정하기',
    },

    lastUpdated: {
      text: '마지막 수정',
    },

    outline: {
      label: '이 페이지에서',
    },

    docFooter: {
      prev: '이전',
      next: '다음',
    },
  },
});
