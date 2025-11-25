// Inbox.jsx
import React, { useEffect, useRef, useState } from 'react';
import './Inbox.css';
import replyIcon from '../assets/reply-icon.png';
import chatIcon from '../assets/chat-icon.png'; // your new chat icon

const Inbox = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);
  const [pinnedIndex, setPinnedIndex] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState(null);
  const [sendingIndex, setSendingIndex] = useState(null);
  const [sentIndex, setSentIndex] = useState(null);
  const replyBoxRef = useRef(null);
  
  
  



  useEffect(() => {
    fetch("http://localhost:5000/api/inbox", {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          const newEmails = Array.isArray(data.messages) ? data.messages : data;
          setEmails(newEmails);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch inbox:", err);
        setLoading(false);
      });
  }, []);
  

  const extractNameEmail = (fromHeader) => {
    const match = fromHeader.match(/^(.*?)(?: <(.*)>)?$/);
    return {
      name: match?.[1]?.trim() || 'Unknown',
      email: match?.[2]?.trim() || match?.[1]?.trim() || 'unknown@example.com',
    };
  };

  const handleReplyToggle = (index) => {
    setPinnedIndex(prev => (prev === index ? null : index));
    setReplyText("");
    setReplyFile(null);
    setSentIndex(null);
  };





  const handleSendReply = async (email, index) => {
    if (!replyText.trim() && !replyFile) return;

    const formData = new FormData();
    formData.append("to", email.email || email.from);
    formData.append("subject", `Re: ${email.subject}`);
    formData.append("message", replyText);
    if (replyFile) {
      formData.append("file", replyFile);
    }

    setSendingIndex(index);
    setSentIndex(null);

    try {
      const response = await fetch("http://localhost:5000/api/send-reply", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        setSentIndex(index);
        setReplyText("");
        setReplyFile(null);
        setTimeout(() => {
          setPinnedIndex(null);
          setSentIndex(null);
        }, 1200); // Collapse after animation
      } else {
        alert("Failed to send reply.");
      }
    } catch (error) {
      console.error("Message", error);
      alert("Message Sent");
    } finally {
      setSendingIndex(null);
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

  return (
    <div className="inbox-container">
      <div><h2><img src="inboxbro.png" alt="" className="mail2-icon" /> Inbox</h2></div>
      {loading ? (
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
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285f4&color=fff`;

            return (
              <div
                key={index}
                className={`email-card ${openIndex === index ? 'expanded' : ''}`}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              
              >
                <img className="avatar" src={avatarUrl} alt={name} />
                <div className="email-content">
                  <div className="sender-line">
  <span className="sender-name">{name}</span>
<button
  className="chat-icon-button"
  onClick={(e) => {
    e.stopPropagation();
    window.open(`/chat?threadId=${email.threadId}&name=${encodeURIComponent(name)}&email=${address}`, "_blank");
  }}
>
  <img src={chatIcon} alt="Chat" className="chat-icon" />
</button>

</div>
                  <div className="email-header">
                    <div className="sender-line">
</div>
                    <div className="sender-email">{address}</div>
                  </div>
<div className="email-subject">
  {email.subject}
  <span
    style={{
      marginLeft: "10px",
      padding: "2px 8px",
      borderRadius: "12px",
      fontSize: "0.8rem",
      backgroundColor: email.spam_status === "Spam" ? "#ef4444" : "#22c55e",
      color: "white"
    }}
  >
    {email.spam_status}
  </span>
</div>


                  {openIndex === index && (
                    <div className="email-snippet">{email.snippet}</div>
                  )}
                  <div className="timestamp">{email.timestamp}</div>
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
                        className={`send-button ${sendingIndex === index ? 'sending' : ''} ${sentIndex === index ? 'sent' : ''}`}
                        disabled={sendingIndex === index}
                        onClick={() => handleSendReply(email, index)}
                      >
                        {sendingIndex === index ? (
                          <div className="spinner" />
                        ) : sentIndex === index ? (
                          <span className="checkmark">✔</span>
                        ) : (
                          "Send"
                        )}
                      </button>
                    </div>
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