// src/components/SentRecipients.jsx
import React from 'react';
import './ComposeMail.css'; // Keep this import if other parts of your app rely on its styles

const SentRecipients = ({ recipients }) => {
  // Returning null means this component will not render any UI.
  // This effectively removes the duplicate "Recent" panel it was previously creating.
  return null;
};

export default SentRecipients;