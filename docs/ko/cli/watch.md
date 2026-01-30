# sdd watch

스펙 파일 변경을 실시간으로 감시하고 자동 검증합니다.

## 사용법

```bash
sdd watch [options]
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `--no-validate` | 자동 검증 비활성화 |
| `--impact` | 영향도 분석 포함 |
| `-q, --quiet` | 성공 시 출력 생략 |
| `--debounce <ms>` | 디바운스 시간 (기본: 500ms) |

## 동작

1. `.sdd/specs/` 디렉토리를 감시합니다
2. 파일 변경 시 자동으로 검증을 실행합니다
3. 검증 결과를 실시간으로 표시합니다
4. `Ctrl+C`로 종료합니다

## 예시

### 기본 실행

```bash
sdd watch
```

출력:
```
👁️  Watch 모드 시작
   경로: .sdd/specs
   디바운스: 500ms
   검증: 활성화

파일 변경을 감시 중... (Ctrl+C로 종료)

✅ 감시 준비 완료

[14:30:15] 변경 감지: 수정 1
  ✏️ user-auth/spec.md

🔍 검증 실행 중...
✅ 검증 통과 (5개 스펙)

[14:32:45] 변경 감지: 추가 1
  ➕ new-feature/spec.md

🔍 검증 실행 중...
⚠️  검증 완료: 1개 경고
   - new-feature: depends 필드 누락

^C
Watch 모드 종료 중...

📊 세션 요약:
   검증 실행: 2회
   에러 발생: 0회
```

### 검증 비활성화

```bash
sdd watch --no-validate
```

변경 감지만 하고 자동 검증은 실행하지 않습니다.

### 조용한 모드

```bash
sdd watch --quiet
```

검증 성공 시 출력을 생략합니다. 에러나 경고만 표시됩니다.

### 영향도 분석 포함

```bash
sdd watch --impact
```

변경된 스펙의 영향도 분석 결과도 함께 표시합니다:

```
[14:35:20] 변경 감지: 수정 1
  ✏️ user-auth/spec.md

🔍 검증 실행 중...
✅ 검증 통과

📊 영향도 분석:
  • 직접 의존: user-profile, order-checkout
  • 간접 의존: payment-flow
```

### 디바운스 시간 조정

```bash
sdd watch --debounce 2000
```

연속된 변경에 대해 2초 후에 검증을 실행합니다.

## 이벤트 유형

| 아이콘 | 유형 | 설명 |
|--------|------|------|
| ➕ | add | 새 파일 추가 |
| ✏️ | change | 파일 수정 |
| ❌ | unlink | 파일 삭제 |

## 사용 시나리오

### 개발 중 실시간 피드백

스펙을 작성하면서 실시간으로 검증 결과를 확인:

```bash
# 터미널 1: watch 모드
sdd watch

# 터미널 2: 스펙 편집
code .sdd/specs/user-auth/spec.md
```

### CI 전 사전 검증

PR 생성 전 로컬에서 모든 변경사항 검증:

```bash
sdd watch --quiet
# 에디터에서 스펙 수정
# 에러 없으면 커밋
```

## 관련 문서

- [sdd validate](/cli/validate) - 스펙 검증
- [sdd sync](/cli/sync) - 동기화 검증
- [sdd impact](/cli/impact) - 영향도 분석
