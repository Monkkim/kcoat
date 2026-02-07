
export type WorkType = 'remodeling' | 'new' | 'occupied';

export interface PhotoSet {
  id: string;
  before: string | null;
  middle?: string | null;
  after: string | null;
  beforeName?: string;
  middleName?: string;
  afterName?: string;
  type: 'two' | 'three';
}

export interface KCoatFormData {
  buildingName: string;
  workDate: string;
  workType: WorkType;
  detailedLocation: string;
  productCategory: string;
  productSubcategory: string;
  productType: string;
  productColor: string;
  workHours: number;
  issues: string[];
  useWatermark: boolean;
  photoSets: { before: string; middle?: string | null; after: string; type: 'two' | 'three' }[];
}

export type BlockType = 'text' | 'image';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string; // 텍스트 내용 또는 이미지 URL/Base64
  sectionType?: string; // Section type from AI (header, intro, product, etc.)
}

export interface N8NSection {
  type: string; // header, intro, product, opening, usp, faq, tech, philosophy, process, recap, closing
  content: string;
}

export interface N8NResponse {
  success: boolean;
  html?: string; // deprecated, use sections instead
  sections?: N8NSection[];
  title?: string;
  images?: string[]; // Array of image URLs or HTML
  hashtags?: string;
}

export enum GenerationStep {
  PREPROCESS = 'preprocess',
  IMAGE_GEN = 'imageGen',
  WATERMARK = 'watermark',
  TEXT_GEN = 'textGen',
  ASSEMBLY = 'assembly'
}

export interface ProgressState {
  id: GenerationStep;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: string;
}
