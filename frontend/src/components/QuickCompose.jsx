import React, { useState } from 'react';
import styled from 'styled-components';

const QuickCompose = ({ to, onClose }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!message.trim()) return;
    const formData = new FormData();
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('message', message);

    await fetch('http://localhost:5000/api/send-reply', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    onClose(); // Close after sending
  };

  return (
    <Overlay onClick={onClose}>
      <ComposeBox onClick={(e) => e.stopPropagation()}>
        <h3>New Message</h3>
        <label>To</label>
        <input value={to} readOnly />
        <label>Subject</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} />
        <label>Message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="buttons">
          <button className="send" onClick={handleSend}>Send</button>
          <button className="cancel" onClick={onClose}>Cancel</button>
        </div>
      </ComposeBox>
    </Overlay>
  );
};

export default QuickCompose;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(10px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
`;

const ComposeBox = styled.div`
  background: white;
  padding: 20px;
  border-radius: 16px;
  max-width: 400px;
  width: 90%;
  animation: scaleIn 0.3s ease;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);

  h3 {
    margin-top: 0;
    margin-bottom: 12px;
  }

  label {
    font-size: 0.9rem;
    font-weight: 600;
    margin-top: 10px;
    display: block;
  }

  input, textarea {
    width: 100%;
    margin-top: 4px;
    margin-bottom: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid #ccc;
    font-size: 14px;
  }

  textarea {
    min-height: 80px;
    resize: vertical;
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 10px;
  }

  .send {
    background: #1a73e8;
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
  }

  .cancel {
    background: transparent;
    border: 1px solid #ccc;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
  }

  @keyframes scaleIn {
    from { transform: scale(0.85); opacity: 0 }
    to   { transform: scale(1); opacity: 1 }
  }

  @keyframes fadeIn {
    from { opacity: 0 }
    to   { opacity: 1 }
  }
`;
