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
          text: '확장',
          items: [
            { text: '현재 한계점', link: '/guide/limitations' },
            { text: '로드맵 v2 (고도화)', link: '/guide/roadmap-v2' },
            { text: '스케일업 로드맵', link: '/guide/scaling-roadmap' },
            { text: '대규모 확장 로드맵', link: '/guide/enterprise-roadmap' },
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
          ],
        },
      ],
      '/commands/': [
        {
          text: '슬래시 커맨드',
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
