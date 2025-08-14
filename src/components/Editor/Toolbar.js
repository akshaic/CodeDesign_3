import React from 'react'
import styles from '../../styles/toolbar.module.css'

const Toolbar = ({ editor }) => {
  if (!editor) return null

  return (
    <div className={styles.toolbar}>
      <button onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()}>Underline</button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()}>Strike</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</button>
      <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>HR</button>
      <button onClick={() => editor.chain().focus().setLink({ href: prompt('URL') }).run()}>Link</button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code</button>
    </div>
  )
}

export default Toolbar
