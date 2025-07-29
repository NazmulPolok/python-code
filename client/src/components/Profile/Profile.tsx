import React from 'react';
import { useAppSelector } from '../../hooks/redux';

const Profile: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-6 mb-8">
          <img
            src={user?.avatar || 'https://via.placeholder.com/100'}
            alt={user?.name}
            className="w-24 h-24 rounded-full"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-gray-600">{user?.email}</p>
            <p className="text-sm text-gray-500 capitalize">Role: {user?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea 
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Tell us about yourself..."
                  defaultValue={user?.bio}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input 
                  type="tel"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Your phone number"
                  defaultValue={user?.phone}
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            <div className="space-y-4">
              <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700">
                Update Profile
              </button>
              <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;