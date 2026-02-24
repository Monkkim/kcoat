import DOMPurify from 'dompurify';

export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ['img', 'iframe'],
    ADD_ATTR: ['style', 'class', 'src', 'alt', 'width', 'height', 'target', 'rel'],
    ALLOW_DATA_ATTR: true,
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        return reject(new Error('FileReader result is not a string'));
      }

      console.log(`🔄 파일 읽기 완료: ${file.name} (원본 base64 크기: ${result.length})`);

      // Canvas API로 이미지 압축
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1920;
          let { width, height } = img;

          if (width > MAX_SIZE || height > MAX_SIZE) {
            const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.warn(`⚠️ Canvas 컨텍스트 생성 실패, 원본 사용: ${file.name}`);
            return resolve(result);
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.6);
          console.log(`✅ 이미지 압축 완료: ${file.name} (${result.length} → ${compressed.length}, ${Math.round(compressed.length / result.length * 100)}%)`);
          resolve(compressed);
        } catch (e) {
          console.warn(`⚠️ 이미지 압축 실패, 원본 사용: ${file.name}`, e);
          resolve(result);
        }
      };
      img.onerror = () => {
        console.warn(`⚠️ 이미지 로드 실패, 원본 사용: ${file.name}`);
        resolve(result);
      };
      img.src = result;
    };

    reader.onerror = (error) => {
      console.error(`❌ 파일 변환 실패: ${file.name}`, error);
      reject(error);
    };

    console.log(`🔄 파일 변환 시작: ${file.name}`);
    reader.readAsDataURL(file);
  });
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * 네이버 블로그 스마트에디터에 최적화된 복사 함수
 * HTML과 일반 텍스트를 동시에 전달하여 에디터가 '리치 콘텐츠'로 인식하게 함
 */
export const copyRichTextToClipboard = async (html: string): Promise<boolean> => {
  try {
    // 네이버 에디터는 표준 HTML 구조를 선호함
    const fullHtml = `
      <html>
        <head><meta charset="utf-8"></head>
        <body>
          ${html}
        </body>
      </html>
    `;
    
    const blobHtml = new Blob([fullHtml], { type: 'text/html' });
    const blobText = new Blob([html.replace(/<[^>]*>?/gm, '')], { type: 'text/plain' });
    
    if (typeof ClipboardItem !== 'undefined') {
      const data = [new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText
      })];
      await navigator.clipboard.write(data);
      return true;
    } else {
      // 구형 브라우저 대응
      await navigator.clipboard.writeText(html);
      return true;
    }
  } catch (err) {
    console.error('복사 중 오류 발생:', err);
    return false;
  }
};
