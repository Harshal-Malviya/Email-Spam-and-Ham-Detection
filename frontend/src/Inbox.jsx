import React, { useEffect, useRef, useState, useCallback } from 'react';
import './Inbox.css';
import replyIcon from '../assets/reply-icon.png';
import chatIcon from '../assets/chat-icon.png';
import refreshIcon from '../assets/refresh.png';
import { useNavigate } from 'react-router-dom';

const Inbox = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);
  const [pinnedIndex, setPinnedIndex] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState(null);
  const [sendingIndex, setSendingIndex] = useState(null);
  const [sentIndex, setSentIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState('primary');
  const replyBoxRef = useRef(null);
  const navigate = useNavigate();

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/inbox?category=${activeCategory}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.error) {
        const newEmails = Array.isArray(data.messages) ? data.messages : data;
        setEmails(newEmails);
      } else {
        console.error('Failed to fetch inbox data:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const extractNameEmail = (fromHeader) => {
    const match = fromHeader.match(/^(.*?)(?: <(.*)>)?$/);
    return {
      name: match?.[1]?.trim() || 'Unknown',
      email: match?.[2]?.trim() || match?.[1]?.trim() || 'unknown@example.com',
    };
  };

  const handleReplyToggle = (index) => {
    setPinnedIndex(prev => (prev === index ? null : index));
    setReplyText('');
    setReplyFile(null);
    setSentIndex(null);
  };

  const handleSendReply = async (email, index) => {
    if (!replyText.trim() && !replyFile) return;

    const formData = new FormData();
    formData.append('to', email.email || email.from);
    formData.append('subject', `Re: ${email.subject}`);
    formData.append('message', replyText);
    if (replyFile) {
      formData.append('file', replyFile);
    }

    setSendingIndex(index);
    setSentIndex(null);

    try {
      const response = await fetch('http://localhost:5000/api/send-reply', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setSentIndex(index);
        setReplyText('');
        setReplyFile(null);
        fetchInbox();
        setTimeout(() => {
          setPinnedIndex(null);
          setSentIndex(null);
        }, 1200);
      } else {
        alert('Failed to send reply.');
      }
    } catch (error) {
      console.error('Message', error);
      alert('Message Sent');
    } finally {
      setSendingIndex(null);
    }
  };

  const handleStar = async (emailId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/email/${emailId}/star`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setEmails(emails.map(email =>
          email.id === emailId ? { ...email, starred: true } : email
        ));
      } else {
        console.error('Failed to star email:', data.error);
      }
    } catch (error) {
      console.error('Error starring email:', error);
    }
  };

  const handleArchive = async (emailId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/email/${emailId}/archive`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setEmails(emails.filter(email => email.id !== emailId));
      } else {
        console.error('Failed to archive email:', data.error);
      }
      fetchInbox();
    } catch (error) {
      console.error('Error archiving email:', error);
    }
  };

  const handleSpam = async (emailId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/email/${emailId}/spam`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setEmails(emails.filter(email => email.id !== emailId));
      } else {
        console.error('Failed to mark email as spam:', data.error);
      }
      fetchInbox();
    } catch (error) {
      console.error('Error marking email as spam:', error);
    }
  };

  const handleDelete = async (emailId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/email/${emailId}/delete`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setEmails(emails.filter(email => email.id !== emailId));
      } else {
        console.error('Failed to delete email:', data.error);
      }
      fetchInbox();
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pinnedIndex !== null &&
        replyBoxRef.current &&
        !replyBoxRef.current.contains(event.target)
      ) {
        setPinnedIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pinnedIndex]);

  const categories = ['primary', 'promotions', 'social', 'updates', 'forums'];

  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h2>
          <img src="inboxbro.png" alt="" className="mail2-icon" /> Inbox
        </h2>
      </div>

      <div className="inbox-controls">
        <button
          onClick={fetchInbox}
          className={`refresh-button ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          <img src={refreshIcon} alt="Refresh" className="refresh-icon-img" />
          <span className="refresh-label">{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>

        <div className="tabs">
          {categories.map((category, index) => (
            <React.Fragment key={category}>
              <input
                type="radio"
                id={`radio-${category}`}
                name="tabs"
                checked={activeCategory === category}
                onChange={() => {
                  setActiveCategory(category);
                  setOpenIndex(null);
                  setPinnedIndex(null);
                }}
                disabled={loading}
              />
              <label className="tab" htmlFor={`radio-${category}`}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </label>
            </React.Fragment>
          ))}
          <span className="glider" />
        </div>
      </div>

      {loading && emails.length === 0 ? (
        <div className="email-scroll">
          {[...Array(4)].map((_, index) => (
            <div className="email-card skeleton" key={index}>
              <div className="avatar skeleton-avatar" />
              <div className="email-content">
                <div className="skeleton-line short" />
                <div className="skeleton-line medium" />
                <div className="skeleton-line long" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="email-scroll">
          {emails.map((email, index) => {
            const { name, email: address } = extractNameEmail(email.from);
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              name
            )}&background=4285f4&color=fff`;

            return (
              <div
                key={email.id}
                className={`email-card ${openIndex === index ? 'expanded' : ''}`}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <img className="avatar" src={avatarUrl} alt={name} />
                <div className="email-content">
                  <div className="sender-line">
                    <span className="sender-name">{name}</span>
                    <span className="sender-email">{address}</span>
                    <button
                      className="chat-icon-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `/chat?threadId=${email.threadId}&name=${encodeURIComponent(
                            name
                          )}&email=${address}`,
                          '_blank'
                        );
                      }}
                    >
                      <img src={chatIcon} alt="Chat" className="chat-icon" />
                    </button>
                  </div>

                  <div className="email-subject">{email.subject}</div>

                  <div className={`email-snippet-container ${openIndex === index ? 'visible' : ''}`}>
                    <div className="email-snippet">
                      {email.snippet}
                      <br />
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/mail/${email.id}`);
                        }}
                        style={{
                          marginTop: '8px',
                          background: 'none',
                          color: '#1a73e8',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          fontWeight: 'bold',
                          textDecoration: 'none',
                        }}
                      >
                        View full mail →
                      </span>
                    </div>
                  </div>

                  <button
                    className="reply-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReplyToggle(index);
                    }}
                  >
                    <img src={replyIcon} alt="Reply" className="reply-icon" />
                  </button>

                  <div
                    className={`quick-reply-wrapper ${pinnedIndex === index ? 'visible' : ''}`}
                    ref={pinnedIndex === index ? replyBoxRef : null}
                  >
                    <div className="quick-reply">
                      <input
                        type="text"
                        placeholder="Write a quick reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <label className="file-attach">
                        🔗
                        <input
                          type="file"
                          onChange={(e) => setReplyFile(e.target.files[0])}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <button
                        className={`send-button ${sendingIndex === index ? 'sending' : ''} ${
                          sentIndex === index ? 'sent' : ''
                        }`}
                        disabled={sendingIndex === index}
                        onClick={() => handleSendReply(email, index)}
                      >
                        {sendingIndex === index ? (
                          <div className="spinner" />
                        ) : sentIndex === index ? (
                          <span className="checkmark">✔</span>
                        ) : (
                          'Send'
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bottom-row">
                    <div className="timestamp-bottom-right">{email.timestamp}</div>
                  </div>
                </div>
                <div className="email-options-wrapper">
                  <div className="dropdown-menu">
                    <button onClick={() => handleStar(email.id)}>⭐ Star</button>
                    <button onClick={() => handleArchive(email.id)}>📥 Archive</button>
                    <button onClick={() => handleSpam(email.id)}>🚫 Spam</button>
                    <button onClick={() => handleDelete(email.id)}>🗑️ Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inbox;