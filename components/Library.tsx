import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Trash2, Eye, Copy, Search, RefreshCw } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  content: string;
  buildingName: string | null;
  workDate: string | null;
  productType: string | null;
  createdAt: string;
}

export const Library: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/blog-posts', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
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
      const blob = new Blob([content], { type: 'text/html' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': blob })
      ]);
      alert('클립보드에 복사되었습니다!');
    } catch (err) {
      await navigator.clipboard.writeText(content);
      alert('텍스트로 복사되었습니다!');
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
                  onClick={() => setSelectedPost(post)}
                  className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                    selectedPost?.id === post.id ? 'bg-[#FF6B35]/5 border-l-4 border-[#FF6B35]' : ''
                  }`}
                >
                  <h3 className="font-bold text-[#1A1D2E] text-sm line-clamp-2 mb-1">
                    {post.title}
                  </h3>
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
                <button
                  onClick={() => copyContent(selectedPost.content)}
                  className="px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#FF5722] transition-all"
                >
                  <Copy className="w-4 h-4" /> 복사
                </button>
                <button
                  onClick={() => deletePost(selectedPost.id)}
                  className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> 삭제
                </button>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <style>{`
                .library-content {
                  color: #000000 !important;
                  font-size: 16px;
                  line-height: 1.6;
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
              <div
                className="library-content"
                dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              />
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
    </div>
  );
};
