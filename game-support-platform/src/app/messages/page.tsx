'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ───────────── типы ─────────────
interface User {
  id: number;
  name: string;
  avatarUrl?: string | null;
}
interface Media {
  id: number;
  url: string;
  type: string;
}
interface Message {
  id: number;
  text: string | null;
  createdAt: string;
  sender: User;
  isRead: boolean;
  media: Media[];
}
// ─────────────────────────────────

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [removeMediaIds, setRemoveMediaIds] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [deleteMenuMsgId, setDeleteMenuMsgId] = useState<number | null>(null);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<number[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showConvMenu, setShowConvMenu] = useState(false);
  const convMenuRef = useRef<HTMLDivElement>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        if (data.user) loadConversations();
      })
      .finally(() => setLoading(false));
  }, []);

  const loadConversations = () => {
    fetch('/api/messages')
      .then(res => res.json())
      .then(data => setConversations(data));
  };

  useEffect(() => {
    if (activeConvId) {
      fetch(`/api/messages/conversation/${activeConvId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMessages(data);
          } else {
            setMessages([]);
          }
        })
        .catch(() => setMessages([]));
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Закрытие меню удаления при клике вне
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDeleteMenuMsgId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openFullscreen = (url: string, type: string) => setFullscreenMedia({ url, type });
  const closeFullscreen = () => setFullscreenMedia(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !user) return;
    const conv = conversations.find(c => c.id === activeConvId);
    if (!conv) return;

    // Режим редактирования
    if (editingMsgId) {
      const editingMsg = messages.find(m => m.id === editingMsgId);
      const existingMedia = editingMsg?.media || [];
      const remainingMediaCount = existingMedia.length - removeMediaIds.length;

      if (!newMessage.trim() && selectedFiles.length === 0 && remainingMediaCount === 0) {
        alert('Сообщение не может быть пустым');
        return;
      }

      const formData = new FormData();
      if (newMessage.trim()) formData.append('text', newMessage.trim());
      if (removeMediaIds.length > 0) formData.append('removeMediaIds', JSON.stringify(removeMediaIds));
      selectedFiles.forEach(file => formData.append('newFiles', file));

      const res = await fetch(`/api/messages/${editingMsgId}`, { method: 'PATCH', body: formData });
      if (res.ok) {
        const updated = await res.json();
        setMessages(prev => prev.map(m => m.id === editingMsgId ? updated : m));
        setEditingMsgId(null);
        setNewMessage('');
        setSelectedFiles([]);
        setFilePreviews([]);
        setRemoveMediaIds([]);
      }
      return;
    }

    // Обычная отправка
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    const formData = new FormData();
    formData.append('partnerId', String(conv.partner.id));
    formData.append('text', newMessage.trim() || '');
    selectedFiles.forEach(file => formData.append('files', file));

    const res = await fetch('/api/messages', { method: 'POST', body: formData });
    if (res.ok) {
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      setSelectedFiles([]);
      setFilePreviews([]);
      loadConversations();
    }
  };

  const handleDeleteForMe = (msgId: number) => {
    setDeleteMenuMsgId(null);
    setHiddenMessageIds(prev => [...prev, msgId]);
  };

  const handleDeleteForEveryone = async (msgId: number) => {
    setDeleteMenuMsgId(null);
    if (!confirm('Удалить сообщение для всех?')) return;
    const res = await fetch(`/api/messages/${msgId}`, { method: 'DELETE' });
    if (res.ok) {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      loadConversations();
    } else {
      alert('Не удалось удалить сообщение');
    }
  };

  const startEdit = (msg: any) => {
    setEditingMsgId(msg.id);
    setNewMessage(msg.text || '');
    setSelectedFiles([]);
    setFilePreviews(msg.media?.map((m: any) => m.url) || []);
    setRemoveMediaIds([]);
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setNewMessage('');
    setSelectedFiles([]);
    setFilePreviews([]);
    setRemoveMediaIds([]);
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setFilePreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    setFilePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const clearChat = async () => {
    if (!activeConvId) return;
    const res = await fetch(`/api/messages/conversation/${activeConvId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' }),
    });
    if (res.ok) {
      setMessages([]);
      loadConversations();
    }
  };

  const deleteChat = async () => {
    if (!activeConvId) return;
    if (!confirm('Удалить этот чат? Если второй участник тоже удалит его, сообщения будут потеряны.')) return;
    const res = await fetch(`/api/messages/conversation/${activeConvId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete' }),
    });
    if (res.ok) {
      setConversations(prev => prev.filter(c => c.id !== activeConvId));
      setActiveConvId(null);
      setMessages([]);
    } else {
      alert('Не удалось удалить диалог');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Загрузка...</div>;
  if (!user) return <div className="p-8 text-center text-gray-500">Пожалуйста, <Link href="/login" className="text-indigo-600 hover:underline">войдите</Link>.</div>;

  const activeConversation = conversations.find(c => c.id === activeConvId);

  return (
    <div className="flex h-[calc(100vh-100px)] max-w-7xl mx-auto px-4 py-4 gap-4">
      {/* Левая панель */}
      <div className="w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Сообщения</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && <p className="p-4 text-gray-500 dark:text-gray-400 text-sm">Нет диалогов</p>}
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => {
                setActiveConvId(conv.id);
                if (conv.unreadCount > 0) {
                  setConversations(prev =>
                    prev.map(c => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                  );
                }
              }}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-750 ${
                activeConvId === conv.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' : ''
              }`}
            >
              {conv.partner.avatarUrl ? (
                <img src={conv.partner.avatarUrl} className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-500 dark:text-gray-400">
                  {conv.partner.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <strong className="text-sm text-gray-900 dark:text-gray-100 truncate">{conv.partner.name}</strong>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {conv.lastMessage.isMine ? 'Вы: ' : ''}
                    {conv.lastMessage.text ? conv.lastMessage.text.substring(0, 30) : '📎 Вложение'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Правая область (чат) */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
        {activeConversation ? (
          <>
            {/* Шапка чата */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
              <Link href={`/user/${activeConversation.partner.id}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">
                {activeConversation.partner.name}
              </Link>
              <div className="relative" ref={convMenuRef}>
                <button
                  onClick={() => setShowConvMenu(!showConvMenu)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
                  </svg>
                </button>
                {showConvMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                    <button
                      onClick={() => { clearChat(); setShowConvMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
                    >
                      🧹 Очистить чат
                    </button>
                    <button
                      onClick={() => { deleteChat(); setShowConvMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      ❌ Удалить чат
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
              {messages.filter(m => !hiddenMessageIds.includes(m.id)).map((msg, idx) => {
                const prevSenderId = idx > 0 ? messages[idx - 1].sender.id : null;
                const showSender = prevSenderId !== msg.sender.id;
                const isMine = msg.sender.id === user.userId;

                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    {showSender && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 mb-1 px-1">
                        {msg.sender.name}
                      </span>
                    )}
                    <div className={`relative max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-bl-md shadow-sm'
                    }`}>
                      {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                      {msg.media?.length > 0 && (
                        <div className={`flex flex-wrap gap-1.5 ${msg.text ? 'mt-2' : ''}`}>
                          {msg.media.map((m: any) =>
                            m.type === 'video' ? (
                              <video key={m.id} src={m.url} controls className="max-w-[200px] max-h-[150px] rounded-lg" />
                            ) : (
                              <img
                                key={m.id}
                                src={m.url}
                                alt=""
                                className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => openFullscreen(m.url, m.type)}
                              />
                            )
                          )}
                        </div>
                      )}
                      <div className={`flex items-center justify-end gap-2 mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'}`}>
                        <span className="text-[10px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMine && (
                          <div className="flex items-center">
                            <button onClick={() => startEdit(msg)} className="hover:text-white transition-colors" title="Редактировать">✏️</button>
                            <button onClick={() => setDeleteMenuMsgId(msg.id)} className="hover:text-white transition-colors ml-1" title="Удалить">🗑️</button>
                            {deleteMenuMsgId === msg.id && (
                              <div ref={menuRef} className={`absolute w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 ${idx === 0 ? 'top-full mt-1' : 'bottom-full mb-1'} right-0`}>
                                <button
                                  onClick={() => handleDeleteForMe(msg.id)}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
                                >
                                  Удалить у себя
                                </button>
                                <button
                                  onClick={() => handleDeleteForEveryone(msg.id)}
                                  className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  Удалить у всех
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Форма отправки */}
            <form onSubmit={handleSend} className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              {editingMsgId && (
                <div className="flex items-center justify-between mb-2 text-xs text-indigo-600 dark:text-indigo-400">
                  <span>Редактирование сообщения</span>
                  <button type="button" onClick={cancelEdit} className="text-red-500 hover:underline">Отменить</button>
                </div>
              )}
              {filePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {filePreviews.map((url, idx) => {
                    const isExisting = editingMsgId && idx < (messages.find(m => m.id === editingMsgId)?.media?.length || 0);
                    const mediaId = isExisting ? messages.find(m => m.id === editingMsgId)?.media?.[idx]?.id : undefined;
                    const isMarked = mediaId && removeMediaIds.includes(mediaId);

                    return (
                      <div key={idx} className={`relative w-14 h-14 rounded-lg overflow-hidden ${isMarked ? 'opacity-40' : ''}`}>
                        {selectedFiles[idx - (messages.find(m => m.id === editingMsgId)?.media?.length || 0)]?.type?.startsWith('video/') || url.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video src={url} className="w-full h-full object-cover" autoPlay muted loop />
                        ) : (
                          <img src={url} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isExisting) {
                              if (isMarked) {
                                setRemoveMediaIds(prev => prev.filter(id => id !== mediaId));
                              } else {
                                setRemoveMediaIds(prev => [...prev, mediaId!]);
                              }
                            } else {
                              removeFile(idx - (messages.find(m => m.id === editingMsgId)?.media?.length || 0));
                            }
                          }}
                          className="absolute top-0 right-0 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-[10px]"
                        >
                          {isExisting && !isMarked ? '✕' : '↩'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="Прикрепить файл">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.242 4.242l7-7a3 3 0 00-4.242-4.242zM11.5 5.5l-7 7a1.5 1.5 0 002.121 2.121l7-7A1.5 1.5 0 0011.5 5.5z" clipRule="evenodd" />
                  </svg>
                </button>
                <input type="file" accept="image/*,video/*" multiple ref={fileInputRef} className="hidden" onChange={handleFilesChange} />
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Ваше сообщение..."
                  className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-600 transition-colors"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  disabled={!newMessage.trim() && selectedFiles.length === 0 && !editingMsgId}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M3.105 2.289a.75.75 0 00-.826.95l2.44 9.75a.75.75 0 00.708.511h8.344a.75.75 0 00.708-.511l2.44-9.75a.75.75 0 00-.826-.95L3.105 2.289zM3.28 3.33l11.44 2.86-2.02 7.06H5.3L3.28 3.33z" />
                    <path d="M12.25 13.5a.75.75 0 01.75.75v2.25h2.25a.75.75 0 010 1.5H13v2.25a.75.75 0 01-1.5 0V18H9.25a.75.75 0 010-1.5h2.25V14.25a.75.75 0 01.75-.75z" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <p>Выберите диалог, чтобы начать общение</p>
          </div>
        )}
      </div>

      {/* Модальное окно для полноэкранного просмотра */}
      {fullscreenMedia && (
        <div
          onClick={closeFullscreen}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
        >
          {fullscreenMedia.type === 'video' ? (
            <video src={fullscreenMedia.url} controls autoPlay className="max-w-[90%] max-h-[90%]" />
          ) : (
            <img src={fullscreenMedia.url} alt="" className="max-w-[90%] max-h-[90%] object-contain" />
          )}
          <button
            onClick={closeFullscreen}
            className="absolute top-5 right-5 bg-white/20 text-white rounded-lg px-4 py-2 text-sm hover:bg-white/30 transition-colors"
          >
            ✕ Закрыть
          </button>
        </div>
      )}
    </div>
  );
}