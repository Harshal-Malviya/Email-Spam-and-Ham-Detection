import React, { useState } from 'react';
import './styles.css';

const EmailComposer = ({ onSend }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="composer">
      <h2>Compose Email</h2>
      <input type="text" placeholder="To" value={to} onChange={e => setTo(e.target.value)} />
      <input type="text" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
      <textarea placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={() => onSend({ to, subject, message })}>Send</button>
    </div>
  );
};

export default EmailComposer;
