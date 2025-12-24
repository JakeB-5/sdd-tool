/**
 * 검색 모듈 타입 정의
 */

/**
 * 검색 옵션
 */
export interface SearchOptions {
  /** 전문 검색 쿼리 */
  query?: string;
  /** 정규식 사용 여부 */
  regex?: boolean;
  /** 대소문자 구분 여부 */
  caseSensitive?: boolean;
  /** 상태 필터 */
  status?: string | string[];
  /** Phase 필터 */
  phase?: string | string[];
  /** 작성자 필터 */
  author?: string;
  /** 생성일 이후 */
  createdAfter?: string;
  /** 생성일 이전 */
  createdBefore?: string;
  /** 수정일 이후 */
  updatedAfter?: string;
  /** 수정일 이전 */
  updatedBefore?: string;
  /** 의존성 필터 (이 스펙에 의존하는) */
  dependsOn?: string;
  /** 역의존성 필터 (이 스펙을 의존하는) */
  dependedBy?: string;
  /** 태그 필터 */
  tags?: string[];
  /** 결과 제한 */
  limit?: number;
  /** 정렬 기준 */
  sortBy?: 'relevance' | 'created' | 'updated' | 'title' | 'status';
  /** 정렬 방향 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 검색 결과 항목
 */
export interface SearchResultItem {
  /** 스펙 ID */
  id: string;
  /** 스펙 경로 */
  path: string;
  /** 제목 */
  title?: string;
  /** 상태 */
  status?: string;
  /** Phase */
  phase?: string;
  /** 작성자 */
  author?: string;
  /** 생성일 */
  created?: string;
  /** 수정일 */
  updated?: string;
  /** 의존성 */
  depends?: string[];
  /** 태그 */
  tags?: string[];
  /** 컨텐츠 */
  content?: string;
  /** 매칭 점수 (0-100) */
  score: number;
  /** 매칭된 컨텍스트 (전문 검색 시) */
  matches?: SearchMatch[];
}

/**
 * 검색 매칭 정보
 */
export interface SearchMatch {
  /** 매칭된 줄 번호 */
  line: number;
  /** 매칭된 내용 (하이라이트 포함) */
  content: string;
  /** 원본 내용 */
  original: string;
}

/**
 * 검색 결과
 */
export interface SearchResult {
  /** 검색 쿼리 */
  query: string;
  /** 검색 옵션 */
  options: SearchOptions;
  /** 전체 결과 수 */
  totalCount: number;
  /** 결과 항목 */
  items: SearchResultItem[];
  /** 검색 소요 시간 (ms) */
  duration: number;
}

/**
 * 검색 가능한 필드
 */
export type SearchableField =
  | 'title'
  | 'content'
  | 'status'
  | 'phase'
  | 'author'
  | 'tags'
  | 'depends'
  | 'id';

/**
 * 검색 인덱스 항목
 */
export interface SearchIndexItem {
  id: string;
  path: string;
  title: string;
  content: string;
  status: string;
  phase: string;
  author: string;
  created: string;
  updated: string;
  depends: string[];
  tags: string[];
}
