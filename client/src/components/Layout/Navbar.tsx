import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-primary-600">
              SocialFoodRide
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Home
              </Link>
              <Link
                to="/chat"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/chat') 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Chat
              </Link>
              <Link
                to="/food"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/food') 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Food
              </Link>
              <Link
                to="/rides"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/rides') 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Rides
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/profile" className="flex items-center space-x-2">
              <img
                src={user?.avatar || 'https://via.placeholder.com/32'}
                alt={user?.name}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;