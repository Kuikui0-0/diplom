'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Author {
  id: number;
  name: string;
  avatarUrl?: string | null;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: Author;
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
  const [collapsed, setCollapsed] = useState(true);

  const childComments = allComments.filter(c => c.parentId === comment.id);
  const hasReplies = childComments.length > 0;

  const preview =
    comment.content.length > 100
      ? comment.content.slice(0, 100) + '...'
      : comment.content;

  if (collapsed) {
    return (
      <div
        style={{
          marginLeft: depth * 20,
          marginTop: '0.5rem',
          borderLeft: depth > 0 ? '2px solid #d1d5db' : 'none',
          paddingLeft: depth > 0 ? '1rem' : 0,
        }}
      >
        <div className="flex items-center gap-2">
          <Link href={`/user/${comment.author.id}`} className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {comment.author.name}
          </Link>
          <span className="text-gray-500 dark:text-gray-400 text-xs">{preview}</span>
          <button onClick={() => setCollapsed(false)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            Показать
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginLeft: depth * 20,
        marginTop: '0.75rem',
        borderLeft: depth > 0 ? '2px solid #d1d5db' : 'none',
        paddingLeft: depth > 0 ? '1rem' : 0,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Link href={`/user/${comment.author.id}`} className="font-medium text-sm text-gray-900 dark:text-gray-100">
          {comment.author.name}
        </Link>
        {comment.author.avatarUrl && (
          <img src={comment.author.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {new Date(comment.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">{comment.content}</p>
      <div className="flex gap-2">
        <button onClick={() => onReply(comment.id)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
          Ответить
        </button>
        <button onClick={() => setCollapsed(true)} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
          Скрыть
        </button>
      </div>
      {childComments.map(child => (
        <CommentThread
          key={child.id}
          comment={child}
          allComments={allComments}
          onReply={onReply}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function CommentSection({
  articleId,
  highlightCommentId,
}: {
  articleId: number;
  highlightCommentId?: number;
}) {
  const [user, setUser] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user));

    fetch(`/api/articles/${articleId}/comments`)
      .then(res => res.json())
      .then(data => setComments(data));
  }, [articleId]);

  const handleSubmitComment = async (e: React.FormEvent, parentId: number | null) => {
    e.preventDefault();
    if (!user) {
      alert('Необходимо войти');
      return;
    }
    const content = parentId ? replyText : newComment;
    if (!content.trim()) return;

    const res = await fetch(`/api/articles/${articleId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, parentId }),
    });
    if (res.ok) {
      const added = await res.json();
      setComments(prev => [...prev, added]);
      if (parentId) {
        setReplyTo(null);
        setReplyText('');
      } else {
        setNewComment('');
      }
    }
  };

  const rootComments = comments.filter(c => c.parentId === null);

  const inputClass =
    "block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 transition-colors";

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Комментарии ({comments.length})
      </h3>

      {user ? (
        <form onSubmit={e => handleSubmitComment(e, null)} className="mb-6">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Написать комментарий..."
            rows={3}
            required
            className={inputClass}
          />
          <button
            type="submit"
            className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Отправить
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Чтобы оставить комментарий,{' '}
          <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            войдите
          </Link>
          .
        </p>
      )}

      {rootComments.map(comment => (
        <CommentThread
          key={comment.id}
          comment={comment}
          allComments={comments}
          onReply={parentId => {
            setReplyTo(parentId);
            setReplyText('');
          }}
          depth={0}
        />
      ))}

      {replyTo && (
        <div className="mt-4 pl-6 border-l-2 border-indigo-200 dark:border-indigo-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Ответ на комментарий #{replyTo}
          </p>
          <form onSubmit={e => handleSubmitComment(e, replyTo)} className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Ваш ответ..."
              required
              className={inputClass + ' flex-1'}
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Ответить
            </button>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
            >
              Отмена
            </button>
          </form>
        </div>
      )}
    </div>
  );
}