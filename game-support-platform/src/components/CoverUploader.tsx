'use client';
import { useState, useRef, useEffect } from 'react';

export default function CoverUploader({
  currentUrl,
  onChange,
}: {
  currentUrl?: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Синхронизация внешнего currentUrl с внутренним состоянием
  useEffect(() => {
    setUrlInput(currentUrl || '');
  }, [currentUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok && data.url) {
        onChange(data.url);
        setUrlInput(data.url);
      } else {
        throw new Error(data.error || 'Ошибка загрузки');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Ошибка соединения');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (trimmed) {
      onChange(trimmed);
      setShowUrlInput(false);
      setError(null);
    } else {
      setError('Введите корректный URL');
    }
  };

  const handleRemoveCover = () => {
    onChange(null);
    setUrlInput('');
    setError(null);
  };

  return (
    <div>
      {currentUrl && (
        <div className="mb-2 relative inline-block">
          <img
            src={currentUrl}
            alt="Обложка"
            className="w-32 h-20 object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={handleRemoveCover}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center"
            title="Удалить обложку"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 text-sm"
        >
          {uploading ? 'Загрузка...' : 'Загрузить аватар'}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-sm text-indigo-600 hover:underline"
        >
          {showUrlInput ? 'Скрыть' : 'или укажите ссылку'}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {showUrlInput && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="border rounded px-3 py-2 flex-1 text-sm"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}