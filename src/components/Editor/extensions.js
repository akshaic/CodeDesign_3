import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import js from 'highlight.js/lib/languages/javascript'

// ✅ Create proper lowlight instance
const lowlight = createLowlight()
lowlight.register('js', js)

export const extensions = [
  StarterKit.configure({
    codeBlock: false,
    underline: false,
    link: false,
  }),
  Underline,
  Link.configure({
    openOnClick: false,
  }),
  Image,
  CodeBlockLowlight.configure({
    lowlight, // ✅ Now passing a valid instance
  }),
]
