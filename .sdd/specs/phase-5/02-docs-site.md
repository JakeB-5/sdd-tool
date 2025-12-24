---
id: phase5-docs
title: "문서 사이트"
status: approved
version: 1.0.0
created: 2025-12-24
author: Claude
dependencies: [phase5-cicd]
---

# 문서 사이트

> VitePress 기반 SDD Tool 공식 문서 사이트

## 개요

SDD Tool의 사용법, API 레퍼런스, 가이드를 제공하는 정적 문서 사이트를 구축합니다.

## 요구사항

### REQ-01: 문서 구조

- 시스템은 시작하기(Getting Started) 가이드를 제공해야 한다(SHALL)
- 시스템은 CLI 명령어 레퍼런스를 제공해야 한다(SHALL)
- 시스템은 슬래시 커맨드 가이드를 제공해야 한다(SHALL)
- 시스템은 스펙 작성 가이드를 제공해야 한다(SHALL)
- 시스템은 API 레퍼런스를 제공해야 한다(SHOULD)

### REQ-02: 검색 기능

- 시스템은 전문 검색을 지원해야 한다(SHALL)
- 시스템은 한국어 검색을 지원해야 한다(SHALL)

### REQ-03: 다국어 지원

- 시스템은 한국어를 기본 언어로 지원해야 한다(SHALL)
- 시스템은 영어 문서를 제공해야 한다(SHOULD)

### REQ-04: 테마

- 시스템은 다크/라이트 모드를 지원해야 한다(SHALL)
- 시스템은 반응형 디자인을 제공해야 한다(SHALL)

### REQ-05: 배포

- 시스템은 GitHub Pages에 배포되어야 한다(SHALL)
- 시스템은 커스텀 도메인을 지원해야 한다(MAY)

## 시나리오

### Scenario 1: 시작하기 가이드 접근

- **GIVEN** 사용자가 문서 사이트에 접속했을 때
- **WHEN** 시작하기 메뉴를 클릭하면
- **THEN** 설치 및 첫 프로젝트 가이드가 표시된다

### Scenario 2: CLI 명령어 검색

- **GIVEN** 사용자가 검색창에 "validate"를 입력했을 때
- **WHEN** 검색을 실행하면
- **THEN** sdd validate 관련 문서가 검색 결과에 표시된다

### Scenario 3: 다크 모드 전환

- **GIVEN** 사용자가 라이트 모드를 사용 중일 때
- **WHEN** 테마 토글을 클릭하면
- **THEN** 다크 모드로 전환된다
- **AND** 설정이 저장된다

## 문서 구조

```
docs/
├── .vitepress/
│   ├── config.ts        # VitePress 설정
│   └── theme/
│       └── index.ts     # 커스텀 테마
├── index.md             # 홈페이지
├── guide/
│   ├── getting-started.md
│   ├── installation.md
│   ├── first-project.md
│   ├── workflow.md
│   └── best-practices.md
├── cli/
│   ├── index.md         # CLI 개요
│   ├── init.md
│   ├── new.md
│   ├── validate.md
│   ├── prepare.md
│   ├── sync.md
│   ├── diff.md
│   └── export.md
├── commands/
│   ├── index.md         # 슬래시 커맨드 개요
│   ├── sdd-start.md
│   ├── sdd-new.md
│   ├── sdd-plan.md
│   ├── sdd-tasks.md
│   ├── sdd-prepare.md
│   └── sdd-implement.md
├── spec-writing/
│   ├── index.md
│   ├── rfc2119.md
│   ├── given-when-then.md
│   ├── requirements.md
│   └── constitution.md
├── api/
│   ├── index.md
│   ├── core.md
│   └── types.md
└── ko/                  # 한국어 (기본)
    └── ...
```

## VitePress 설정

### config.ts

```typescript
import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'SDD Tool',
  description: 'Spec-Driven Development CLI',
  lang: 'ko-KR',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '가이드', link: '/guide/getting-started' },
      { text: 'CLI', link: '/cli/' },
      { text: '슬래시 커맨드', link: '/commands/' },
      { text: 'API', link: '/api/' },
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
            { text: '/sdd.new', link: '/commands/sdd-new' },
            { text: '/sdd.plan', link: '/commands/sdd-plan' },
            { text: '/sdd.tasks', link: '/commands/sdd-tasks' },
            { text: '/sdd.prepare', link: '/commands/sdd-prepare' },
            { text: '/sdd.implement', link: '/commands/sdd-implement' },
          ],
        },
      ],
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          ko: {
            translations: {
              button: { buttonText: '검색' },
              modal: {
                searchBox: { resetButtonTitle: '초기화' },
                footer: { selectText: '선택', navigateText: '이동' },
              },
            },
          },
        },
      },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/JakeB-5/sdd-tool' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/sdd-tool' },
    ],

    footer: {
      message: 'MIT License',
      copyright: 'Copyright © 2025',
    },
  },
});
```

## 홈페이지 디자인

### index.md

```markdown
---
layout: home

hero:
  name: "SDD Tool"
  text: "명세 기반 개발 CLI"
  tagline: AI와 함께하는 Spec-Driven Development
  image:
    src: /logo.svg
    alt: SDD Tool
  actions:
    - theme: brand
      text: 시작하기
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/JakeB-5/sdd-tool

features:
  - icon: 📝
    title: 명세 우선
    details: 코드 작성 전 명세를 작성하여 요구사항을 명확히 합니다
  - icon: 🤖
    title: AI 협업
    details: Claude Code 슬래시 커맨드로 워크플로우를 자동화합니다
  - icon: ✅
    title: RFC 2119
    details: SHALL, MUST, SHOULD, MAY로 요구사항을 명확하게 정의합니다
  - icon: 🔄
    title: GIVEN-WHEN-THEN
    details: 시나리오 기반으로 요구사항을 검증 가능하게 만듭니다
---
```

## 기술 스택

| 도구 | 용도 |
|------|------|
| VitePress | 정적 사이트 생성 |
| Vue 3 | UI 컴포넌트 |
| Shiki | 코드 구문 강조 |
| Algolia DocSearch | 검색 (옵션) |

## 개발 명령어

```bash
# 개발 서버
cd docs && npm run dev

# 빌드
cd docs && npm run build

# 미리보기
cd docs && npm run preview
```

## 배포 URL

- **GitHub Pages**: https://jakeb-5.github.io/sdd-tool/
- **커스텀 도메인**: (향후 설정)
