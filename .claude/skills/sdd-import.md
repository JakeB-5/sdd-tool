# /sdd-import

외부 문서에서 SDD 스펙을 생성합니다.

## 사용법

```
/sdd-import <source>             # 문서 가져오기
/sdd-import <url> --type notion  # Notion 문서
/sdd-import <file> --type md     # Markdown 파일
/sdd-import --interactive        # 대화형 모드
```

## 지원 소스

### Markdown 파일

```
/sdd-import docs/requirements.md
/sdd-import README.md --domain core
```

### Notion

```
/sdd-import https://notion.so/page-id --type notion
```

### Confluence

```
/sdd-import https://company.atlassian.net/wiki/spaces/DOC/pages/123 --type confluence
```

### Google Docs

```
/sdd-import https://docs.google.com/document/d/xxx --type gdocs
```

### 일반 텍스트

```
/sdd-import requirements.txt --type text
```

## 가져오기 프로세스

### 1. 문서 파싱

```
/sdd-import docs/feature-spec.md
```

출력:
```
📄 문서 분석 중...

발견된 섹션:
  - 기능 설명 (1)
  - 요구사항 (5)
  - 시나리오 (3)
  - 제약사항 (2)

스펙 후보:
  1. user-registration
  2. email-verification
  3. password-reset
```

### 2. 스펙 매핑

문서 구조를 SDD 스펙 형식으로 변환합니다.

```
# 원본 문서
## 로그인 기능
사용자는 이메일과 비밀번호로 로그인할 수 있다.

### 조건
- 이메일 형식 검증
- 비밀번호 8자 이상

---

# 변환된 스펙
id: auth/user-login
scenarios:
  - name: 로그인 성공
    given: 유효한 이메일과 비밀번호
    when: 로그인 요청
    then: 인증 토큰 반환
```

### 3. 검토 및 확정

```
/sdd-import docs/spec.md --review
```

대화형 검토를 통해 변환 결과를 확인합니다.

## 옵션

### 도메인 지정

```
/sdd-import spec.md --domain auth
```

### 출력 형식

```
/sdd-import spec.md --output .sdd/specs/
/sdd-import spec.md --dry-run    # 미리보기만
```

### 충돌 처리

```
/sdd-import spec.md --overwrite  # 기존 스펙 덮어쓰기
/sdd-import spec.md --merge      # 기존 스펙과 병합
/sdd-import spec.md --skip       # 기존 스펙 건너뛰기
```

## 변환 규칙

### 헤딩 → 스펙 이름

```markdown
# 사용자 인증
→ id: user-authentication
```

### 리스트 → 시나리오

```markdown
- 로그인 성공 시 토큰 반환
- 잘못된 비밀번호 시 오류

→ scenarios:
  - name: 로그인 성공
    then: 토큰 반환
  - name: 잘못된 비밀번호
    then: 오류 반환
```

### 코드 블록 → 계약

```markdown
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

→ contracts:
  - type: input
    signature: LoginRequest
```

## 대화형 모드

```
/sdd-import --interactive
```

단계별로 가이드를 제공합니다:

1. 문서 소스 선택
2. 파싱 결과 확인
3. 스펙 매핑 검토
4. 도메인 할당
5. 저장 위치 확인

## 참고사항

- 변환 결과는 항상 검토가 필요합니다
- 복잡한 문서는 섹션별로 가져오기 권장
- `[IMPORTED]` 태그로 출처 추적
- 원본 문서 링크가 메타데이터에 저장됩니다
