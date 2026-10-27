# Constitution (프로젝트 헌법)

프로젝트의 핵심 원칙을 정의하는 Constitution 작성 가이드입니다.

## Constitution이란?

Constitution은 프로젝트의 핵심 원칙, 기술 결정, 금지 사항을 정의하는 문서입니다. 모든 스펙과 구현은 Constitution을 따라야 합니다. 위치는 `.sdd/constitution.md`이며, `sdd init`이 편집할 수 있는 템플릿을 만들어 줍니다.

## 구조

파서(`sdd constitution show` / `validate`)는 다음 레이아웃을 읽습니다:

```markdown
---
version: 1.0.0
created: 2025-12-24
---

# Constitution: 내 프로젝트

> 프로젝트 원칙에 대한 한 줄 설명.

## 핵심 원칙

### 1. 사용자 우선

- 사용자 경험은 모든 결정의 기준이어야 한다(SHALL)

## 기술 스택

- 언어: TypeScript (strict 모드)

## 품질 기준

- 테스트 커버리지는 80% 이상이어야 한다(SHALL)

## 금지 사항

- `any` 타입을 사용해서는 안 된다(SHALL NOT)
```

- **Frontmatter**: `version`(시맨틱 버전, 기본 `1.0.0`)과 `created`. `updated`는 `sdd constitution bump`가 설정합니다.
- **제목**: `# Constitution: <프로젝트명>`은 필수입니다.
- **섹션**: `## 핵심 원칙`(또는 `## 원칙`) 아래 `### N. 제목` 항목과 `-` 규칙, `## 기술 스택`, `## 품질 기준`, `## 금지 사항`. 금지 규칙은 `SHALL NOT` 또는 `MUST NOT`이 들어 있는 것만 인식됩니다.

## 섹션별 작성법

### 핵심 원칙

프로젝트의 근본적인 가치를, 원칙마다 번호가 붙은 `###` 항목으로 작성합니다:

```markdown
## 핵심 원칙

### 1. 사용자 우선

- 사용자 경험은 모든 결정의 기준이어야 한다(SHALL)

### 2. 데이터 보호

- 사용자 데이터의 안전은 최우선이어야 한다(SHALL)

### 3. 단순함

- 복잡한 설계보다 단순한 설계를 선호해야 한다(SHOULD)
```

### 기술 스택

기술 결정과 표준을 `-` 한 줄씩 작성합니다:

```markdown
## 기술 스택

- 언어: TypeScript strict 모드
- 프레임워크: React 18+
- 런타임: Node.js 20+
- 스타일: ESLint + Prettier
```

### 품질 기준

```markdown
## 품질 기준

- 테스트 커버리지는 80% 이상이어야 한다(SHALL)
- E2E 테스트는 핵심 플로우에만 작성하는 것이 좋다(SHOULD)
```

### 금지 사항

절대 하면 안 되는 것들입니다. 각 규칙에 `SHALL NOT` / `MUST NOT`을 씁니다:

```markdown
## 금지 사항

- `any` 타입을 사용해서는 안 된다(SHALL NOT)
- 프로덕션 코드에 console.log를 남겨서는 안 된다(SHALL NOT)
- 하드코딩된 시크릿을 커밋해서는 안 된다(MUST NOT)
- 평문 비밀번호를 저장해서는 안 된다(SHALL NOT)
```

## 버전 관리

Constitution 변경 시:

1. 버전 번호 증가
2. 변경 이력 기록
3. 기존 스펙 호환성 검토

```bash
sdd constitution bump --minor -m "테스트 커버리지 기준 추가"   # --major | --minor | --patch 중 하나 필수
sdd constitution history
```

`bump`는 frontmatter의 `version:`과 `updated:`를 갱신하고 변경 내용을 `.sdd/CHANGELOG.md`에 추가하며, `sdd constitution history`가 이를 읽습니다.

## 스펙에서 참조

스펙 메타데이터에 Constitution 버전 포함:

```yaml
---
id: user-auth
constitution_version: 1.0.0
---
```

## 검증

```bash
sdd constitution validate   # constitution 파일 자체가 파싱되는지
sdd validate                # 스펙을 constitution 버전과 비교
```

- `sdd validate`는 각 스펙의 `constitution_version`을 constitution의 `version`과 비교해 불일치를 경고합니다(Major 차이는 에러). `constitution_version`이 없는 스펙은 건너뜁니다.
- constitution을 파싱할 수 없으면 경고 W007을 보고하고 검사를 건너뜁니다.
- constitution의 규칙(예: 금지 사항)은 스펙 본문과 자동으로 대조되지 않으며, 리뷰 기준으로 사용합니다.
