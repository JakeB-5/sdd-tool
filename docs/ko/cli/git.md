# sdd git

Git 워크플로우를 설정합니다.

## 사용법

```bash
sdd git <subcommand> [options]
```

## 서브커맨드

### hooks

Git hooks를 설치하거나 제거합니다.

```bash
# hooks 설치
sdd git hooks install

# hooks 제거
sdd git hooks uninstall
```

**설치되는 훅:**

| 훅 | 시점 | 동작 |
|----|------|------|
| `pre-commit` | 커밋 전 | 변경된 스펙 검증 |
| `commit-msg` | 커밋 메시지 작성 후 | 메시지 형식 검증 |
| `pre-push` | 푸시 전 | 전체 스펙 검증 |

### template

커밋 메시지 템플릿을 설치합니다.

```bash
sdd git template install
```

Git 설정에 `.gitmessage` 템플릿이 등록됩니다.

### setup

전체 Git 워크플로우를 한 번에 설정합니다.

```bash
sdd git setup
```

**설정 내용:**
- Git hooks 설치
- 커밋 메시지 템플릿 설치
- `.gitignore.sdd` 병합
- `.gitattributes.sdd` 병합

## 옵션

| 옵션 | 설명 |
|------|------|
| `--help` | 도움말 |

## 예시

```bash
# 전체 설정 (권장)
sdd git setup

# hooks만 설치
sdd git hooks install

# 특정 훅 제거
sdd git hooks uninstall
```

## 관련 문서

- [커밋 컨벤션](/guide/commit-convention)
- [브랜치 전략](/guide/branch-strategy)
- [CI/CD 설정](/guide/cicd-setup)
