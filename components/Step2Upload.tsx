
import React, { useRef, useState } from 'react';
import { PhotoSet } from '../types';
import { fileToBase64 } from '../utils';
import { Plus, X, ArrowLeft, UploadCloud, Trash2, GripVertical } from 'lucide-react';

interface Step2UploadProps {
  photoSets: PhotoSet[];
  setPhotoSets: React.Dispatch<React.SetStateAction<PhotoSet[]>>;
  onBack: () => void;
  onNext: () => void;
}

export const Step2Upload: React.FC<Step2UploadProps> = ({ photoSets, setPhotoSets, onBack, onNext }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadMode, setUploadMode] = useState<'two' | 'three'>('two');
  const [draggedPhoto, setDraggedPhoto] = useState<{ setId: string; position: 'before' | 'middle' | 'after' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const threePhotoInputRef = useRef<HTMLInputElement>(null);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'two' | 'three') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const fileArray = Array.from(files).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    const uploadedSets: PhotoSet[] = [];
    const groupSize = mode === 'three' ? 3 : 2;

    for (let i = 0; i < fileArray.length; i += groupSize) {
      const beforeFile = fileArray[i];
      const middleFile = mode === 'three' ? fileArray[i + 1] : null;
      const afterFile = mode === 'three' ? fileArray[i + 2] : fileArray[i + 1];

      if (!beforeFile) continue;

      const beforeBase64 = await fileToBase64(beforeFile);
      const middleBase64 = middleFile ? await fileToBase64(middleFile) : null;
      const afterBase64 = afterFile ? await fileToBase64(afterFile) : null;

      const newSet: PhotoSet = {
        id: `set-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        before: beforeBase64,
        middle: middleBase64,
        after: afterBase64,
        beforeName: beforeFile.name,
        middleName: middleFile?.name || '',
        afterName: afterFile?.name || '',
        type: mode
      };

      uploadedSets.push(newSet);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    setPhotoSets(prev => {
      const filteredPrev = prev.filter(s => s.before || s.after);
      return [...filteredPrev, ...uploadedSets].slice(0, 10);
    });

    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (threePhotoInputRef.current) threePhotoInputRef.current.value = '';
  };

  const removeSet = (id: string) => {
    setPhotoSets(prev => prev.filter(s => s.id !== id));
  };

  const clearAll = () => {
    setPhotoSets([{ id: 'initial', before: null, after: null, type: 'two' }]);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSets = [...photoSets];
    const draggedItem = newSets[draggedIndex];
    newSets.splice(draggedIndex, 1);
    newSets.splice(index, 0, draggedItem);
    
    setPhotoSets(newSets);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handlePhotoDragStart = (setId: string, position: 'before' | 'middle' | 'after') => {
    setDraggedPhoto({ setId, position });
  };

  const handlePhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePhotoDrop = (setId: string, targetPosition: 'before' | 'middle' | 'after') => {
    if (!draggedPhoto || draggedPhoto.setId !== setId || draggedPhoto.position === targetPosition) {
      setDraggedPhoto(null);
      return;
    }

    setPhotoSets(prev => prev.map(set => {
      if (set.id !== setId) return set;

      const photos: { [key: string]: string | null | undefined } = {
        before: set.before,
        middle: set.middle,
        after: set.after
      };
      const names: { [key: string]: string | undefined } = {
        before: set.beforeName,
        middle: set.middleName,
        after: set.afterName
      };

      const tempPhoto = photos[draggedPhoto.position];
      const tempName = names[draggedPhoto.position];
      photos[draggedPhoto.position] = photos[targetPosition];
      names[draggedPhoto.position] = names[targetPosition];
      photos[targetPosition] = tempPhoto;
      names[targetPosition] = tempName;

      return {
        ...set,
        before: photos.before,
        middle: photos.middle,
        after: photos.after,
        beforeName: names.before || '',
        middleName: names.middle || '',
        afterName: names.after || ''
      };
    }));

    setDraggedPhoto(null);
  };

  const handlePhotoDragEnd = () => {
    setDraggedPhoto(null);
  };

  const isAnyUploaded = photoSets.some(s => s.before && s.after);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#1A1D2E]">시공 사진 업로드</h2>
        <p className="text-gray-500 mt-2 text-sm">
          사진들을 한꺼번에 선택하세요. <b>파일 이름 순으로 자동 정렬</b>됩니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="group relative h-40 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-[#FF6B35] hover:bg-[#FF6B35]/5 transition-all cursor-pointer overflow-hidden shadow-sm"
        >
          <input 
            ref={fileInputRef}
            type="file" 
            multiple 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleBulkUpload(e, 'two')}
          />
          {isProcessing ? (
            <div className="flex flex-col items-center animate-pulse">
              <UploadCloud className="w-8 h-8 text-[#FF6B35] mb-2" />
              <span className="text-xs font-bold text-[#FF6B35]">처리 중...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center group-hover:scale-105 transition-transform px-4 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-2 group-hover:bg-white shadow-sm transition-colors">
                <Plus className="w-6 h-6 text-[#FF6B35]" />
              </div>
              <span className="text-sm font-bold text-[#1A1D2E]">Before / After</span>
              <span className="text-xs text-gray-400 mt-1">2장씩 자동 짝지어짐</span>
            </div>
          )}
        </div>

        <div 
          onClick={() => threePhotoInputRef.current?.click()}
          className="group relative h-40 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-[#3B82F6] hover:bg-[#3B82F6]/5 transition-all cursor-pointer overflow-hidden shadow-sm"
        >
          <input 
            ref={threePhotoInputRef}
            type="file" 
            multiple 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleBulkUpload(e, 'three')}
          />
          {isProcessing ? (
            <div className="flex flex-col items-center animate-pulse">
              <UploadCloud className="w-8 h-8 text-[#3B82F6] mb-2" />
              <span className="text-xs font-bold text-[#3B82F6]">처리 중...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center group-hover:scale-105 transition-transform px-4 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-2 group-hover:bg-white shadow-sm transition-colors">
                <Plus className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <span className="text-sm font-bold text-[#1A1D2E]">Before / Middle / After</span>
              <span className="text-xs text-gray-400 mt-1">3장씩 자동 짝지어짐</span>
            </div>
          )}
        </div>
      </div>

      {photoSets.some(s => s.before || s.after) && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-bold text-[#1A1D2E]">
              생성된 세트 ({photoSets.filter(s => s.before || s.after).length})
              <span className="text-xs text-gray-400 ml-2">세트 순서 변경: 좌측 핸들 드래그 | 사진 위치 변경: 사진 드래그</span>
            </span>
            <button 
              onClick={clearAll}
              className="text-xs font-semibold text-red-500 hover:underline flex items-center"
            >
              <Trash2 className="w-3 h-3 mr-1" /> 전체 삭제
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {photoSets.map((set, index) => {
              if (!set.before && !set.after) return null;
              const imageCount = [set.before, set.middle, set.after].filter(Boolean).length;
              const gridCols = imageCount === 3 ? 'grid-cols-3' : 'grid-cols-2';
              
              return (
                <div 
                  key={set.id} 
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 relative group transition-all ${
                    draggedIndex === index ? 'opacity-50 scale-95 border-[#FF6B35] border-dashed' : 'hover:border-[#FF6B35]/30'
                  }`}
                >
                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                      onClick={() => removeSet(set.id)}
                      className="bg-white text-red-500 p-1.5 rounded-full shadow-md border border-gray-100 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-50 rounded-lg transition-colors">
                    <GripVertical className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
                  </div>
                  
                  <div className="text-xs font-black text-gray-300 w-6 italic">#{index + 1}</div>
                  
                  <div className={`flex-1 grid gap-3 ${gridCols}`}>
                    <div 
                      className={`relative cursor-grab active:cursor-grabbing transition-all ${
                        draggedPhoto?.setId === set.id && draggedPhoto?.position === 'before' ? 'opacity-50 scale-95' : ''
                      }`}
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); handlePhotoDragStart(set.id, 'before'); }}
                      onDragOver={handlePhotoDragOver}
                      onDrop={() => handlePhotoDrop(set.id, 'before')}
                      onDragEnd={handlePhotoDragEnd}
                    >
                      <div className={`aspect-[4/3] rounded-xl overflow-hidden bg-gray-50 border-2 transition-all ${
                        draggedPhoto?.setId === set.id && draggedPhoto?.position !== 'before' ? 'border-[#FF6B35] border-dashed' : 'border-gray-100'
                      }`}>
                        {set.before ? (
                          <img src={set.before} className="w-full h-full object-cover pointer-events-none" alt="Before" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">No Image</div>
                        )}
                      </div>
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-bold rounded">BEFORE</div>
                    </div>

                    {set.middle && (
                      <div 
                        className={`relative cursor-grab active:cursor-grabbing transition-all ${
                          draggedPhoto?.setId === set.id && draggedPhoto?.position === 'middle' ? 'opacity-50 scale-95' : ''
                        }`}
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); handlePhotoDragStart(set.id, 'middle'); }}
                        onDragOver={handlePhotoDragOver}
                        onDrop={() => handlePhotoDrop(set.id, 'middle')}
                        onDragEnd={handlePhotoDragEnd}
                      >
                        <div className={`aspect-[4/3] rounded-xl overflow-hidden bg-gray-50 border-2 transition-all ${
                          draggedPhoto?.setId === set.id && draggedPhoto?.position !== 'middle' ? 'border-[#3B82F6] border-dashed' : 'border-gray-100'
                        }`}>
                          <img src={set.middle} className="w-full h-full object-cover pointer-events-none" alt="Middle" />
                        </div>
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#3B82F6] text-white text-[8px] font-bold rounded">MIDDLE</div>
                      </div>
                    )}

                    <div 
                      className={`relative cursor-grab active:cursor-grabbing transition-all ${
                        draggedPhoto?.setId === set.id && draggedPhoto?.position === 'after' ? 'opacity-50 scale-95' : ''
                      }`}
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); handlePhotoDragStart(set.id, 'after'); }}
                      onDragOver={handlePhotoDragOver}
                      onDrop={() => handlePhotoDrop(set.id, 'after')}
                      onDragEnd={handlePhotoDragEnd}
                    >
                      <div className={`aspect-[4/3] rounded-xl overflow-hidden bg-gray-50 border-2 transition-all ${
                        draggedPhoto?.setId === set.id && draggedPhoto?.position !== 'after' ? 'border-[#FF6B35] border-dashed' : 'border-gray-100'
                      }`}>
                        {set.after ? (
                          <img src={set.after} className="w-full h-full object-cover pointer-events-none" alt="After" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">Waiting...</div>
                        )}
                      </div>
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#FF6B35] text-white text-[8px] font-bold rounded">AFTER</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold flex items-center justify-center hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          이전
        </button>
        <button
          disabled={!isAnyUploaded || isProcessing || isSubmitting}
          onClick={() => {
            if (isSubmitting) return;
            setIsSubmitting(true);
            Promise.resolve(onNext()).finally(() => setIsSubmitting(false));
          }}
          className={`flex-[2] py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] ${
            isAnyUploaded && !isProcessing && !isSubmitting ? 'bg-[#FF6B35] hover:bg-[#e85a2a]' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? '처리 중...' : 'AI 생성 시작하기 ▶'}
        </button>
      </div>
    </div>
  );
};
