# sdd init

프로젝트를 SDD Tool로 초기화합니다.

## 사용법

```bash
sdd init [options]
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `--force` | 기존 설정 덮어쓰기 |

## 생성되는 파일

```
your-project/
├── .sdd/
│   ├── constitution.md     # 프로젝트 헌법 템플릿
│   ├── AGENTS.md           # AI 워크플로우 가이드
│   └── specs/              # 기능 명세 디렉토리
│
└── .claude/
    └── commands/           # 슬래시 커맨드 (29개)
        ├── sdd.start.md
        ├── sdd.new.md
        ├── sdd.plan.md
        └── ...
```

## 예시

### 기본 초기화

```bash
sdd init
```

### 기존 설정 덮어쓰기

```bash
sdd init --force
```

## 초기화 후

1. Claude Code 실행: `claude`
2. 워크플로우 시작: `/sdd.start`
