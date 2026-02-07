import React, { useState, useEffect } from 'react';
import { Shield, Users, Clock, Check, X, UserCog } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  createdAt: string;
}

interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  details: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

const actionTranslations: Record<string, string> = {
  login: '로그인',
  register: '회원가입',
  blog_create: '블로그 생성',
  user_approve: '회원 승인',
  user_reject: '회원 거절',
  set_admin: '관리자 지정',
  remove_admin: '관리자 해제',
};

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/activity-logs', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Error approving user:', err);
    }
  };

  const handleReject = async (userId: number) => {
    if (!confirm('정말 이 회원을 거절(삭제)하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Error rejecting user:', err);
    }
  };

  const handleSetAdmin = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/set-admin`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Error setting admin:', err);
    }
  };

  const handleRemoveAdmin = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/remove-admin`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error('Error removing admin:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingUsers = users.filter((u) => !u.approved);
  const approvedUsers = users.filter((u) => u.approved);

  return (
    <div className="max-w-5xl mx-auto px-6 pt-10 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#FF6B35] rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1D2E]">관리자 페이지</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'users'
              ? 'bg-[#FF6B35] text-white'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          회원 관리
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'logs'
              ? 'bg-[#FF6B35] text-white'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          활동 로그
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-8">
          {pendingUsers.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[#1A1D2E] mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FF6B35]" />
                승인 대기 ({pendingUsers.length})
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-[#FF6B35] font-bold text-sm">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1D2E]">{user.name}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        승인
                      </button>
                      <button
                        onClick={() => handleReject(user.id)}
                        className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        거절
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold text-[#1A1D2E] mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              승인 완료 ({approvedUsers.length})
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {approvedUsers.length === 0 ? (
                <div className="px-6 py-10 text-center text-gray-400">
                  승인된 회원이 없습니다
                </div>
              ) : (
                approvedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1D2E] flex items-center gap-2">
                          {user.name}
                          {user.role === 'admin' && (
                            <span className="text-xs bg-[#FF6B35] text-white px-2 py-0.5 rounded-full">
                              관리자
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' ? (
                        <button
                          onClick={() => handleRemoveAdmin(user.id)}
                          className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-300 transition-colors"
                        >
                          <UserCog className="w-4 h-4" />
                          관리자 해제
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSetAdmin(user.id)}
                          className="flex items-center gap-1 px-4 py-2 bg-[#1A1D2E] text-white rounded-xl text-sm font-bold hover:bg-[#2a2f42] transition-colors"
                        >
                          <UserCog className="w-4 h-4" />
                          관리자 지정
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {logs.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400">
              활동 로그가 없습니다
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="text-xs text-gray-400 w-40 shrink-0">
                    {formatDateTime(log.createdAt)}
                  </div>
                  <div className="w-24 shrink-0">
                    <span className="text-xs font-bold text-[#1A1D2E] bg-gray-100 px-2 py-1 rounded-lg">
                      {log.userName || '-'}
                    </span>
                  </div>
                  <div className="w-28 shrink-0">
                    <span className="text-xs font-bold text-[#FF6B35]">
                      {actionTranslations[log.action] || log.action}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {log.details || '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
