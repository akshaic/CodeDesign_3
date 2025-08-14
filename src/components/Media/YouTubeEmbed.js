import React, { useEffect } from 'react'

const YouTubeEmbed = ({ editor }) => {
  useEffect(() => {
    if (!editor) return

    const handlePaste = (event) => {
      const paste = (event.clipboardData || window.clipboardData).getData('text')
      const match = paste.match(/(?:https?:\/\/)?(?:www\.)?youtu(?:\.be|be\.com)\/(?:watch\?v=)?([^\s&]+)/)

      if (match) {
        const videoId = match[1]
        const embedHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`
        event.preventDefault()
        editor.chain().focus().insertContent(embedHTML).run()
      }
    }

    const el = document.querySelector('.ProseMirror')
    el?.addEventListener('paste', handlePaste)

    return () => {
      el?.removeEventListener('paste', handlePaste)
    }
  }, [editor])

  return null
}

export default YouTubeEmbed
