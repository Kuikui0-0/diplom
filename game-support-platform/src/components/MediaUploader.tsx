'use client';
import { useState, useRef } from 'react';

interface MediaItem {
  id: number;
  url: string;
  type: string;
}

interface UploaderProps {
  existingMedia?: MediaItem[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete?: (mediaId: number) => Promise<void>;
}

export default function MediaUploader({ existingMedia = [], onUpload, onDelete }: UploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setMessage('');
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
      setPreviews([]);
    } catch (err) {
      setMessage('Ошибка при загрузке файлов');
    }
    setUploading(false);
  };

  return (
    <div className="space-y-3">
      {existingMedia.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {existingMedia.map(item => (
            <div key={item.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
              {item.type === 'video' ? (
                <video src={item.url} className="w-full h-full object-cover" />
              ) : (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {previews.map((src, index) => (
            <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
              {selectedFiles[index]?.type.startsWith('video/') ? (
                <video src={src} className="w-full h-full object-cover" />
              ) : (
                <img src={src} alt="" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeSelectedFile(index)}
                className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          Выберите файлы
        </button>
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
        {selectedFiles.length > 0 && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Загрузка...' : 'Загрузить выбранные'}
          </button>
        )}
      </div>

      {message && <p className="text-red-600 dark:text-red-400 text-xs">{message}</p>}
    </div>
  );
}