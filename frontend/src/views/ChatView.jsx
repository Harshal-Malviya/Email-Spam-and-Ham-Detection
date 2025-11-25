// frontend/src/views/ChatView.jsx
import React, { useEffect, useState } from 'react';
import MessageBubble from '../components/MessageBubble';

const ChatView = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/messages')
      .then(res => res.json())
      .then(data => setMessages(data));
  }, []);

  return (
    <div className="chat-view">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
};

export default ChatView;
