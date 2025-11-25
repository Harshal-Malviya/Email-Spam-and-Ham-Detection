// frontend/src/components/MessageBubble.jsx
import React from 'react';
import './MessageBubble.css';

const MessageBubble = ({ message }) => {
  const isMe = message.sender === 'me';
  return (
    <div className={`bubble ${isMe ? 'right' : 'left'}`}>
      <p>{message.text}</p>
      <span className="time">{message.time}</span>
      {message.attachments?.length > 0 && (
        <div className="attachment">{message.attachments[0]}</div>
      )}
    </div>
  );
};

export default MessageBubble;
