'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Author { id: number; name: string; }
interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: Author;
  avatarUrl?: string;
  parentId: number | null;
}

function CommentThread({
  comment,
  allComments,
  onReply,
  depth = 0,
}: {
  comment: Comment;
  allComments: Comment[];
  onReply: (parentId: number) => void;
  depth: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const childComments = allComments.filter(c => c.parentId === comment.id);
  const hasReplies = childComments.length > 0;
  const preview = comment.content.split('.')[0] + (comment.content.includes('.') ? '.' : '');

  if (collapsed) {
    return (
      <div style={{ marginLeft: depth * 20, marginTop: '0.5rem', borderLeft: depth > 0 ? '2px solid #ccc' : 'none', paddingLeft: depth > 0 ? '1rem' : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link href={`/user/${comment.author.id}`} style={{ fontWeight: 'bold' }}>{comment.author.name}</Link>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>{preview}</span>
          <button onClick={() => setCollapsed(false)} style={{ fontSize: '0.8rem' }}>Показать</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginLeft: depth * 20, marginTop: '1rem', borderLeft: depth > 0 ? '2px solid #ccc' : 'none', paddingLeft: depth > 0 ? '1rem' : 0 }}>
      <Link href={`/user/${comment.author.id}`} style={{ fontWeight: 'bold' }}>{comment.author.name}</Link>
      <p>{comment.content}</p>
      <small>{new Date(comment.createdAt).toLocaleString()}</small>
      <div style={{ marginTop: '0.25rem' }}>
        <button onClick={() => onReply(comment.id)}>Ответить</button>
        {(hasReplies || depth === 0) && (
          <button onClick={() => setCollapsed(true)} style={{ marginLeft: '0.5rem' }}>Скрыть</button>
        )}
      </div>
      {childComments.map(child => (
        <CommentThread key={child.id} comment={child} allComments={allComments} onReply={onReply} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function GameCommentSection({ gameId }: { gameId: number }) {
  const [user, setUser] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => setUser(data.user));
    fetch(`/api/games/${gameId}/comments`).then(res => res.json()).then(data => setComments(data));
  }, [gameId]);

  const handleSubmitComment = async (e: React.FormEvent, parentId: number | null) => {
    e.preventDefault();
    if (!user) return alert('Войдите');
    const content = parentId ? replyText : newComment;
    if (!content.trim()) return;
    const res = await fetch(`/api/games/${gameId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, parentId }),
    });
    if (res.ok) {
      const added = await res.json();
      setComments(prev => [...prev, added]);
      if (parentId) { setReplyTo(null); setReplyText(''); } else setNewComment('');
    }
  };

  const rootComments = comments.filter(c => c.parentId === null);

  return (
    <div style={{ marginTop: '2rem' }}>
      {user ? (
        <form onSubmit={e => handleSubmitComment(e, null)}>
          <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Комментарий..." rows={3} required />
          <br />
          <button type="submit">Отправить</button>
        </form>
      ) : (
        <p>Чтобы оставить комментарий, <Link href="/login">войдите</Link>.</p>
      )}

      {rootComments.map(comment => (
        <CommentThread key={comment.id} comment={comment} allComments={comments} onReply={parentId => { setReplyTo(parentId); setReplyText(''); }} depth={0} />
      ))}

      {replyTo && (
        <div style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
          <p>Ответ на комментарий #{replyTo}</p>
          <form onSubmit={e => handleSubmitComment(e, replyTo)}>
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3} required />
            <br />
            <button type="submit">Ответить</button>
            <button type="button" onClick={() => setReplyTo(null)}>Отмена</button>
          </form>
        </div>
      )}
    </div>
  );
}