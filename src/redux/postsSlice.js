import { createSlice, nanoid } from '@reduxjs/toolkit';

const initialState = {
  posts: [], // {id, title, content, featuredImage, createdAt, updatedAt}
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    addOrUpdatePost: {
      reducer(state, action) {
        const p = action.payload;
        const idx = state.posts.findIndex(x => x.id === p.id);
        if (idx !== -1) {
          // update existing
          state.posts[idx] = {
            ...state.posts[idx],
            ...p,
            // always bump updatedAt when saving
            updatedAt: new Date().toISOString(),
          };
        } else {
          // insert new as draft
          state.posts.unshift({
            id: p.id,
            title: p.title || '',
            content: p.content || '',
            featuredImage: p.featuredImage || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      },
      prepare(post) {
        return {
          payload: {
            ...post,
            id: post.id || nanoid(),
          },
        };
      },
    },
    deletePost(state, action) {
      state.posts = state.posts.filter(p => p.id !== action.payload);
    },
  },
});

export const { addOrUpdatePost, deletePost } = postsSlice.actions;
export default postsSlice.reducer;
