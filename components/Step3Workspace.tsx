
import React, { useState, useEffect } from 'react';
import { N8NResponse, PhotoSet } from '../types';
import { copyRichTextToClipboard } from '../utils';
import { Loader2, Check, Copy, Layout, ArrowLeft, Save, Sparkles, Clock, Image as ImageIcon } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

interface Step3WorkspaceProps {
  isGenerating: boolean;
  result: N8NResponse | null;
  photoSets: PhotoSet[];
  onBack: () => void;
  onComplete: (title: string, content: string) => void;
  title?: string;
}

export const Step3Workspace: React.FC<Step3WorkspaceProps> = ({ isGenerating, result, photoSets, onBack, onComplete, title: initialTitle }) => {
  const [title, setTitle] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    if (result) {
      setTitle(initialTitle || result.title || '');
      setHashtags(result.hashtags || '');

      // HTML 필드가 있으면 에디터에 직접 설정 (가운데 정렬 적용)
      if (result.html) {
        const centeredHtml = `<div style="text-align: center;">${result.html}</div>`;
        setEditorContent(centeredHtml);
      }
      // sections가 있으면 합쳐서 에디터에 설정 (가운데 정렬 적용)
      else if (result.sections && result.sections.length > 0) {
        const combinedHtml = result.sections.map(section => section.content).join('\n');
        const centeredHtml = `<div style="text-align: center;">${combinedHtml}</div>`;
        setEditorContent(centeredHtml);
      }
    }
  }, [result]);

  const handleCopy = async () => {
    // 네이버 블로그용 깔끔한 HTML 생성
    let cleanContent = editorContent
      // 리사이즈 핸들 제거
      .replace(/<div class="resize-handle"[^>]*>[\s\S]*?<\/div>/gi, '')
      // img-resize-wrapper를 이미지만 남기고 제거
      .replace(/<div[^>]*class="img-resize-wrapper"[^>]*>([\s\S]*?)<\/div>/gi, '$1')
      // 모든 class 속성 제거
      .replace(/\s*class="[^"]*"/gi, '')
      // 복잡한 style 속성 제거 (이미지 제외)
      .replace(/<(div|p|span)([^>]*)style="[^"]*"([^>]*)>/gi, '<$1$2$3>')
      // 빈 div 제거
      .replace(/<div>\s*<\/div>/gi, '')
      // div를 p로 변환하고 줄바꿈 추가
      .replace(/<\/div>\s*<div>/gi, '<br><br>')
      .replace(/<div>/gi, '<p>')
      .replace(/<\/div>/gi, '</p>')
      // 연속된 br 정리
      .replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>')
      // p 태그 사이에 줄바꿈 보장
      .replace(/<\/p>\s*<p>/gi, '</p><br><br><p>');
    
    const finalHtml = `<p style="text-align: center; font-size: 24px; font-weight: bold;">${title}</p>
<br><br>
${cleanContent}
<br><br>
<p style="color: #666; font-size: 14px;">${hashtags}</p>`;
    
    const success = await copyRichTextToClipboard(finalHtml);
    if (success) {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {isGenerating && (
        <div className="bg-[#1A1D2E] text-white p-6 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Loader2 className="w-8 h-8 mr-4 text-[#FF6B35] animate-spin" />
              <div>
                <h3 className="font-black text-lg">AI가 콘텐츠를 생성하고 있습니다</h3>
                <p className="text-gray-400 text-sm">텍스트와 이미지를 함께 처리 중입니다</p>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold border border-white/20">
                처리 중...
              </div>
            </div>
          </div>
          {editorContent && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center text-sm">
                <Check className="w-4 h-4 mr-2 text-green-400" />
                <span className="text-gray-300">콘텐츠 생성 완료</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-[#1A1D2E] flex items-center">
            <Sparkles className="w-6 h-6 mr-3 text-[#FF6B35]" />
            블로그 에디터 워크스페이스
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button 
              onClick={() => onComplete(title, editorContent)}
              disabled={isGenerating || !editorContent}
              className="px-6 py-2.5 bg-[#1A1D2E] text-white rounded-xl text-sm font-black flex items-center justify-center hover:bg-black transition-all shadow-xl disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" /> 작업 완료 및 저장
            </button>
            <button 
              onClick={handleCopy}
              disabled={!editorContent}
              className={`px-8 py-2.5 rounded-xl text-sm font-black text-white shadow-xl flex items-center transition-all transform active:scale-95 ${
                copyStatus === 'copied' ? 'bg-green-500' : 'bg-[#FF6B35] hover:bg-[#e85a2a]'
              } ${!editorContent ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {copyStatus === 'copied' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copyStatus === 'copied' ? '복사 완료' : '네이버 블로그로 복사'}
            </button>
          </div>
          <button onClick={onBack} className="px-5 py-2.5 bg-gray-50 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all flex items-center border border-gray-100">
            <ArrowLeft className="w-4 h-4 mr-2" /> 나가기
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 items-start">
        
        {/* 본문 에디터 */}
        <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden min-h-[900px] max-w-4xl mx-auto w-full">
          <div className="bg-[#1A1D2E] px-10 py-4 flex items-center justify-between">
            <div className="flex items-center text-white/50 text-[10px] font-black uppercase tracking-widest">
              <Layout className="w-3 h-3 mr-2" /> Live Workspace
            </div>
          </div>

          <div className="p-12 space-y-8">
            <div className="group">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">Post Title</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full text-3xl font-black text-[#1A1D2E] border-none outline-none bg-transparent placeholder-gray-100"
              />
              <div className="h-1 w-20 bg-[#FF6B35] mt-4 rounded-full" />
            </div>

            <div className="space-y-1">
              {!editorContent && isGenerating && (
                <div className="py-20 flex flex-col items-center justify-center text-gray-300">
                  <Loader2 className="w-12 h-12 mb-4 text-[#FF6B35] animate-spin" />
                  <p className="text-lg font-bold text-[#1A1D2E] mb-2">AI가 블로그 콘텐츠를 생성하고 있습니다</p>
                  <p className="text-sm italic">잠시만 기다려 주세요...</p>
                </div>
              )}

              {!editorContent && !isGenerating && (
                <div className="py-20 flex flex-col items-center justify-center text-gray-300">
                  <Clock className="w-10 h-10 mb-2 animate-pulse" />
                  <p className="italic">데이터를 기다리는 중...</p>
                </div>
              )}
              
              {editorContent && (
                <RichTextEditor 
                  content={editorContent} 
                  onChange={setEditorContent} 
                />
              )}
            </div>

            <div className="mt-20 pt-10 border-t border-gray-100">
              <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">SEO Hashtags</div>
              <textarea 
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full bg-gray-50 p-6 rounded-[24px] text-sm font-mono text-gray-500 border-none outline-none focus:ring-2 focus:ring-[#FF6B35]/10 transition-all"
                rows={3}
              />
            </div>

            {photoSets.filter(s => s.before || s.after).length > 0 && (
              <div className="mt-10 pt-10 border-t border-gray-100">
                <div className="flex items-center mb-6">
                  <ImageIcon className="w-4 h-4 mr-2 text-[#FF6B35]" />
                  <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">업로드된 사진 ({photoSets.filter(s => s.before || s.after).length}세트)</div>
                </div>
                <p className="text-xs text-gray-400 mb-4">아래 사진을 클릭하여 에디터로 드래그하거나, 복사하여 본문에 붙여넣으세요.</p>
                <div className="grid grid-cols-1 gap-6">
                  {photoSets.filter(s => s.before || s.after).map((set, index) => (
                    <div key={set.id} className="bg-gray-50 p-4 rounded-2xl">
                      <div className="text-xs font-bold text-gray-400 mb-3">세트 #{index + 1}</div>
                      {(() => {
                        const imageCount = [set.before, set.middle, set.after].filter(Boolean).length;
                        const gridCols = imageCount === 3 ? 'grid-cols-3' : 'grid-cols-2';
                        return (
                          <div className={`grid gap-3 ${gridCols}`}>
                            {set.before && (
                              <div className="relative group">
                                <img 
                                  src={set.before} 
                                  alt={`Before ${index + 1}`}
                                  className="w-full aspect-[4/3] object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                                  draggable
                                />
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] font-bold rounded">BEFORE</div>
                              </div>
                            )}
                            {set.middle && (
                              <div className="relative group">
                                <img 
                                  src={set.middle} 
                                  alt={`Middle ${index + 1}`}
                                  className="w-full aspect-[4/3] object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                                  draggable
                                />
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-[#3B82F6] text-white text-[10px] font-bold rounded">MIDDLE</div>
                              </div>
                            )}
                            {set.after && (
                              <div className="relative group">
                                <img 
                                  src={set.after} 
                                  alt={`After ${index + 1}`}
                                  className="w-full aspect-[4/3] object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                                  draggable
                                />
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-[#FF6B35] text-white text-[10px] font-bold rounded">AFTER</div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
