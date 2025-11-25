import React from 'react';
import ComposeMail from './ComposeMail';
import SentRecipients from './SentRecipients';

const ComposeWrapper = () => {
  const recentRecipients = [
    { name: 'Rahul Sharma', avatar: 'https://i.pravatar.cc/100?img=1' },
    { name: 'Neha Kapoor', avatar: 'https://i.pravatar.cc/100?img=2' },
    { name: 'arjun@example.com', avatar: 'https://i.pravatar.cc/100?img=3' },
  ];

  return (
    <div className="compose-with-sent-panel">
      <SentRecipients recipients={recentRecipients} />
      <ComposeMail />
    </div>
  );
};

export default ComposeWrapper;
