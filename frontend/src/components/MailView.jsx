// MailView.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [attachment, setAttachment] = useState(null);


  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/inbox/${id}`, {
          credentials: 'include',
        });
        const data = await res.json();
        setEmail(data);
      } catch (err) {
        console.error("Failed to load mail:", err);
      }
    };
    fetchEmail();
  }, [id]);

  if (!email) return <p>Loading...</p>;

  const { from, subject, body, timestamp, attachments = [] } = email;

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: 'auto' }}>
      <button onClick={() => navigate('/')} style={{
        marginBottom: '1rem',
        background: '#f1f1f1',
        border: '1px solid #ccc',
        padding: '6px 12px',
        borderRadius: '6px',
        cursor: 'pointer'
      }}>
        ← Back to Inbox
      </button>

      <h2>{subject}</h2>
      <p><strong>From:</strong> {from}</p>
      <p><strong>Time:</strong> {timestamp}</p>
      <hr />

      {/* HTML body */}
      <div
        dangerouslySetInnerHTML={{ __html: body }}
        style={{
          fontFamily: 'Arial, sans-serif',
          lineHeight: '1.6',
          marginTop: '1rem',
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 0 6px rgba(0,0,0,0.1)'
        }}
      />

      {/* Attachments */}
      {attachments.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Attachments:</h3>
          <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
            {attachments.map((att, index) => (
              <li key={index} style={{ marginBottom: '1rem' }}>
                <a
                  href={`http://localhost:5000/api/attachment/${email.id}/${att.attachmentId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#1a73e8',
                    textDecoration: 'underline',
                    fontWeight: 'bold'
                  }}
                >
                  📎 {att.filename}
                </a>
                {att.mimeType.startsWith("image/") && (
                  <div>
                    <img
                      src={`http://localhost:5000/api/attachment/${email.id}/${att.attachmentId}`}
                      alt={att.filename}
                      style={{
                        maxWidth: '100%',
                        marginTop: '10px',
                        borderRadius: '8px',
                        boxShadow: '0 0 5px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reply Box */}
      {!sent ? (
        <div style={{
          marginTop: '2rem',
          borderTop: '1px solid #ccc',
          paddingTop: '1rem'
        }}>
          <h3>Reply to this email</h3>
          <textarea
  value={replyText}
  onChange={(e) => setReplyText(e.target.value)}
  placeholder="Write your reply here..."
  rows={6}
  style={{
    width: '100%',
    padding: '0.8rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '1rem'
  }}
/>

<div style={{ marginTop: '1rem' }}>
  <label style={{ fontWeight: 'bold' }}>📎 Attach a file:</label>
  <input
    type="file"
    onChange={(e) => setAttachment(e.target.files[0])}
    style={{ display: 'block', marginTop: '0.5rem' }}
  />
  {attachment && (
    <p style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
      Attached: {attachment.name}
    </p>
  )}
</div>

<button
  onClick={async () => {
    setSending(true);
    const formData = new FormData();
    formData.append("threadId", email.threadId);
    formData.append("to", email.from);
    formData.append("subject", email.subject);
    formData.append("message", replyText);
    if (attachment) formData.append("file", attachment);

    try {
      await fetch("http://localhost:5000/api/reply", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      setSent(true);
    } catch (err) {
      console.error("Reply failed:", err);
    }
    setSending(false);
  }}
  disabled={sending || !replyText.trim()}
  style={{
    marginTop: '1rem',
    backgroundColor: '#1a73e8',
    color: '#fff',
    padding: '0.6rem 1.2rem',
    borderRadius: '6px',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    opacity: sending ? 0.6 : 1
  }}
>
  {sending ? "Sending..." : "Send Reply"}
</button>

        </div>
      ) : (
        <p style={{ color: 'green', marginTop: '2rem' }}>✅ Reply sent!</p>
      )}
    </div>
  );
};

export default MailView;
