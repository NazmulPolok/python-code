import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { loadUser } from './store/slices/authSlice';
import axios from 'axios';

// Components
import Navbar from './components/Layout/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Home from './components/Home/Home';
import Profile from './components/Profile/Profile';
import Chat from './components/Chat/Chat';
import Food from './components/Food/Food';
import Rides from './components/Rides/Rides';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Set axios base URL
axios.defaults.baseURL = 'http://localhost:5000';

function AppContent() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(loadUser());
    }
  }, [dispatch, token, isAuthenticated]);

  // Set authorization header for all requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <Navbar />}
        
        <main className={isAuthenticated ? 'pt-16' : ''}>
          <Routes>
            {!isAuthenticated ? (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/food" element={<Food />} />
                <Route path="/rides" element={<Rides />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
