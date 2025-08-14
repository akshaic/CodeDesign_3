import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { extensions } from './extensions'
import Toolbar from './Toolbar'
import styles from '../../styles/editor.module.css'
import { useDispatch } from 'react-redux'
import { addOrUpdatePost } from '../../redux/postsSlice'
import debounce from 'lodash.debounce'

const BlogEditor = ({ postId, initialContent }) => {
  const dispatch = useDispatch()

  const editor = useEditor({
    extensions,
    content: initialContent,
    onUpdate: debounce(({ editor }) => {
      dispatch(
        addOrUpdatePost({
          id: postId,
          title: `Post ${postId}`,
          content: editor.getHTML(),
        })
      )
    }, 1000),
  })

  return (
    <div className={styles.editorWrapper}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className={styles.editorArea} />
    </div>
  )
}

export default BlogEditor
