import React from 'react';

const Chat: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow h-96 flex">
        <div className="w-1/3 border-r border-gray-200 p-4">
          <h2 className="text-xl font-semibold mb-4">Conversations</h2>
          <div className="text-gray-500 text-center py-8">
            No conversations yet
          </div>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <h3 className="text-lg font-medium mb-2">End-to-End Encrypted Messaging</h3>
            <p>Select a conversation to start chatting</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;