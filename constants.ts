
export const COLORS = {
  primary: '#FF6B35',
  secondary: '#1A1D2E',
  background: '#FAF9F6',
  text: '#2D3436',
  success: '#00B894',
};

export interface ProductCategory {
  label: string;
  value: string;
  subcategories: {
    label: string;
    value: string;
    products: string[];
  }[];
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    label: '주거',
    value: '주거',
    subcategories: [
      {
        label: '탄성코트',
        value: '탄성코트',
        products: ['탄성코트', '바이오세라믹', '월드클래스', '제로스탑', '수성 페인트']
      },
      {
        label: '내부도장',
        value: '내부도장',
        products: ['현관문/방화문', '난간', '방수 페인트', '유성 페인트']
      },
      {
        label: '복도&계단',
        value: '복도&계단',
        products: ['탄성코트', '무늬코트', '수성 페인트']
      }
    ]
  },
  {
    label: '상업',
    value: '상업',
    subcategories: [
      {
        label: '내부도장',
        value: '내부도장',
        products: ['수성 페인트', '유성 페인트', '우드 스테인', '우드 바디쉬', '스타코']
      },
      {
        label: '외부도장',
        value: '외부도장',
        products: ['수성 페인트', '유성 페인트', '스타코', '우드 스테인', '우드 바니쉬', '방수 페인트']
      }
    ]
  },
  {
    label: '바닥',
    value: '바닥',
    subcategories: [
      {
        label: '',
        value: '',
        products: ['에폭시', '마블 에폭시', '솔리드 에폭시', '빈티지 에폭시', '수평몰탈']
      }
    ]
  }
];

export const PRODUCT_OPTIONS = [
  { value: "basic_bioceramic", label: "기본형 바이오세라믹", description: "" },
  { value: "world_class", label: "고급형 월드클래스", description: "" },
  { value: "premium_zerostop", label: "프리미엄 제로스탑", description: "" },
  { value: "general_elastic", label: "일반탄성", description: "" }
];

export const COLOR_OPTIONS: string[] = [];

export const ISSUE_TAGS = [
  "#곰팡이발생",
  "#균열발생/벽지",
  "#진동발생",
  "#벽_박리",
  "#구축인테리어",
  "#결로현상",
  "#도장면박리",
  "#벽면손상"
];

// n8n 웹훅 주소
export const WEBHOOK_URL = 'https://primary-production-c55d.up.railway.app/webhook-test/send-email';
