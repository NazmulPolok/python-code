import React from 'react';

const Food: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Food Delivery</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">Restaurant {i}</h3>
              <p className="text-gray-600 text-sm mb-2">Italian, Pizza, Pasta</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">⭐ 4.5 (120 reviews)</span>
                <span className="text-sm font-medium">$2.99 delivery</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Food;