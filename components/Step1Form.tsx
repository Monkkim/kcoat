
import React, { useState } from 'react';
import { PRODUCT_CATEGORIES, ISSUE_TAGS } from '../constants';
import { WorkType, KCoatFormData } from '../types';
import { Calendar, Building, MapPin, Package, Palette, Tag, Plus, X, ChevronRight, Pencil } from 'lucide-react';

interface Step1FormProps {
  data: KCoatFormData;
  updateData: (updates: Partial<KCoatFormData>) => void;
  onNext: () => void;
}

export const Step1Form: React.FC<Step1FormProps> = ({ data, updateData, onNext }) => {
  const [customTag, setCustomTag] = useState('');
  const [customProductMode, setCustomProductMode] = useState(false);
  const [customProductInput, setCustomProductInput] = useState('');
  const isFormValid = data.buildingName && data.workDate && data.detailedLocation && data.productType && data.productColor;

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (customTag.trim()) {
      const tag = customTag.startsWith('#') ? customTag.trim() : `#${customTag.trim()}`;
      if (!data.issues.includes(tag)) {
        updateData({ issues: [...data.issues, tag] });
      }
      setCustomTag('');
    }
  };

  const selectedCategory = PRODUCT_CATEGORIES.find(c => c.value === data.productCategory);
  const isFloor = data.productCategory === '바닥';
  const subcategories = selectedCategory?.subcategories || [];
  const selectedSubcategory = subcategories.find(s => s.value === data.productSubcategory);
  const products = isFloor
    ? (subcategories[0]?.products || [])
    : (selectedSubcategory?.products || []);

  const handleCategoryChange = (value: string) => {
    setCustomProductMode(false);
    setCustomProductInput('');
    updateData({
      productCategory: value,
      productSubcategory: '',
      productType: ''
    });
  };

  const handleSubcategoryChange = (value: string) => {
    setCustomProductMode(false);
    setCustomProductInput('');
    updateData({
      productSubcategory: value,
      productType: ''
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#1A1D2E]">시공 현장 정보 입력</h2>
        <p className="text-gray-500 mt-2 text-sm">정확한 정보를 입력할수록 더 정교한 SEO 문서를 작성합니다.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="flex items-center text-sm font-semibold text-[#1A1D2E] mb-2">
            <Building className="w-4 h-4 mr-2 text-[#FF6B35]" />
            시공 아파트/건물명 <span className="text-red-500 ml-1">*</span>
          </label>
          <input 
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
            placeholder="예: 반포 래미안 원베일리"
            value={data.buildingName}
            onChange={(e) => updateData({ buildingName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center text-sm font-semibold text-[#1A1D2E] mb-2">
              <Calendar className="w-4 h-4 mr-2 text-[#FF6B35]" />
              시공 일자 <span className="text-red-500 ml-1">*</span>
            </label>
            <div 
              className="relative cursor-pointer group"
              onClick={() => {
                const input = document.getElementById('workDateInput') as HTMLInputElement;
                if (input) input.showPicker();
              }}
            >
              <input 
                id="workDateInput"
                type="date"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all appearance-none cursor-pointer text-base"
                style={{ fontSize: '1.1rem' }}
                value={data.workDate}
                onChange={(e) => updateData({ workDate: e.target.value })}
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-[#FF6B35] transition-colors pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="flex items-center text-sm font-semibold text-[#1A1D2E] mb-2">
              시공 분류 <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex gap-2">
              {(['remodeling', 'new', 'occupied'] as WorkType[]).map((type) => (
                <button
                  key={type}
                  className={`flex-1 py-3 px-2 text-xs font-medium rounded-xl border transition-all ${
                    data.workType === type 
                      ? 'bg-[#1A1D2E] text-white border-[#1A1D2E]' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#FF6B35]/50'
                  }`}
                  onClick={() => updateData({ workType: type })}
                >
                  {type === 'remodeling' ? '구축/리모델링' : type === 'new' ? '신축' : '거주 세대'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center text-sm font-semibold text-[#1A1D2E] mb-2">
            <MapPin className="w-4 h-4 mr-2 text-[#FF6B35]" />
            상세 시공 위치 <span className="text-red-500 ml-1">*</span>
          </label>
          <input 
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
            placeholder="예: 베란다 3개소, 다용도실 등"
            value={data.detailedLocation}
            onChange={(e) => updateData({ detailedLocation: e.target.value })}
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-semibold text-[#1A1D2E] mb-2">
            <Package className="w-4 h-4 mr-2 text-[#FF6B35]" />
            시공 제품 선택 <span className="text-red-500 ml-1">*</span>
          </label>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              {PRODUCT_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`flex-1 py-3 px-3 text-sm font-medium rounded-xl border transition-all ${
                    data.productCategory === cat.value
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-md'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#FF6B35]/50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {data.productCategory && !isFloor && subcategories.length > 0 && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {subcategories.map(sub => (
                  <button
                    key={sub.value}
                    onClick={() => handleSubcategoryChange(sub.value)}
                    className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-xl border transition-all ${
                      data.productSubcategory === sub.value
                        ? 'bg-[#1A1D2E] text-white border-[#1A1D2E] shadow-md'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#1A1D2E]/30'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}

            {products.length > 0 && (data.productSubcategory || isFloor) && (
              <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {products.map(product => (
                  <button
                    key={product}
                    onClick={() => { setCustomProductMode(false); updateData({ productType: product }); }}
                    className={`py-2 px-4 text-sm font-medium rounded-full border transition-all ${
                      data.productType === product && !customProductMode
                        ? 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35] font-bold'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#FF6B35]/50'
                    }`}
                  >
                    {product}
                  </button>
                ))}
                <button
                  onClick={() => { setCustomProductMode(true); updateData({ productType: '' }); }}
                  className={`py-2 px-4 text-sm font-medium rounded-full border transition-all flex items-center gap-1.5 ${
                    customProductMode
                      ? 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35] font-bold'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#FF6B35]/50'
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  직접 입력
                </button>
              </div>
            )}

            {customProductMode && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-[#FF6B35] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 transition-all"
                  placeholder="제품명을 직접 입력해주세요"
                  value={customProductInput}
                  onChange={(e) => {
                    setCustomProductInput(e.target.value);
                    updateData({ productType: e.target.value });
                  }}
                  autoFocus
                />
              </div>
            )}

            {data.productType && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 animate-in fade-in duration-300">
                <span className="text-[#FF6B35] font-medium">{selectedCategory?.label}</span>
                {!isFloor && selectedSubcategory && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#1A1D2E] font-medium">{selectedSubcategory.label}</span>
                  </>
                )}
                <ChevronRight className="w-3 h-3" />
                <span className="font-bold text-gray-700">{data.productType}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center text-sm font-semibold text-[#1A1D2E] mb-2">
              <Palette className="w-4 h-4 mr-2 text-[#FF6B35]" />
              제품 색상 <span className="text-red-500 ml-1">*</span>
            </label>
            <input 
              type="text"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
              placeholder="예: 진주, 은하수, 라이트그레이"
              value={data.productColor}
              onChange={(e) => updateData({ productColor: e.target.value })}
            />
          </div>

        </div>

        <div>
          <label className="flex items-center text-sm font-semibold text-[#1A1D2E] mb-2">
            <Tag className="w-4 h-4 mr-2 text-[#FF6B35]" />
            현장 주요 이슈 (다중 선택 및 추가 가능)
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {ISSUE_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  const newIssues = data.issues.includes(tag)
                    ? data.issues.filter((i: string) => i !== tag)
                    : [...data.issues, tag];
                  updateData({ issues: newIssues });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  data.issues.includes(tag)
                    ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#FF6B35]/50'
                }`}
              >
                {tag}
              </button>
            ))}
            {data.issues.filter((tag: string) => !ISSUE_TAGS.includes(tag)).map((tag: string) => (
              <div
                key={tag}
                className="flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[#FF6B35] text-white border border-[#FF6B35]"
              >
                {tag}
                <button 
                  onClick={() => updateData({ issues: data.issues.filter((i: string) => i !== tag) })}
                  className="ml-1.5 hover:text-red-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text"
              className="flex-1 px-4 py-2 text-sm rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              placeholder="직접 입력 후 엔터 (예: 결로심함)"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={handleAddCustomTag}
            />
            <button 
              onClick={handleAddCustomTag}
              className="p-2 bg-gray-100 text-gray-500 rounded-2xl hover:bg-[#FF6B35] hover:text-white transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <button
        disabled={!isFormValid}
        onClick={onNext}
        className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] ${
          isFormValid ? 'bg-[#FF6B35] hover:bg-[#e85a2a]' : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        다음 단계: 사진 올리기 ▶
      </button>
    </div>
  );
};
