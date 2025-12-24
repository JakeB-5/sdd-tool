/**
 * 스킬 스캐너
 * .claude/skills/ 디렉토리를 스캔하여 스킬 파일 분석
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import { SkillMetadata, SkillMetadataSchema, ScannedSkill } from './schemas.js';

/**
 * 스킬 스캐너 클래스
 */
export class SkillScanner {
  private skillsDir: string;

  constructor(projectRoot: string) {
    this.skillsDir = path.join(projectRoot, '.claude', 'skills');
  }

  /**
   * 스킬 디렉토리 존재 여부
   */
  exists(): boolean {
    return fs.existsSync(this.skillsDir);
  }

  /**
   * 모든 스킬 스캔
   */
  async scanAll(): Promise<ScannedSkill[]> {
    if (!this.exists()) {
      return [];
    }

    const skills: ScannedSkill[] = [];
    const entries = fs.readdirSync(this.skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillDir = path.join(this.skillsDir, entry.name);
      const skill = await this.scanSkill(skillDir);
      if (skill) {
        skills.push(skill);
      }
    }

    return skills;
  }

  /**
   * 단일 스킬 디렉토리 스캔
   */
  async scanSkill(skillDir: string): Promise<ScannedSkill | null> {
    const skillFile = path.join(skillDir, 'SKILL.md');

    if (!fs.existsSync(skillFile)) {
      return null;
    }

    try {
      const content = fs.readFileSync(skillFile, 'utf-8');
      const { data, content: body } = matter(content);

      // 메타데이터 파싱
      const metadata = this.parseMetadata(data, skillDir);
      if (!metadata) {
        return null;
      }

      return {
        name: metadata.name,
        dirPath: skillDir,
        filePath: skillFile,
        metadata,
        content: body.trim(),
      };
    } catch {
      return null;
    }
  }

  /**
   * 특정 스킬 존재 확인
   */
  hasSkill(name: string): boolean {
    const skillDir = path.join(this.skillsDir, name);
    const skillFile = path.join(skillDir, 'SKILL.md');
    return fs.existsSync(skillFile);
  }

  /**
   * 특정 스킬 가져오기
   */
  async getSkill(name: string): Promise<ScannedSkill | null> {
    const skillDir = path.join(this.skillsDir, name);
    if (!fs.existsSync(skillDir)) {
      return null;
    }
    return this.scanSkill(skillDir);
  }

  /**
   * 메타데이터 파싱
   */
  private parseMetadata(data: Record<string, unknown>, skillDir: string): SkillMetadata | null {
    try {
      // allowed-tools가 문자열이면 배열로 변환
      if (typeof data['allowed-tools'] === 'string') {
        data['allowed-tools'] = data['allowed-tools'].split(',').map((t: string) => t.trim());
      }

      const result = SkillMetadataSchema.safeParse(data);
      if (result.success) {
        return result.data;
      }

      // name이 없으면 디렉토리명에서 추출
      const dirName = path.basename(skillDir);
      const withName = { ...data, name: data.name ?? dirName };
      const retryResult = SkillMetadataSchema.safeParse(withName);

      if (retryResult.success) {
        return retryResult.data;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * 스킬 디렉토리 경로
   */
  getSkillsDir(): string {
    return this.skillsDir;
  }

  /**
   * 스킬 디렉토리 경로 생성
   */
  getSkillDirPath(name: string): string {
    return path.join(this.skillsDir, name);
  }

  /**
   * 스킬 파일 경로 생성
   */
  getSkillFilePath(name: string): string {
    return path.join(this.skillsDir, name, 'SKILL.md');
  }
}
