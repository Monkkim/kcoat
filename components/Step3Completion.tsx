import React from 'react';
import { Sparkles, Library, PenLine } from 'lucide-react';

interface Step3CompletionProps {
  onGoToLibrary: () => void;
  onCreateNew: () => void;
}

export const Step3Completion: React.FC<Step3CompletionProps> = ({ onGoToLibrary, onCreateNew }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="bg-white rounded-3xl p-10 max-w-lg w-full shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#FF6B35]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-[#FF6B35]" />
          </div>
          
          <h2 className="text-2xl font-bold text-[#1A1D2E] mb-3">
            AI 글 생성이 시작되었습니다!
          </h2>
          
          <p className="text-gray-500 mb-8 leading-relaxed">
            라이브러리에서 생성 상태를 확인할 수 있습니다.<br />
            생성이 완료되면 글을 편집하고 복사할 수 있습니다.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={onGoToLibrary}
              className="w-full py-4 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#e85a2a] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Library className="w-5 h-5" />
              라이브러리로 이동
            </button>
            
            <button
              onClick={onCreateNew}
              className="w-full py-4 bg-white text-[#1A1D2E] border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
            >
              <PenLine className="w-5 h-5" />
              새 글 작성하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
