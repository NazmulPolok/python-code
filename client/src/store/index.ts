import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import postsSlice from './slices/postsSlice';
import messagesSlice from './slices/messagesSlice';
import ridesSlice from './slices/ridesSlice';
import ordersSlice from './slices/ordersSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    posts: postsSlice,
    messages: messagesSlice,
    rides: ridesSlice,
    orders: ordersSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;