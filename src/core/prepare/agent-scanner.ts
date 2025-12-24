/**
 * 서브에이전트 스캐너
 * .claude/agents/ 디렉토리를 스캔하여 에이전트 파일 분석
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import { AgentMetadata, AgentMetadataSchema, ScannedAgent } from './schemas.js';

/**
 * 에이전트 스캐너 클래스
 */
export class AgentScanner {
  private agentsDir: string;

  constructor(projectRoot: string) {
    this.agentsDir = path.join(projectRoot, '.claude', 'agents');
  }

  /**
   * 에이전트 디렉토리 존재 여부
   */
  exists(): boolean {
    return fs.existsSync(this.agentsDir);
  }

  /**
   * 모든 에이전트 스캔
   */
  async scanAll(): Promise<ScannedAgent[]> {
    if (!this.exists()) {
      return [];
    }

    const agents: ScannedAgent[] = [];
    const files = fs.readdirSync(this.agentsDir);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(this.agentsDir, file);
      const agent = await this.scanAgent(filePath);
      if (agent) {
        agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * 단일 에이전트 파일 스캔
   */
  async scanAgent(filePath: string): Promise<ScannedAgent | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data, content: body } = matter(content);

      // 메타데이터 파싱
      const metadata = this.parseMetadata(data, filePath);
      if (!metadata) {
        return null;
      }

      return {
        name: metadata.name,
        filePath,
        metadata,
        content: body.trim(),
      };
    } catch {
      return null;
    }
  }

  /**
   * 특정 에이전트 존재 확인
   */
  hasAgent(name: string): boolean {
    const filePath = path.join(this.agentsDir, `${name}.md`);
    return fs.existsSync(filePath);
  }

  /**
   * 특정 에이전트 가져오기
   */
  async getAgent(name: string): Promise<ScannedAgent | null> {
    const filePath = path.join(this.agentsDir, `${name}.md`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return this.scanAgent(filePath);
  }

  /**
   * 메타데이터 파싱
   */
  private parseMetadata(data: Record<string, unknown>, filePath: string): AgentMetadata | null {
    try {
      // tools가 문자열이면 배열로 변환
      if (typeof data.tools === 'string') {
        data.tools = data.tools.split(',').map((t: string) => t.trim());
      }

      const result = AgentMetadataSchema.safeParse(data);
      if (result.success) {
        return result.data;
      }

      // name이 없으면 파일명에서 추출
      const fileName = path.basename(filePath, '.md');
      const withName = { ...data, name: data.name ?? fileName };
      const retryResult = AgentMetadataSchema.safeParse(withName);

      if (retryResult.success) {
        return retryResult.data;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * 에이전트 디렉토리 경로
   */
  getAgentsDir(): string {
    return this.agentsDir;
  }

  /**
   * 에이전트 파일 경로 생성
   */
  getAgentFilePath(name: string): string {
    return path.join(this.agentsDir, `${name}.md`);
  }
}
