// src/components/ComposeMail.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import './ComposeMail.css'; // Ensure the CSS is correctly linked
import Button from './Button'; // Assuming Button component is available


import styled from 'styled-components'; // Used for the input styling
import uploadIcon from '../assets/upload-icon.png';
// Styled component for animated input labels
const StyledInputWrapper = styled.div`
  .wave-group {
    position: relative;
  }
  .wave-group .input {
  font-size: 16px;
  padding: 12px 10px;
  transform: none;
    display: block;
    width: 100%;
    border: none;
    background: transparent;
    color: #3c4043; /* Fallback for light mode */
  }
  body.dark .wave-group .input {
    color: #f5f5f5; /* For dark mode */
  }
  .wave-group .input:focus {
    outline: none;
  }
  .wave-group .label {
    color: #70757a; /* Fallback for light mode */
    font-size: 0.85rem;
    font-weight: normal;
    position: absolute;
    pointer-events: none;
    left: 5px;
    top: 10px;
    display: flex;
  }
  body.dark .wave-group .label {
    color: #b0b0b0; /* For dark mode */
  }
  .wave-group .label-char {
    transition: 0.2s ease all;
    transition-delay: calc(var(--index) * 0.05s);
  }
  .wave-group .input:focus ~ label .label-char,
  .wave-group .input:valid ~ label .label-char {
    transform: translateY(-20px);
    font-size: 14px;
    color: var(--primary-color); /* Using global variable */
  }
  .wave-group .bar {
    position: relative;
    display: block;
    width: 100%;
  }
  .wave-group .bar:before,
  .wave-group .bar:after {
    content: '';
    height: 2px;
    width: 0;
    bottom: 1px;
    position: absolute;
    background: var(--primary-color); /* Using global variable */
    transition: 0.2s ease all;
  }
  .wave-group .bar:before {
    left: 50%;
  }
  .wave-group .bar:after {
    right: 50%;
  }
  .wave-group .input:focus ~ .bar:before,
  .wave-group .input:focus ~ .bar:after {
    width: 50%;
  }
`;

// Input component using the styled wrapper
const Input = ({ label, value, onChange }) => (
  <StyledInputWrapper>
    <div className="wave-group">
      <input required type="text" className="input" value={value} onChange={onChange} />
      <span className="bar" />
      <label className="label">
        {label.split('').map((char, index) => (
          <span key={index} className="label-char" style={{ '--index': index }}>
            {char}
          </span>
        ))}
      </label>
    </div>
  </StyledInputWrapper>
);

const ComposeMail = ({ darkMode, recentRecipients = [], setRecentRecipients, onViewMail, user }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef();

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Handler for emoji selection
  const handleEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  // Handler for file attachment
  const handleAttach = (e) => {
    const files = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...files]);
  };

  // Handler for removing an attachment
  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handler for sending the email
  const handleSend = async () => {
    const formData = new FormData();
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('message', message);
    attachments.forEach((file, index) => {
      formData.append(`attachment${index}`, file);
    });

    try {
      const response = await fetch('http://localhost:5000/api/send-email', { // Corrected endpoint here
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Mail Sent Successfully! ✅ Server response: ${data.message || 'Email sent.'}`);

        // Update recent recipients (realtime aspect)
        // Ensure to use the ID returned by the backend for opening the sent mail
        const newRecipient = {
          name: to,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(to)}&background=4285f4&color=fff&size=64`,
          id: data.id // Use the ID from the backend response
        };
        const currentRecipients = Array.isArray(recentRecipients) ? recentRecipients : [];
        const filtered = currentRecipients.filter((r) => r.name !== to);
        const updated = [newRecipient, ...filtered];
        setRecentRecipients(updated.slice(0, 6)); // Keep only the last 6 recipients

        // Clear form fields
        setTo('');
        setSubject('');
        setMessage('');
        setAttachments([]);
        setShowPicker(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to send mail: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('An error occurred while sending the mail. Please try again.');
    }
  };

  // Handlers for link modal
  const handleLinkInsert = () => setShowLinkModal(true);
  const handleInsertLinkConfirmed = () => {
    let linkMarkdown = linkUrl ? (linkText ? `[${linkText}](${linkUrl})` : linkUrl) : '';
    setMessage((prev) => prev + linkMarkdown);
    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
  };
  const handleCancelLinkInsert = () => {
    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
  };

  return (
    <div className="app-container">
      <div className="main-content-area">
        {/* This is the single, integrated panel that contains BOTH the recent recipients and the compose mail interface */}
        <div className="compose-with-recent-panel">
          {/* Recent Recipients Panel - RENAMED TO SENT MAILS */}
          <motion.div
            className="recent-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Changed title from "Recent" to "Sent Mails" */}
            <h4>Sent Mails</h4>
            {Array.isArray(recentRecipients) && recentRecipients.length > 0 ? (
              recentRecipients.map((recipient, idx) => (
                <div
                  className="recent-item"
                  key={idx}
                  onClick={() => onViewMail(recipient.id)} // Click to view mail
                >
                  <img
                    src={recipient.avatar} // CORRECTED: Use recipient's avatar
                    alt={recipient.name}   // CORRECTED: Use recipient's name
                    className="recent-avatar"
                  />
                  <span>{recipient.name}</span>
                </div>
              ))
            ) : (
              <span style={{ color: darkMode ? '#b0b0b0' : '#888', fontSize: '0.85rem' }}>No sent mails yet</span>
            )}
          </motion.div>

          {/* Compose Mail Container */}
          <motion.div
            className="compose-mail-container"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="compose-mail-header">
              <span className="header-title">New Message</span>
              
            </div>
            <div className="compose-mail-body">
              <div className="input-row border-bottom">
                <Input label="To" value={to} onChange={(e) => setTo(e.target.value)} />
                
              </div>
              <div className="input-row border-bottom">
                <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="message-area">
                <textarea
                  placeholder=""
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="message-textarea"
                />
              </div>

              {/* Attachments display */}
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div
                    className="attachment-chips-container"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {attachments.map((file, idx) => (
                      <motion.div
                        key={idx}
                        className="attachment-chip"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <span>{file.name}</span>
                        <motion.button
                          className="remove-attachment"
                          onClick={() => handleRemoveAttachment(idx)}
                        >
                          ✕
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              
            </div>

            {/* Mail compose footer with buttons */}
            <div className="compose-mail-footer">
              <Button onClick={handleSend} buttonText="SEND" />
              <div className="toolbar-icons">
              <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleAttach}
                  style={{ display: 'none' }}
                />
                <motion.button className="icon-button" onClick={() => fileInputRef.current.click()} title="attach a file">
                  <label className="attachment-button" onClick={() => fileInputRef.current?.click()}>
                              <img src={uploadIcon} alt="Upload" style={{ width: '34px', height: '24px', cursor: 'pointer' }} />
                            </label>
                </motion.button>
                
                
                
              </div>
              <div className="footer-right-icons">
                
              </div>
            </div>

            {/* Link insertion modal */}
            <AnimatePresence>
              {showLinkModal && (
                <motion.div className="modal-overlay" onClick={handleCancelLinkInsert}>
                  <motion.div className="link-modal" onClick={(e) => e.stopPropagation()}>
                    <h3>Insert Link</h3>
                    <input
                      type="text"
                      placeholder="URL"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Display text (optional)"
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                    />
                    <div className="modal-actions">
                      <button className="cancel-button" onClick={handleCancelLinkInsert}>
                        Cancel
                      </button>
                      <button className="insert-button" onClick={handleInsertLinkConfirmed}>
                        Insert
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ComposeMail;