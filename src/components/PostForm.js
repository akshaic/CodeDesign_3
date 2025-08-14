import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent, posToDOMRect } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Node } from '@tiptap/core';
import { addOrUpdatePost } from '../redux/postsSlice';
import styles from '../styles/postform.module.css';

/* --- Custom Tiptap Node for responsive iframes (YouTube) --- */
const Iframe = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      src: { default: null },
      title: { default: 'YouTube video' },
      allow: {
        default:
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      },
      frameborder: { default: '0' },
      allowfullscreen: { default: 'true' },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-embed="youtube"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { 'data-embed': 'youtube', class: 'ytEmbed' },
      ['iframe', HTMLAttributes],
    ];
  },
  addCommands() {
    return {
      setIframe:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

/* --- helpers --- */
const toYouTubeEmbed = (url) => {
  try {
    const u = new URL(url);
    let id = '';
    if (u.hostname.includes('youtu.be')) {
      id = u.pathname.slice(1);
    } else if (u.hostname.includes('youtube.com')) {
      if (u.searchParams.get('v')) id = u.searchParams.get('v');
      else if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/embed/')[1];
    }
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
};

const PostForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();

  // Stable draft id
  const [draftId] = useState(() => params.id || nanoid());

  // Existing draft from Redux
  const existing = useSelector((state) =>
    state.posts.posts.find((p) => p.id === draftId),
  );

  const [title, setTitle] = useState(existing?.title || '');
  const [cover, setCover] = useState(existing?.featuredImage || '');

  // Editor UI state
  const [isEmpty, setIsEmpty] = useState(!existing?.content);
  const [isFocused, setIsFocused] = useState(false);

  // “+” inserter & dropdown
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [plusTop, setPlusTop] = useState(0);

  // Bubble toolbar
  const [showBubble, setShowBubble] = useState(false);
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0 });

  // Unsplash (Picsum) modal
  const [showUnsplash, setShowUnsplash] = useState(false);
  const [unsplashItems, setUnsplashItems] = useState([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);

  const editorAreaRef = useRef(null);
  const plusDockRef = useRef(null);
  const coverInputRef = useRef(null);
  const editorImageInputRef = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit, Iframe],
    content: existing?.content || '',
    editorProps: {
      attributes: {
        spellcheck: 'true',
        'aria-label': 'Post content',
      },
    },
    onUpdate: ({ editor }) => {
      setIsEmpty(editor.isEmpty);
      dispatch(
        addOrUpdatePost({
          id: draftId,
          title,
          featuredImage: cover || '',
          content: editor.getHTML(),
        }),
      );
    },
    onFocus: () => setIsFocused(true),
    onBlur: ({ editor }) => {
      setIsFocused(false);
      setIsEmpty(editor?.isEmpty ?? false);
      setShowBubble(false);
    },
  });

  /* ---------- only touch editor.view after 'create', and guard all reads ---------- */
  useEffect(() => {
    if (!editor) return;

    let mounted = true;
    let updateUI = null;

    const makeUpdate = () => {
      updateUI = () => {
        if (!mounted) return;
        try {
          const holder = editorAreaRef.current;
          if (!holder) return;

          const { state, view } = editor;
          if (!view || !view.dom || !state) return;

          const sel = state.selection;
          if (!sel) return;

          const holderRect = holder.getBoundingClientRect();

          if (sel.empty) {
            const caretRect = posToDOMRect(view, sel.from, sel.from);
            const top = caretRect.top - holderRect.top + caretRect.height / 2;
            setPlusTop(Math.max(0, top));
            setShowBubble(false);
          } else {
            const rect = posToDOMRect(view, sel.from, sel.to);
            const top = rect.top - holderRect.top - 44;
            const left = rect.left - holderRect.left + rect.width / 2;
            setBubblePos({ top: Math.max(0, top), left });
            setShowBubble(true);
          }
        } catch {
          // view may not be ready yet; skip this tick
        }
      };
    };

    const bind = () => {
      makeUpdate();
      if (!updateUI) return;

      editor.on('selectionUpdate', updateUI);
      editor.on('transaction', updateUI);
      updateUI();
    };

    editor.on('create', bind);

    const t = setTimeout(() => {
      try {
        bind();
      } catch {}
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(t);
      if (updateUI) {
        editor.off('selectionUpdate', updateUI);
        editor.off('transaction', updateUI);
      }
      editor.off('create', bind);
    };
  }, [editor]);
  /* ------------------------------------------------------------------- */

  // Close dropdown via ESC and outside click
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowInsertMenu(false);
        setShowUnsplash(false);
      }
    };
    const onDocClick = (e) => {
      if (showInsertMenu) {
        const el = plusDockRef.current;
        if (el && !el.contains(e.target)) setShowInsertMenu(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onDocClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onDocClick);
    };
  }, [showInsertMenu]);

  // Persist also when title/cover changes
  useEffect(() => {
    if (!editor) return;
    dispatch(
      addOrUpdatePost({
        id: draftId,
        title,
        featuredImage: cover || '',
        content: editor.getHTML() || existing?.content || '',
      }),
    );
    setIsEmpty(editor.isEmpty);
  }, [dispatch, draftId, editor, title, cover, existing?.content]);

  // Safety autosave
  useEffect(() => {
    const t = setInterval(() => {
      if (!editor) return;
      dispatch(
        addOrUpdatePost({
          id: draftId,
          title,
          featuredImage: cover || '',
          content: editor.getHTML(),
        }),
      );
      setIsEmpty(editor.isEmpty);
    }, 5000);
    return () => clearInterval(t);
  }, [dispatch, draftId, editor, title, cover]);

  // Navigation
  const goBack = () => {
    dispatch(
      addOrUpdatePost({
        id: draftId,
        title,
        featuredImage: cover || '',
        content: editor ? editor.getHTML() : '',
      }),
    );
    navigate('/');
  };

  // File helpers
  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });

  const onCoverPicked = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = await readFileAsDataUrl(f);
    setCover(String(dataUrl));
  };

  const onCoverDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const dataUrl = await readFileAsDataUrl(f);
    setCover(String(dataUrl));
  };

  const onEditorImagePicked = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !editor) return;
    const dataUrl = await readFileAsDataUrl(f);
    editor.chain().focus().insertContent(`<img src="${dataUrl}" />`).run();
    setShowInsertMenu(false);
    e.target.value = '';
  };

  // Bubble actions
  const toggleHeading = (level) =>
    editor?.chain().focus().toggleHeading({ level }).run();
  const setLink = () => {
    const url = window.prompt('Enter URL');
    if (!url) return;
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // Insert menu actions
  const insertDivider = () => {
    editor?.chain().focus().setHorizontalRule().run();
    setShowInsertMenu(false);
  };
  const insertCodeBlock = () => {
    editor?.chain().focus().toggleCodeBlock().run();
    setShowInsertMenu(false);
  };
  const insertBookmark = () => {
    const url = window.prompt('Bookmark URL');
    if (!url) return;
    editor
      ?.chain()
      .focus()
      .insertContent(`<p><a href="${url}" target="_blank">🔖 ${url}</a></p>`)
      .run();
    setShowInsertMenu(false);
  };

  const insertYouTube = () => {
    const url = window.prompt('Paste a YouTube URL');
    if (!url) return;
    const embed = toYouTubeEmbed(url);
    if (!embed) {
      alert('That does not look like a valid YouTube URL.');
      return;
    }
    editor?.chain().focus().setIframe({ src: embed }).run();
    setShowInsertMenu(false);
  };

  const insertTwitter = () => {
    const url = window.prompt('Paste a Tweet URL');
    if (!url) return;
    editor
      ?.chain()
      .focus()
      .insertContent(
        `<blockquote class="tweetEmbed">Tweet: <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></blockquote>`,
      )
      .run();
    setShowInsertMenu(false);
  };

  const openUnsplash = async () => {
    try {
      setUnsplashLoading(true);
      setShowUnsplash(true);
      const res = await fetch('https://picsum.photos/v2/list?page=1&limit=18');
      const data = await res.json();
      setUnsplashItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert('Could not load images. Try again.');
      setUnsplashItems([]);
    } finally {
      setUnsplashLoading(false);
    }
  };

  const chooseUnsplash = (item) => {
    const src = `https://picsum.photos/id/${item.id}/1200/800`;
    editor?.chain().focus().insertContent(`<img src="${src}" alt="${item.author}" />`).run();
    setShowUnsplash(false);
    setShowInsertMenu(false);
  };

  // Derive current mark/node states for the bubble
  const isBold = !!editor?.isActive('bold');
  const isItalic = !!editor?.isActive('italic');
  const isH2 = !!editor?.isActive('heading', { level: 2 });
  const isH3 = !!editor?.isActive('heading', { level: 3 });
  const headingLabel = isH2 ? 'Heading 2' : isH3 ? 'Heading 3' : null;

  return (
    <div className={styles.editorWrapper}>
      {/* Header */}
      <div className={styles.topbar}>
        <div className={styles.leftMeta}>
          <button className={styles.backChip} onClick={goBack} title="Back">
            <img src="/back.svg" alt="" width="14" height="14" />
          </button>
          <span className={styles.postsText}>Posts</span>
          <span className={styles.statusText}>Draft - Saved</span>
        </div>

        <div className={styles.toolbarRight}>
          <button type="button" className={styles.frameBtn} title="Options">
            <img src="/frame.svg" alt="" width="16" height="16" />
          </button>
          <button className={styles.previewBtn} type="button">Preview</button>
          <button className={styles.publishBtn} type="button" disabled>Publish</button>
        </div>
      </div>

      {/* Cover */}
      <div
        className={styles.cover}
        onDrop={onCoverDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={!cover ? () => coverInputRef.current?.click() : undefined}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!cover && (e.key === 'Enter' || e.key === ' ')) coverInputRef.current?.click();
        }}
      >
        {!cover ? (
          <div className={styles.coverEmpty}>
            <img className={styles.uploadIcon} src="/upload.svg" alt="" />
            <div className={styles.coverLead}>
              <strong>Click to upload post cover</strong>{' '}
              <span className={styles.muted}>or drag and drop</span>
            </div>
            <div className={styles.coverFormats}>SVG, PNG, JPG or GIF (MAX. 800×400px)</div>
          </div>
        ) : (
          <div className={styles.coverFilled}>
            <img className={styles.coverImg} src={cover} alt="Cover" />
          </div>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={onCoverPicked}
        />
      </div>

      {/* Title */}
      <input
        className={styles.titleInput}
        type="text"
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Editor */}
      <div
        ref={editorAreaRef}
        className={`${styles.editorArea} ${isEmpty ? styles.isEmpty : ''} ${isFocused ? styles.isFocused : ''}`}
      >
        {/* Bubble toolbar (like screenshot) */}
        {showBubble && (
          <div
            className={styles.bubbleMenu}
            style={{ top: bubblePos.top, left: bubblePos.left, transform: 'translate(-50%, -8px)' }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
          >
            {headingLabel && (
              <div className={styles.bubbleTag}>{headingLabel}</div>
            )}

            <button
              className={`${styles.bubbleBtn} ${isBold ? styles.bubbleBtnActive : ''}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
              aria-label="Bold"
            >
              B
            </button>

            <button
              className={`${styles.bubbleBtn} ${isItalic ? styles.bubbleBtnActive : ''}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
              aria-label="Italic"
            >
              <span style={{ fontStyle: 'italic' }}>I</span>
            </button>

            <button
              className={`${styles.bubbleBtn} ${isH2 ? styles.bubbleBtnActive : ''}`}
              onClick={() => toggleHeading(2)}
              title="Heading 2"
              aria-label="Heading 2"
            >
              H
            </button>

            <button
              className={`${styles.bubbleBtn} ${isH3 ? styles.bubbleBtnActive : ''}`}
              onClick={() => toggleHeading(3)}
              title="Heading 3"
              aria-label="Heading 3"
            >
              H
            </button>

            <button
              className={styles.bubbleBtn}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Blockquote"
              aria-label="Blockquote"
            >
              <span>❝</span>
            </button>

            <button
              className={styles.bubbleBtn}
              onClick={setLink}
              title="Link"
              aria-label="Link"
            >
              <span>🔗</span>
            </button>
          </div>
        )}

        {/* Plus inserter & dropdown */}
        {editor && isFocused && (
          <div
            ref={plusDockRef}
            className={styles.plusDock}
            style={{ top: plusTop }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.plusBtn}
              onClick={(e) => { e.stopPropagation(); setShowInsertMenu((v) => !v); }}
              title="Add block"
              aria-label="Add block"
            >
              <img src="/plus.svg" alt="" className={styles.plusIcon} />
            </button>

            {showInsertMenu && (
              <div
                className={styles.insertMenu}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className={styles.insertItem}
                  onClick={() => editorImageInputRef.current?.click()}
                >
                  <img className={styles.itemIcon} src="/photo.svg" alt="" />
                  Photo
                </button>
                <button type="button" className={styles.insertItem} onClick={insertCodeBlock}>
                  <img className={styles.itemIcon} src="/html.svg" alt="" />
                  HTML
                </button>
                <button type="button" className={styles.insertItem} onClick={insertDivider}>
                  <img className={styles.itemIcon} src="/divider.svg" alt="" />
                  Divider
                </button>
                <button type="button" className={styles.insertItem} onClick={insertBookmark}>
                  <img className={styles.itemIcon} src="/bookmark.svg" alt="" />
                  Bookmark
                </button>
                <button type="button" className={styles.insertItem} onClick={insertYouTube}>
                  <img className={styles.itemIcon} src="/youtube.svg" alt="" />
                  YouTube
                </button>
                <button type="button" className={styles.insertItem} onClick={insertTwitter}>
                  <img className={styles.itemIcon} src="/twitter.svg" alt="" />
                  Twitter
                </button>
                <button type="button" className={styles.insertItem} onClick={openUnsplash}>
                  <img className={styles.itemIcon} src="/unsplash.svg" alt="" />
                  Unsplash
                </button>
              </div>
            )}
          </div>
        )}

        {/* hidden picker for editor images */}
        <input
          ref={editorImageInputRef}
          type="file"
          accept="image/*"
          onChange={onEditorImagePicked}
          className={styles.hiddenInput}
          onClick={(e) => e.stopPropagation()}
        />

        {/* content */}
        <div className={styles.editorContent}>
          {isEmpty && !isFocused && (
            <div className={styles.pmPlaceholder}>Begin writing your post...</div>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Unsplash (Picsum) Modal */}
      {showUnsplash && (
        <div className={styles.modalOverlay} onClick={() => setShowUnsplash(false)}>
          <div className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Choose an image</div>
              <button className={styles.modalClose} onClick={() => setShowUnsplash(false)} aria-label="Close">×</button>
            </div>
            <div className={styles.modalBody}>
              {unsplashLoading ? (
                <div className={styles.modalLoading}>Loading…</div>
              ) : (
                <div className={styles.modalGrid}>
                  {unsplashItems.map((it) => (
                    <button
                      key={it.id}
                      className={styles.modalThumb}
                      onClick={() => chooseUnsplash(it)}
                      title={`Photo by ${it.author}`}
                    >
                      <img src={`https://picsum.photos/id/${it.id}/300/200`} alt={it.author} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostForm;
