---
layout: home

hero:
  name: "SDD Tool"
  text: "명세 기반 개발 CLI"
  tagline: AI와 함께하는 Spec-Driven Development
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
    details: Claude Code 스킬로 워크플로우를 자동화합니다
  - icon: ✅
    title: RFC 2119
    details: SHALL, MUST, SHOULD, MAY로 요구사항을 명확하게 정의합니다
  - icon: 🔄
    title: GIVEN-WHEN-THEN
    details: 시나리오 기반으로 요구사항을 검증 가능하게 만듭니다
  - icon: 📋
    title: 헌법(Constitution)
    details: 프로젝트의 핵심 원칙을 정의하고 일관성을 유지합니다
  - icon: 🚀
    title: 30개 스킬 (슬래시 커맨드)
    details: 완전한 SDD 워크플로우를 위한 30개 sdd-* 스킬 제공 (/sdd-start, /sdd-spec, ...)
---

## 빠른 시작

```bash
# 설치
npm install -g sdd-tool

# 프로젝트 초기화 (스킬 생성)
sdd init

# Claude Code에서 워크플로우 시작
/sdd-start

# 첫 명세 생성 (도메인 자동 생성; spec, plan, tasks, checklist)
sdd new auth/user-authentication --all

# 명세 검증
sdd validate

# 구현하면서 진행 상황 갱신
sdd new task user-authentication user-authentication-task-001 in-progress
sdd status

# 마무리: @spec <domain>/<feature>#REQ-01 커버리지 확인 후 implemented로 표시
sdd sync
sdd new status auth/user-authentication implemented
```

`sdd new`는 `feature/<name>` git 브랜치도 만들어 전환하고(`--no-branch`로 생략) 기존 파일을 덮어쓰지 않습니다(`--force`로 다시 생성). 요구사항은 스펙의 `### REQ-01: 제목` 헤딩이며, `sdd impact`의 의존성은 frontmatter의 `depends: [<domain>/<feature>]` 목록에서만 계산됩니다.

`sdd init`은 30개의 sdd-* 스킬(`.claude/skills/sdd-*/`)을 생성하며, Claude Code는 각 스킬을 `/sdd-*` 슬래시 커맨드로 노출합니다. 레거시 `.claude/commands/` 파일은 `sdd init --legacy-commands`를 사용할 때만 생성됩니다.

## 왜 SDD인가?

**명세 기반 개발(Spec-Driven Development)**은 코드보다 명세를 우선시하는 개발 방법론입니다.

- **명세가 진실의 원천**: 코드는 명세의 구현체입니다
- **요구사항 명확화**: RFC 2119 키워드로 애매함을 제거합니다
- **검증 가능한 시나리오**: GIVEN-WHEN-THEN으로 테스트 케이스를 생성합니다
- **AI 협업 최적화**: 명세를 통해 AI와 효과적으로 소통합니다
