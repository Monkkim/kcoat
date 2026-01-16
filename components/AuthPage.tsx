import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (user: { id: number; name: string; email: string }) => void;
}

type AuthMode = 'login' | 'register' | 'forgot-password';

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('비밀번호가 일치하지 않습니다');
        }
        
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password
          })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '회원가입에 실패했습니다');
        onLoginSuccess(data);
        
      } else if (mode === 'login') {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '로그인에 실패했습니다');
        onLoginSuccess(data);
        
      } else if (mode === 'forgot-password') {
        const res = await fetch('/api/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '비밀번호 재설정에 실패했습니다');
        setSuccessMessage(data.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] to-[#FFF5F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#FF6B35] rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl">🎨</span>
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-[#1A1D2E]">K-COAT</span>{' '}
              <span className="text-[#FF6B35]">STUDIO</span>
            </h1>
          </div>
          <p className="text-gray-500">블로그 자동화 대시보드</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-[#1A1D2E] mb-6 text-center">
            {mode === 'login' && '로그인'}
            {mode === 'register' && '회원가입'}
            {mode === 'forgot-password' && '비밀번호 찾기'}
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  이름
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="홍길동"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@email.com"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
              />
            </div>

            {mode !== 'forgot-password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="6자 이상 입력"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="비밀번호 재입력"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF6B35] text-white py-4 rounded-xl font-bold hover:bg-[#e55a2b] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' && '로그인'}
                  {mode === 'register' && '회원가입'}
                  {mode === 'forgot-password' && '비밀번호 재설정 링크 받기'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
            {mode === 'login' && (
              <>
                <p>
                  계정이 없으신가요?{' '}
                  <button 
                    onClick={() => switchMode('register')} 
                    className="text-[#FF6B35] font-medium hover:underline"
                  >
                    회원가입
                  </button>
                </p>
                <p>
                  <button 
                    onClick={() => switchMode('forgot-password')} 
                    className="text-gray-400 hover:text-gray-600 hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                </p>
              </>
            )}
            {mode === 'register' && (
              <p>
                이미 계정이 있으신가요?{' '}
                <button 
                  onClick={() => switchMode('login')} 
                  className="text-[#FF6B35] font-medium hover:underline"
                >
                  로그인
                </button>
              </p>
            )}
            {mode === 'forgot-password' && (
              <p>
                <button 
                  onClick={() => switchMode('login')} 
                  className="text-[#FF6B35] font-medium hover:underline"
                >
                  로그인으로 돌아가기
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
