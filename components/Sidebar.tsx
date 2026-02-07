import React from 'react';
import { PenSquare, Library, Sparkles, Shield } from 'lucide-react';

interface SidebarProps {
  activeMenu: 'create' | 'library' | 'admin';
  onMenuChange: (menu: 'create' | 'library' | 'admin') => void;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeMenu, onMenuChange, isAdmin }) => {
  return (
    <div className="w-64 bg-[#1A1D2E] min-h-screen flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B35] to-[#FF8F35] rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-lg">K-COAT</h1>
            <p className="text-gray-400 text-xs">STUDIO</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onMenuChange('create')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeMenu === 'create'
                  ? 'bg-[#FF6B35] text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <PenSquare className="w-5 h-5" />
              <span className="font-bold">블로그 생성하기</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onMenuChange('library')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeMenu === 'library'
                  ? 'bg-[#FF6B35] text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Library className="w-5 h-5" />
              <span className="font-bold">라이브러리</span>
            </button>
          </li>
          {isAdmin && (
            <li>
              <button
                onClick={() => onMenuChange('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeMenu === 'admin'
                    ? 'bg-[#FF6B35] text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="font-bold">관리자</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-gray-500 text-xs text-center">K-COAT Studio v1.0</p>
      </div>
    </div>
  );
};
