import React, { useState, useEffect } from 'react';
import { StepIndicator } from './components/StepIndicator';
import { Step1Form } from './components/Step1Form';
import { Step2Upload } from './components/Step2Upload';
import { Step3Completion } from './components/Step3Completion';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { Library } from './components/Library';
import { KCoatFormData, PhotoSet, N8NResponse } from './types';
import { formatDate } from './utils';
import { WEBHOOK_URL } from './constants';
import { Crown, LogOut, User } from 'lucide-react';

interface AuthUser {
  id: number;
  name: string;
  email: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<'create' | 'library'>('create');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<KCoatFormData>({
    buildingName: '',
    workDate: formatDate(new Date()),
    workType: 'remodeling',
    detailedLocation: '',
    productCategory: '',
    productSubcategory: '',
    productType: '',
    productColor: '',
    workHours: 4,
    issues: [],
    useWatermark: true,
    photoSets: []
  });

  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([
    { id: 'initial', before: null, after: null, type: 'two' }
  ]);

  const [apiResult, setApiResult] = useState<N8NResponse | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/user', { credentials: 'include' });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (err) {
      console.log('Not authenticated');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { 
        method: 'POST',
        credentials: 'include' 
      });
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const updateFormData = (updates: Partial<KCoatFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const startGeneration = async () => {
    console.log('🚀 AI 생성 시작');
    console.log('📸 현재 photoSets 개수:', photoSets.length);

    const processedSets = photoSets
      .filter(s => s.before && s.after)
      .map((s, index) => {
        console.log(`📋 세트 ${index + 1} 처리:`, {
          beforeName: s.beforeName,
          middleName: s.middleName,
          afterName: s.afterName,
          type: s.type
        });

        return {
          before: s.before!,
          middle: s.middle || null,
          after: s.after!,
          beforeName: s.beforeName,
          middleName: s.middleName,
          afterName: s.afterName,
          type: s.type
        };
      });

    console.log('✅ 처리된 세트 개수:', processedSets.length);

    const productLabel = formData.productType || '탄성코트';
    const initialTitle = `(${formData.buildingName}) ${productLabel} 시공`;

    try {
      const createRes = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: initialTitle,
          content: '',
          buildingName: formData.buildingName,
          workDate: formData.workDate,
          productType: formData.productType,
          photoSets: processedSets,
          status: 'generating'
        })
      });

      if (!createRes.ok) {
        throw new Error('Failed to create blog post');
      }

      const newPost = await createRes.json();
      console.log('📝 생성중 상태로 블로그 포스트 생성됨:', newPost.id);

      setStep(3);

      const finalPayload = {
        buildingName: formData.buildingName,
        workDate: formData.workDate,
        workType: formData.workType,
        detailedLocation: formData.detailedLocation,
        productCategory: formData.productCategory,
        productSubcategory: formData.productSubcategory,
        productType: formData.productType,
        productColor: formData.productColor,
        workHours: formData.workHours,
        issues: formData.issues,
        photoSets: processedSets
      };

      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(finalPayload),
      }).then(async (response) => {
        console.log("Webhook response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          await fetch(`/api/blog-posts/${newPost.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              content: '생성 중 오류가 발생했습니다.',
              status: 'completed'
            })
          });
          return;
        }

        const text = await response.text();
        console.log("Raw response text:", text);
        
        if (!text || text.trim() === "") {
          console.error("Empty response from n8n");
          await fetch(`/api/blog-posts/${newPost.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              content: 'n8n 서버에서 빈 데이터를 보냈습니다.',
              status: 'completed'
            })
          });
          return;
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("JSON parse error:", e);
          await fetch(`/api/blog-posts/${newPost.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              content: '서버 응답이 올바른 JSON 형식이 아닙니다.',
              status: 'completed'
            })
          });
          return;
        }
        
        console.log("Parsed data:", data);

        const responseData = Array.isArray(data) ? data[0] : data;

        let finalTitle = responseData.title || initialTitle;
        let finalContent = '';
        let finalHashtags = "#탄성코트 #KCOAT #베란다칠 #결로방지";

        if (responseData.html) {
          finalContent = responseData.html;
        } else {
          const sectionKeyMap: { [key: string]: string } = {
            '인트로': 'intro',
            '제품': 'product',
            '오프닝': 'opening',
            'USP': 'usp',
            'FAQ': 'faq',
            'TECH': 'tech',
            '철학': 'philosophy',
            '과정': 'process',
            '정리': 'recap',
            '헤더': 'header'
          };

          const contentParts: string[] = [];
          for (const [koreanKey] of Object.entries(sectionKeyMap)) {
            if (responseData[koreanKey]) {
              contentParts.push(responseData[koreanKey]);
            }
          }
          finalContent = contentParts.join('\n\n');
        }

        if (responseData['해시태그']) {
          finalHashtags = responseData['해시태그'];
        } else if (responseData.hashtags) {
          finalHashtags = responseData.hashtags;
        }

        await fetch(`/api/blog-posts/${newPost.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: finalTitle,
            content: finalContent,
            hashtags: finalHashtags,
            status: 'completed'
          })
        });

        console.log('✅ 블로그 포스트 생성 완료:', newPost.id);
      }).catch(async (err) => {
        console.error('웹훅 에러:', err);
        await fetch(`/api/blog-posts/${newPost.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            content: '생성 중 오류가 발생했습니다: ' + err.message,
            status: 'completed'
          })
        });
      });

    } catch (err) {
      console.error('포스트 생성 에러:', err);
      alert("블로그 포스트 생성에 실패했습니다.");
    }
  };

  const handleGoToLibrary = () => {
    setActiveMenu('library');
    resetForm();
  };

  const handleCreateNew = () => {
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setApiResult(null);
    setFormData({
      buildingName: '',
      workDate: formatDate(new Date()),
      workType: 'remodeling',
      detailedLocation: '',
      productCategory: '',
      productSubcategory: '',
      productType: '',
      productColor: '',
      workHours: 4,
      issues: [],
      useWatermark: true,
      photoSets: []
    });
    setPhotoSets([{ id: 'initial', before: null, after: null, type: 'two' }]);
  };

  const saveBlogPost = async (title: string, content: string) => {
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          content,
          buildingName: formData.buildingName,
          workDate: formData.workDate,
          productType: formData.productType,
          photoSets: photoSets.filter(s => s.before || s.after)
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save blog post');
      }

      setActiveMenu('library');
      setStep(1);
      setApiResult(null);
      setFormData({
        buildingName: '',
        workDate: formatDate(new Date()),
        workType: 'remodeling',
        detailedLocation: '',
        productCategory: '',
        productSubcategory: '',
        productType: '',
        productColor: '',
        workHours: 4,
        issues: [],
        useWatermark: true,
        photoSets: []
      });
      setPhotoSets([{ id: 'initial', before: null, after: null, type: 'two' }]);
    } catch (err) {
      console.error('Error saving blog post:', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLoginSuccess={setUser} />;
  }

  return (
    <div className="min-h-screen flex bg-[#FAF9F6]">
      <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />
      
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 shadow-sm">
          <div className="flex justify-end items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </button>
              <div className="flex items-center space-x-1 bg-[#1A1D2E] text-white px-3 py-1.5 rounded-full text-[10px] font-bold">
                <Crown className="w-3 h-3 text-yellow-400" />
                <span>PRO PLAN</span>
              </div>
            </div>
          </div>
        </header>

        {activeMenu === 'library' ? (
          <Library />
        ) : (
          <main className={`${step >= 3 ? 'max-w-7xl' : 'max-w-3xl'} mx-auto px-6 pt-10 pb-20 transition-all duration-700 w-full`}>
            <StepIndicator currentStep={step} />

            <div className="mt-8">
              {step === 1 && (
                <Step1Form 
                  data={formData} 
                  updateData={updateFormData} 
                  onNext={() => setStep(2)} 
                />
              )}

              {step === 2 && (
                <Step2Upload 
                  photoSets={photoSets} 
                  setPhotoSets={setPhotoSets} 
                  onBack={() => setStep(1)} 
                  onNext={startGeneration} 
                />
              )}

              {step === 3 && (
                <Step3Completion 
                  onGoToLibrary={handleGoToLibrary}
                  onCreateNew={handleCreateNew}
                />
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
};

export default App;
