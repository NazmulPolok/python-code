import React from 'react';

const Rides: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Book a Ride</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Where to?</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Location
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter pickup location"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drop-off Location
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter destination"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['🚗 Car', '🏍️ Bike', '🚲 Bicycle', '🛴 Scooter'].map((type) => (
              <button
                key={type}
                className="p-3 border border-gray-300 rounded-md hover:border-primary-500 text-center"
              >
                {type}
              </button>
            ))}
          </div>
          
          <button className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 font-medium">
            Request Ride
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Rides</h2>
        <div className="text-gray-500 text-center py-8">
          No recent rides
        </div>
      </div>
    </div>
  );
};

export default Rides;