import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface ContentEditorProps {
  initialContent: string;
}

export interface ContentEditorHandle {
  getContent: () => string;
}

export const ContentEditor = forwardRef<ContentEditorHandle, ContentEditorProps>(
  ({ initialContent }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = initialContent;
      }
    }, []);

    useImperativeHandle(ref, () => ({
      getContent: () => {
        return editorRef.current?.innerHTML || '';
      }
    }));

    return (
      <>
        <style>{`
          .content-editor {
            color: #000000 !important;
            font-size: 16px;
            line-height: 1.6;
            text-align: center;
            outline: none;
            min-height: 400px;
            padding: 16px;
            border: 2px solid #93c5fd;
            border-radius: 12px;
            background: rgba(239, 246, 255, 0.3);
          }
          .content-editor:focus {
            border-color: #3b82f6;
          }
          .content-editor * {
            color: #000000 !important;
          }
          .content-editor img {
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
          .content-editor h1 {
            font-size: 22px !important;
            font-weight: 800 !important;
            margin-bottom: 8px !important;
          }
          .content-editor h2 {
            font-size: 18px !important;
            font-weight: 700 !important;
            margin-top: 12px !important;
            margin-bottom: 6px !important;
          }
          .content-editor p, .content-editor div {
            margin: 8px 0 !important;
            white-space: pre-wrap;
          }
        `}</style>
        <div
          ref={editorRef}
          contentEditable
          className="content-editor"
          suppressContentEditableWarning
        />
      </>
    );
  }
);

ContentEditor.displayName = 'ContentEditor';
