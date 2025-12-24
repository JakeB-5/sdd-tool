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
    details: Claude Code 슬래시 커맨드로 워크플로우를 자동화합니다
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
    title: 29개 슬래시 커맨드
    details: 완전한 SDD 워크플로우를 위한 자동화된 명령어 제공
---

## 빠른 시작

```bash
# 설치
npm install -g sdd-tool

# 프로젝트 초기화
sdd init

# Claude Code에서 워크플로우 시작
/sdd.start
```

## 왜 SDD인가?

**명세 기반 개발(Spec-Driven Development)**은 코드보다 명세를 우선시하는 개발 방법론입니다.

- **명세가 진실의 원천**: 코드는 명세의 구현체입니다
- **요구사항 명확화**: RFC 2119 키워드로 애매함을 제거합니다
- **검증 가능한 시나리오**: GIVEN-WHEN-THEN으로 테스트 케이스를 생성합니다
- **AI 협업 최적화**: 명세를 통해 AI와 효과적으로 소통합니다
