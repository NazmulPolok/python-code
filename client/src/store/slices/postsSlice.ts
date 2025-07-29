import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface Post {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar: string;
  };
  content: string;
  media: any[];
  likes: string[];
  comments: any[];
  shares: any[];
  createdAt: string;
}

interface PostsState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PostsState = {
  posts: [],
  isLoading: false,
  error: null,
};

export const fetchFeed = createAsyncThunk(
  'posts/fetchFeed',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/posts/feed', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data.posts;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch posts');
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData: { content: string; media?: any[] }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/posts', postData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data.post;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create post');
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
      });
  },
});

export const { clearError } = postsSlice.actions;
export default postsSlice.reducer;