'use client';
import { useState, useEffect, useRef } from 'react';

interface Media {
  id: number;
  url: string;
  type: string;
}

interface GroupMessage {
  id: number;
  text: string | null;
  createdAt: string;
  sender: { id: number; name: string; avatarUrl?: string | null };
  media: Media[];
}

export default function GroupChat({ groupId }: { groupId: number }) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/messages`)
      .then(res => res.json())
      .then(data => setMessages(Array.isArray(data) ? data : []));
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && files.length === 0) return;

    const formData = new FormData();
    formData.append('text', newMessage.trim());
    files.forEach(f => formData.append('files', f));

    const res = await fetch(`/api/groups/${groupId}/messages`, {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      setFiles([]);
      setPreviews([]);
    }
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Сообщения */}
      <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '0.5rem', background: '#f9fafb' }}>
        {messages.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center' }}>Нет сообщений</p>}
        {messages.map((msg, idx) => {
          const prevSenderId = idx > 0 ? messages[idx - 1].sender.id : null;
          const showSender = prevSenderId !== msg.sender.id;

          return (
            <div key={msg.id} style={{ marginBottom: '0.4rem' }}>
              {showSender && (
                <small style={{ color: '#6b7280' }}>{msg.sender.name}</small>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {msg.text && <span style={{ background: '#e5e7eb', padding: '0.3rem 0.6rem', borderRadius: '12px', maxWidth: '80%' }}>{msg.text}</span>}
                {msg.media.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {msg.media.map(m => (
                      <img key={m.id} src={m.url} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(m.url)} />
                    ))}
                  </div>
                )}
                <small style={{ color: '#9ca3af', fontSize: '0.7rem' }}>{new Date(msg.createdAt).toLocaleTimeString()}</small>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <form onSubmit={handleSend} style={{ display: 'flex', padding: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
        {previews.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginRight: '8px' }}>
            {previews.map((url, idx) => (
              <div key={idx} style={{ position: 'relative', width: '40px', height: '40px' }}>
                <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                <button type="button" onClick={() => removeFile(idx)} style={{ position: 'absolute', top: -4, right: -4, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px' }}>×</button>
              </div>
            ))}
          </div>
        )}
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Сообщение..." style={{ flex: 1, padding: '0.3rem', borderRadius: '6px', border: '1px solid #d1d5db' }} />
        <button type="button" onClick={() => fileInputRef.current?.click()} style={{ marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>📎</button>
        <input type="file" accept="image/*,video/*" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFilesChange} />
        <button type="submit" style={{ marginLeft: '4px', padding: '0.3rem 0.8rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отправить</button>
      </form>
    </div>
  );
}