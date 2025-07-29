import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchFeed } from '../../store/slices/postsSlice';

const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const { posts, isLoading } = useAppSelector((state) => state.posts);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchFeed());
  }, [dispatch]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome back, {user?.name}!
        </h1>
        
        {/* Create Post */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar || 'https://via.placeholder.com/40'}
              alt={user?.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="What's on your mind?"
                rows={3}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700">
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No posts yet. Start following people or create your first post!
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={post.user.avatar || 'https://via.placeholder.com/40'}
                  alt={post.user.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{post.user.name}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <p className="text-gray-800 mb-4">{post.content}</p>
              
              <div className="flex items-center space-x-6 text-gray-500">
                <button className="flex items-center space-x-2 hover:text-primary-600">
                  <span>❤️</span>
                  <span>{post.likes.length}</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-primary-600">
                  <span>💬</span>
                  <span>{post.comments.length}</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-primary-600">
                  <span>🔄</span>
                  <span>{post.shares.length}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Home;