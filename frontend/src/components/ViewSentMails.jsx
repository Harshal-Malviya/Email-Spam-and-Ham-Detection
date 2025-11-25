// src/components/ViewSentMails.jsx
import React, { useEffect, useState } from 'react';
import './ViewSentMails.css'; // Ensure this CSS file is created and linked

const ViewSentMails = ({ mailId, onBackToCompose }) => {
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mailId) {
      setError("No email ID provided.");
      setLoading(false);
      return;
    }

    const fetchEmailContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:5000/api/email/${mailId}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Ensure all expected fields are present, provide fallbacks
        setEmail({
          id: data.id || mailId,
          subject: data.subject || '(No Subject)',
          sender: data.sender || 'Unknown Sender',
          to: data.to || 'Unknown Recipient',
          date: data.date || 'No Date',
          body: data.body || '(No content found)',
          attachments: data.attachments || []
        });
      } catch (e) {
        console.error("Failed to fetch email content:", e);
        setError("Failed to load email content. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmailContent();
  }, [mailId]); // Re-fetch when mailId changes

  if (loading) {
    return (
      <div className="mail-view-container loading-state">
        <div className="spinner"></div>
        <p>Loading email content...</p>
      </div>
    );
  }

  if (error) {
    return <div className="mail-view-container error-message">{error}</div>;
  }

  if (!email) {
    return <div className="mail-view-container">Email not found or could not be loaded.</div>;
  }

  return (
    <div className="mail-view-container">
      {/* Header with back button and subject */}
      <div className="mail-view-header">
        <button onClick={onBackToCompose} className="back-button">
          &larr; Back to Compose
        </button>
        <h2 className="mail-subject">{email.subject}</h2> {/* Display subject */}
      </div>

      {/* Sender and Recipient Details */}
      <div className="mail-info-card">
        <div className="info-item">
          <span className="info-label">From:</span>
          <span className="info-value">{email.sender}</span>
        </div>
        <div className="info-item">
          <span className="info-label">To:</span>
          <span className="info-value">{email.to}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Date:</span>
          <span className="info-value">{email.date}</span>
        </div>
      </div>

      {/* Email Body */}
      <div className="mail-body-content">
        {/* Use dangerouslySetInnerHTML for HTML content, ensure it's sanitized if from external sources */}
        <div dangerouslySetInnerHTML={{ __html: email.body }}></div>
      </div>

      {/* Attachments Section */}
      {email.attachments && email.attachments.length > 0 && (
        <div className="mail-attachments-section">
          <h3>Attachments ({email.attachments.length})</h3>
          <ul className="attachment-list">
            {email.attachments.map((attachment, index) => (
              <li key={index} className="attachment-item">
                <a
                  href={`data:${attachment.mimeType};base64,${attachment.data}`}
                  download={attachment.filename}
                  className="attachment-link"
                >
                  <i className="material-icons attachment-icon">attach_file</i>
                  <span className="attachment-filename">{attachment.filename}</span>
                  <span className="attachment-size">
                    ({Math.round(attachment.data.length * 0.75 / 1024)} KB)
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ViewSentMails;