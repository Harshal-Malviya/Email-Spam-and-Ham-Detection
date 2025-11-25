import React from 'react';
import './styles.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h1 className="sidebar-title">Gmail</h1>
      <ul className="menu">
        <li>📥 Inbox</li>
        <li>📤 Sent</li>
        <li>📝 Drafts</li>
        <li>🏷️ Promotions</li>
      </ul>
    </div>
  );
};

export default Sidebar;
