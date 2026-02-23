
import React, { useState, useEffect } from 'react';
import { N8NResponse, ContentBlock } from '../types';
// Fixed: Changed copyToClipboard to copyRichTextToClipboard to match exports in utils.ts
import { copyRichTextToClipboard, sanitizeHtml } from '../utils';
import { Check, Copy, RefreshCw, Save, Hash, GripVertical, Trash2, Plus, Type } from 'lucide-react';

interface Step4ResultProps {
  result: N8NResponse | null;
  onRegenerate: () => void;
}

export const Step4Result: React.FC<Step4ResultProps> = ({ result, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [title, setTitle] = useState('');
  const [draggedImage, setDraggedImage] = useState<string | null>(null);

  useEffect(() => {
    if (result) {
      setTitle(result.title);
      // HTML을 간단한 텍스트 블록들로 분리 (p, h3 태그 기준)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sanitizeHtml(result.html);
      const initialBlocks: ContentBlock[] = [];
      
      Array.from(tempDiv.children).forEach((child, idx) => {
        initialBlocks.push({
          id: `block-${idx}`,
          type: 'text',
          content: child.outerHTML
        });
      });
      
      setBlocks(initialBlocks);
    }
  }, [result]);

  if (!result) return <div className="p-20 text-center text-gray-400">결과를 불러오지 못했습니다.</div>;

  const handleCopy = async () => {
    // 블록들을 하나의 HTML로 합치기
    const finalHtml = `
      <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.8; color: #333;">
        <h1 style="font-size: 24px; color: #FF6B35; border-bottom: 2px solid #FF6B35; padding-bottom: 10px; margin-bottom: 30px;">${title}</h1>
        ${blocks.map(block => {
          if (block.type === 'text') return block.content;
          return `<div style="text-align: center; margin: 30px 0;"><img src="${block.content}" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" /></div>`;
        }).join('')}
        <div style="margin-top: 50px; color: #888; font-size: 14px;">${result.hashtags}</div>
      </div>
    `;
    
    // Fixed: Using copyRichTextToClipboard instead of copyToClipboard
    const success = await copyRichTextToClipboard(finalHtml);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const updateBlockContent = (id: string, newContent: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: newContent } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const onDrop = (index: number) => {
    if (draggedImage) {
      const newBlock: ContentBlock = {
        id: `img-${Math.random()}`,
        type: 'image',
        content: draggedImage
      };
      const newBlocks = [...blocks];
      newBlocks.splice(index, 0, newBlock);
      setBlocks(newBlocks);
      setDraggedImage(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1D2E]">블로그 포스팅 검토</h2>
          <p className="text-gray-500 text-sm mt-1">오른쪽 사진을 원하는 위치로 드래그하여 본문에 삽입하세요.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRegenerate} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center shadow-sm">
            <RefreshCw className="w-4 h-4 mr-2" /> 다시 하기
          </button>
          <button onClick={handleCopy} className={`px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center ${copied ? 'bg-green-500' : 'bg-[#FF6B35] hover:bg-[#e85a2a]'}`}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? '복사 완료!' : '블로그로 복사 (HTML)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        
        {/* Left: Editor Area */}
        <div className="space-y-4 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 min-h-[800px]">
          {/* Title Area */}
          <div className="mb-8">
            <label className="text-[10px] font-black text-[#FF6B35] uppercase tracking-widest mb-1 block">Blog Title</label>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold text-[#1A1D2E] border-b-2 border-gray-50 focus:border-[#FF6B35] outline-none py-2 bg-transparent transition-colors"
              placeholder="블로그 제목을 입력하세요"
            />
          </div>

          {/* Blocks List */}
          <div className="space-y-1">
            <DropZone onDrop={() => onDrop(0)} />
            {blocks.map((block, idx) => (
              <React.Fragment key={block.id}>
                <div className="group relative flex items-start gap-4 p-2 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                    <GripVertical className="w-4 h-4 text-gray-300 cursor-move" />
                    <button onClick={() => removeBlock(block.id)} className="text-red-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1">
                    {block.type === 'text' ? (
                      <div 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlockContent(block.id, e.currentTarget.innerHTML)}
                        className="outline-none prose prose-orange max-w-none min-h-[1em] py-2 leading-relaxed text-[#2D3436]"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
                      />
                    ) : (
                      <div className="my-4 relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        <img src={block.content} className="w-full h-auto" alt="Inserted" />
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-[10px] font-bold rounded backdrop-blur-md">IMAGE BLOCK</div>
                      </div>
                    )}
                  </div>
                </div>
                <DropZone onDrop={() => onDrop(idx + 1)} />
              </React.Fragment>
            ))}
          </div>

          <div className="pt-10 border-t border-gray-50 mt-10">
            <div className="flex items-center text-sm font-bold text-[#FF6B35] mb-2">
              <Hash className="w-4 h-4 mr-1" /> 해시태그
            </div>
            <div className="text-xs text-gray-400 font-mono bg-gray-50 p-4 rounded-xl leading-relaxed">
              {result.hashtags}
            </div>
          </div>
        </div>

        {/* Right: Image Bank Area */}
        <div className="sticky top-28 space-y-4">
          <div className="bg-[#1A1D2E] text-white p-5 rounded-[24px] shadow-xl">
            <h3 className="text-sm font-bold mb-1 flex items-center">
              <ImageIcon className="w-4 h-4 mr-2 text-[#FF6B35]" /> 이미지 보관함
            </h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Drag to insert into post</p>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              {(result.images ?? []).map((img, idx) => (
                <div 
                  key={idx}
                  draggable
                  onDragStart={() => setDraggedImage(img.base64 || img.url)}
                  className="aspect-square bg-white/5 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing hover:ring-2 ring-[#FF6B35] transition-all group relative"
                >
                  <img src={img.base64 || img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-1 right-1 p-1 bg-white/10 backdrop-blur-md rounded border border-white/20">
                    <GripVertical className="w-3 h-3 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm">
            <h4 className="text-xs font-bold text-[#1A1D2E] mb-2 flex items-center">
              <Type className="w-4 h-4 mr-2 text-blue-500" /> 편집 도움말
            </h4>
            <ul className="text-[11px] text-gray-500 space-y-2">
              <li>• 본문 텍스트는 클릭하여 직접 수정이 가능합니다.</li>
              <li>• 우측 이미지를 끌어서 본문 사이 빈 공간에 놓으세요.</li>
              <li>• [HTML 복사] 클릭 시 블로그 전용 서식이 유지됩니다.</li>
            </ul>
          </div>

          <button className="w-full py-4 bg-[#1A1D2E] text-white rounded-2xl font-bold flex items-center justify-center hover:bg-black transition-all shadow-lg group">
            <Save className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            최종 저장 및 게시
          </button>
        </div>

      </div>
    </div>
  );
};

// Helper component for drop zones
const DropZone: React.FC<{ onDrop: () => void }> = ({ onDrop }) => {
  const [isOver, setIsOver] = useState(false);

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsOver(false); onDrop(); }}
      className={`h-4 my-1 rounded-lg transition-all flex items-center justify-center border-2 border-dashed ${
        isOver 
          ? 'bg-[#FF6B35]/10 border-[#FF6B35] h-12 opacity-100' 
          : 'border-transparent opacity-0 hover:opacity-100 hover:border-gray-200'
      }`}
    >
      <Plus className={`w-4 h-4 text-[#FF6B35] ${isOver ? 'scale-125' : ''} transition-transform`} />
      {isOver && <span className="text-[10px] font-bold text-[#FF6B35] ml-2 uppercase">Drop here to insert image</span>}
    </div>
  );
};

const ImageIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);
