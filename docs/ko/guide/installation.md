# 설치

## 요구사항

- **Node.js**: 20.0.0 이상
- **Claude Code**: 최신 버전 권장

## npm으로 설치

```bash
npm install -g sdd-tool
```

## pnpm으로 설치

```bash
pnpm add -g sdd-tool
```

## 설치 확인

```bash
sdd --version
```

## Claude Code 설정

SDD Tool은 Claude Code의 슬래시 커맨드를 통해 AI와 협업합니다.

### Claude Code 설치

```bash
npm install -g @anthropic-ai/claude-code
```

### 프로젝트에서 Claude Code 시작

```bash
claude
```

## 프로젝트 초기화

새 프로젝트에서:

```bash
cd your-project
sdd init
```

초기화 후 생성되는 구조:

```
your-project/
├── .sdd/
│   ├── constitution.md     # 프로젝트 헌법
│   ├── AGENTS.md           # AI 워크플로우 가이드
│   └── specs/              # 기능 명세
└── .claude/
    └── commands/           # 슬래시 커맨드 (29개)
```

## 업데이트

```bash
npm update -g sdd-tool
```

## 문제 해결

### 권한 오류

```bash
sudo npm install -g sdd-tool
```

또는 npm 전역 설치 경로를 사용자 디렉토리로 변경:

```bash
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Node.js 버전 오류

Node.js 20 이상이 필요합니다. nvm 사용 시:

```bash
nvm install 20
nvm use 20
```
