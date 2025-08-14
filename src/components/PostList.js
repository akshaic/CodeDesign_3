import React from 'react'
import { useSelector } from 'react-redux'

const PostList = () => {
  const posts = useSelector((state) => state.posts.posts)

  return (
    <div>
      <h2>Saved Posts</h2>
      {posts.length === 0 && <p>No posts yet.</p>}
      {posts.map(post => (
        <div key={post.id} style={{ marginBottom: '2rem' }}>
          <h3>{post.title}</h3>
          {post.featuredImage && (
            <img
              src={post.featuredImage}
              alt="Featured"
              style={{ maxWidth: '100%', borderRadius: '4px', marginBottom: '1rem' }}
            />
          )}
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
          <hr />
        </div>
      ))}
    </div>
  )
}

export default PostList
