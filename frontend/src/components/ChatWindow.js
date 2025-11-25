import React from 'react';
import './styles.css';

const ChatWindow = ({ userEmail }) => {
  return (
    <div className="chat-window">
      <p className="user-email">{userEmail}</p>
      <div className="email-preview shimmer" />
      <div className="email-preview shimmer" />
      <div className="email-preview shimmer" />
      <div className="reply-box">
        <input type="text" placeholder="Reply" />
        <button>📨</button>
      </div>
    </div>
  );
};

export default ChatWindow;
