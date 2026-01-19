
export const COLORS = {
  primary: '#FF6B35',
  secondary: '#1A1D2E',
  background: '#FAF9F6',
  text: '#2D3436',
  success: '#00B894',
};

export const PRODUCT_OPTIONS = [
  { 
    value: "basic_bioceramic", 
    label: "기본형 바이오세라믹",
    description: "결로 방지 및 항곰팡이 기본 성능"
  },
  { 
    value: "world_class", 
    label: "고급형 월드클래스",
    description: "내곰팡이성, 중금속 불검출 인증"
  },
  { 
    value: "premium_zerostop", 
    label: "프리미엄 제로스탑",
    description: "내곰팡이성, 결로 예방 성능 인증"
  },
  { 
    value: "general_elastic", 
    label: "일반탄성",
    description: "가성비 도장 시공"
  }
];

export const COLOR_OPTIONS = [];

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
export const WEBHOOK_URL = 'https://primary-production-c55d.up.railway.app/webhook/send-email';
