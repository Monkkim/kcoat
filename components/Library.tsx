import React, { useState, useEffect, useRef } from 'react';
import { FileText, Calendar, Trash2, Eye, Copy, Search, RefreshCw, Loader2, Check, Pencil, Save, X } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  content: string;
  buildingName: string | null;
  workDate: string | null;
  productType: string | null;
  hashtags: string | null;
  status: string;
  createdAt: string;
}

export const Library: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGeneratingMessage, setShowGeneratingMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPosts();
    
    pollingRef.current = setInterval(() => {
      fetchPosts(false);
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedPost) {
      const updated = posts.find(p => p.id === selectedPost.id);
      if (updated && updated.status !== selectedPost.status) {
        setSelectedPost(updated);
      }
    }
  }, [posts, selectedPost]);

  const fetchPosts = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch('/api/blog-posts', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const deletePost = async (id: number) => {
    if (!confirm('정말로 이 글을 삭제하시겠습니까?')) return;
    
    try {
      const res = await fetch(`/api/blog-posts/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== id));
        if (selectedPost?.id === id) {
          setSelectedPost(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const copyContent = async (content: string) => {
    try {
      const centeredContent = `<div style="text-align: center;">${content}</div>`;
      const blob = new Blob([centeredContent], { type: 'text/html' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': blob })
      ]);
      alert('클립보드에 복사되었습니다!');
    } catch (err) {
      await navigator.clipboard.writeText(content);
      alert('텍스트로 복사되었습니다!');
    }
  };

  const startEditing = () => {
    if (selectedPost) {
      setEditContent(selectedPost.content);
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!selectedPost || !editorRef.current) return;
    
    setIsSaving(true);
    try {
      const newContent = editorRef.current.innerHTML;
      const res = await fetch(`/api/blog-posts/${selectedPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newContent })
      });
      
      if (res.ok) {
        const updatedPost = { ...selectedPost, content: newContent };
        setSelectedPost(updatedPost);
        setPosts(posts.map(p => p.id === selectedPost.id ? updatedPost : p));
        setIsEditing(false);
        alert('수정이 저장되었습니다!');
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('Failed to save:', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.buildingName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAF9F6]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#FF6B35] animate-spin mx-auto mb-4" />
          <p className="text-gray-500">라이브러리 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#FAF9F6] flex">
      <div className="w-96 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-black text-[#1A1D2E] mb-4">라이브러리</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredPosts.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">저장된 블로그 글이 없습니다</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredPosts.map(post => (
                <li
                  key={post.id}
                  onClick={() => {
                    if (post.status === 'generating') {
                      setShowGeneratingMessage(true);
                      setTimeout(() => setShowGeneratingMessage(false), 2000);
                    } else {
                      setSelectedPost(post);
                    }
                  }}
                  className={`p-4 cursor-pointer transition-all hover:bg-gray-50 group ${
                    selectedPost?.id === post.id ? 'bg-[#FF6B35]/5 border-l-4 border-[#FF6B35]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-[#1A1D2E] text-sm line-clamp-2 flex-1">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      {post.status === 'generating' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full whitespace-nowrap">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          생성중
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full whitespace-nowrap">
                          <Check className="w-3 h-3" />
                          완료
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePost(post.id);
                        }}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {post.buildingName && (
                    <p className="text-xs text-gray-500 mb-1">{post.buildingName}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex-1 p-8">
        {selectedPost ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-[#1A1D2E] mb-2">{selectedPost.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {selectedPost.buildingName && (
                    <span>{selectedPost.buildingName}</span>
                  )}
                  {selectedPost.workDate && (
                    <span>시공일: {selectedPost.workDate}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={saveEdit}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-600 transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {isSaving ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-all"
                    >
                      <X className="w-4 h-4" /> 취소
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => copyContent(selectedPost.content)}
                      className="px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#FF5722] transition-all"
                    >
                      <Copy className="w-4 h-4" /> 복사
                    </button>
                    <button
                      onClick={startEditing}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-600 transition-all"
                    >
                      <Pencil className="w-4 h-4" /> 수정
                    </button>
                    <button
                      onClick={() => deletePost(selectedPost.id)}
                      className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" /> 삭제
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <style>{`
                .library-content {
                  color: #000000 !important;
                  font-size: 16px;
                  line-height: 1.6;
                  text-align: center;
                }
                .library-content * {
                  color: #000000 !important;
                }
                .library-content img {
                  max-width: 400px !important;
                  width: auto !important;
                  height: auto !important;
                  max-height: 280px !important;
                  object-fit: contain;
                  display: block;
                  margin: 4px auto !important;
                  border-radius: 8px;
                  border: 1px solid #e5e7eb;
                }
                .library-content div[style*="margin"]:has(img) {
                  margin: 4px 0 !important;
                }
                .library-content h1 {
                  font-size: 22px !important;
                  font-weight: 800 !important;
                  margin-bottom: 8px !important;
                  color: #000000 !important;
                }
                .library-content h2 {
                  font-size: 18px !important;
                  font-weight: 700 !important;
                  margin-top: 12px !important;
                  margin-bottom: 6px !important;
                  color: #000000 !important;
                }
                .library-content p, .library-content div {
                  margin: 8px 0 !important;
                  white-space: pre-wrap;
                  color: #000000 !important;
                }
                .library-content .block {
                  margin: 16px 0 !important;
                  padding: 0 !important;
                  background: transparent !important;
                  border-radius: 0 !important;
                  white-space: pre-wrap;
                  display: block;
                }
                .library-content div[style*="margin"] {
                  margin: 8px 0 !important;
                }
              `}</style>
              {isEditing ? (
                <div
                  ref={editorRef}
                  contentEditable
                  className="library-content outline-none border-2 border-blue-300 rounded-xl p-4 min-h-[400px] bg-blue-50/30"
                  dangerouslySetInnerHTML={{ __html: editContent }}
                  suppressContentEditableWarning
                />
              ) : (
                <div
                  className="library-content"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Eye className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">왼쪽에서 글을 선택하세요</p>
            </div>
          </div>
        )}
      </div>

      {showGeneratingMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-bold">아직 AI가 콘텐츠를 생성하고 있습니다. 잠시만 기다려주세요!</span>
        </div>
      )}
    </div>
  );
};
