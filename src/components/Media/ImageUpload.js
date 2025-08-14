import React from 'react'

const ImageUpload = ({ editor }) => {
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result }).run()
    }
    reader.readAsDataURL(file)
  }

  return (
    <input type="file" accept="image/*" onChange={handleImageUpload} />
  )
}

export default ImageUpload
