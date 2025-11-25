import React from 'react';
import { motion } from 'framer-motion';
import './RecentEmails.css'; // New CSS file for RecentEmails

const RecentEmails = ({ sentEmails }) => {
  return (
    <motion.div
      className="recent-emails-container"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h3>Recent Sent Emails</h3>
      <div className="recent-emails-list">
        {sentEmails.length === 0 ? (
          <p className="no-emails-message">No recent sent emails.</p>
        ) : (
          sentEmails.slice(-10).reverse().map((email, index) => ( // Show last 10, newest first
            <motion.div
              key={index}
              className="recent-email-item"
              whileHover={{ scale: 1.02, backgroundColor: '#e8f0fe' }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.1 }}
            >
              <h4 className="email-subject">{email.subject || 'No Subject'}</h4>
              <p className="email-to">To: {email.to}</p>
              <small className="email-timestamp">{new Date(email.timestamp).toLocaleString()}</small>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default RecentEmails;