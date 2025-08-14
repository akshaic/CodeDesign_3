import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { useNavigate } from 'react-router-dom';
import { addOrUpdatePost, deletePost } from '../redux/postsSlice';
import styles from '../styles/postdashboard.module.css';

function relativeTime(iso) {
  if (!iso) return 'just now';
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const diffMs = new Date(iso) - new Date();
  const mins = Math.round(diffMs / 60000);
  const hrs = Math.round(mins / 60);
  const days = Math.round(hrs / 24);
  if (Math.abs(mins) < 60) return rtf.format(mins, 'minute');
  if (Math.abs(hrs) < 24) return rtf.format(hrs, 'hour');
  return rtf.format(days, 'day');
}

const stripHtml = (html = '') =>
  html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export default function PostDashboard() {
  const posts = useSelector((s) => s.posts.posts);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => {
      const title = (p.title || '').toLowerCase();
      const text = stripHtml(p.content || '').toLowerCase();
      return title.includes(q) || text.includes(q);
    });
  }, [posts, query]);

  const onNewPost = () => {
    const id = nanoid();
    // create an empty draft immediately so it appears in the list
    dispatch(addOrUpdatePost({ id, title: '', content: '' }));
    navigate(`/editor/${id}`);
  };

  const onEdit = (id) => navigate(`/editor/${id}`);

  const onDelete = (id) => {
    if (window.confirm('Delete this draft? This cannot be undone.')) {
      dispatch(deletePost(id));
    }
  };

  return (
    <div className={styles.container}>
      {/* Title above */}
      <h2 className={styles.title}>Posts</h2>

      {/* Controls row: search (left, fills) + new post (right) */}
      <div className={styles.controlsRow}>
        <div className={styles.searchWrap}>
          <img className={styles.searchSvg} src="/search.svg" alt="" />
          <input
            className={styles.search}
            placeholder="Search Posts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search posts"
          />
        </div>

        <button className={styles.newPostBtn} onClick={onNewPost}>
          New post
        </button>
      </div>

      <div className={styles.list}>
        {filtered.map((p) => {
          const excerpt = stripHtml(p.content).slice(0, 95);
          return (
            <div className={styles.row} key={p.id}>
              <div
                className={styles.rowMain}
                onClick={() => onEdit(p.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onEdit(p.id); }}
              >
                <div className={styles.rowTitle}>{p.title || 'Untitled Draft'}</div>
                <div className={styles.rowExcerpt}>
                  {excerpt}{excerpt.length >= 95 ? '…' : ''}
                </div>
                <div className={styles.rowMeta}>{relativeTime(p.updatedAt)}</div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.iconBtn}
                  onClick={(e) => { e.stopPropagation(); onEdit(p.id); }}
                  aria-label="Edit draft"
                  title="Edit"
                >
                  <img className={styles.icon} src="/edit.svg" alt="" />
                </button>
                <button
                  className={styles.iconBtn}
                  onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                  aria-label="Delete draft"
                  title="Delete"
                >
                  <img className={styles.icon} src="/delete.svg" alt="" />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className={styles.empty}>No posts match your search.</div>
        )}
      </div>
    </div>
  );
}
