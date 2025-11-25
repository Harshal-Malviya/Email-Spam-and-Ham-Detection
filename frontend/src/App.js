// App.js
import React, { useEffect, useState } from 'react';
import LoginWithGoogle from './components/LoginWithGoogle';
import ComposeMail from './components/ComposeMail';
import Inbox from './components/Inbox';
import ChatPage from './components/ChatPage';
import MailView from './components/MailView'; // ✅ make sure this file exists

import './globals.css';
import './App.css';

import pencilIcon from './assets/composepencil.png';
import envelopeIcon from './assets/inboxbro.png';
import cameraIcon from './assets/camera.png';
import arrow from './assets/arrow.png';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function MainApp() {
  const [user, setUser] = useState(null);
  const [emails, setEmails] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [activeView, setActiveView] = useState('inbox');
  const [accountList, setAccountList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleStartMeet = () => {
    window.open("https://meet.google.com/new", "_blank");
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/accounts", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        setAccountList(data.accounts || []);
        const activeEmail = data.accounts?.find(
          acc => acc.email === data.active_email
        );
        if (activeEmail) setUser(activeEmail);
      });
  }, []);

  const handleSwitchAccount = async (email) => {
    await fetch("http://localhost:5000/api/switch-account", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    window.location.reload();
  };

  const handleAddAccount = () => {
    window.location.href = "http://localhost:5000/api/login?add_account=1";
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/user", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUser(data);
      });
  }, []);

  useEffect(() => {
    if (user) {
      fetch("http://localhost:5000/api/inbox", {
        credentials: "include"
      })
        .then(res => res.json())
        .then(data => {
          if (!data.error) setEmails(data);
        });
    }
  }, [user]);

  const toggleMode = () => {
    setAnimating(true);
    const newMode = !darkMode;
    document.querySelector('.wipe-transition').classList.add('start');
    setTimeout(() => {
      setDarkMode(newMode);
      document.body.classList.toggle('dark', newMode);
      document.querySelector('.wipe-transition').classList.remove('start');
      setAnimating(false);
    }, 500);
  };

  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <div className={`wipe-transition ${animating ? 'start' : ''}`}></div>

      <button onClick={toggleMode} className="toggle-btn">
        {darkMode ? '☀️' : '🌙'}
      </button>

      {/* Account Switcher */}
      <div className="account-switcher">
        <button onClick={() => setShowDropdown(!showDropdown)} className="account-button">
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="google-icon"
            style={{
              width: "20px",
              marginRight: "8px",
              verticalAlign: "middle"
            }}
          />
          <span className="account-arrow">
            <img
              src={arrow}
              alt="Arrow icon"
              className={`arrow ${showDropdown ? 'rotate' : ''}`}
            />
          </span>
        </button>

        {showDropdown && (
          <div className="account-dropdown">
            {accountList.map((acc, idx) => (
              <div
                key={idx}
                className="account-item"
                onClick={() => handleSwitchAccount(acc.email)}
              >
                <img
                  src={
                    acc.picture
                      ? acc.picture
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=4285f4&color=fff&size=64`
                  }
                  alt={acc.name}
                  className="pill-avatar"
                />
                <div className="account-info">
                  <strong>{acc.name}</strong>
                  <span>{acc.email}</span>
                </div>
              </div>
            ))}
            <div className="account-item" onClick={handleAddAccount}>
              ➕ Add another account
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Navigation */}
      <div className="nav-bar">
        <div
          className={`pill-button ${activeView === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveView('inbox')}
        >
          <img src={envelopeIcon} alt="Inbox icon" className="mail-icon" />
          <span className="pill-label">Inbox</span>
        </div>
        <br />
        <div
          className={`pill-button ${activeView === 'compose' ? 'active' : ''}`}
          onClick={() => setActiveView('compose')}
        >
          <img src={pencilIcon} alt="Compose icon" className="pill-icon" />
          <span className="pill-label">Compose</span>
        </div>
        <br />
        <div className="pill-button" onClick={handleStartMeet}>
          <img src={cameraIcon} alt="Meet icon" className="meet-icon" />
          <span className="pill-label">Meet</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1>Bhai Mail</h1>
        {!user ? (
          <LoginWithGoogle />
        ) : (
          <>
            <div className="user-pill">
              <img
                src={user.picture}
                alt={user.name}
                className="pill-avatar"
              />
              <b>{user.email}</b>
            </div>

            {activeView === 'compose' && <ComposeMail darkMode={darkMode} />}
            {activeView === 'inbox' && <Inbox emails={emails} />}
          </>
        )}
      </div>
    </div>
  );
}

// ✅ Main App Router (no unused vars)
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/mail/:id" element={<MailView />} /> 
      </Routes>
    </Router>
  );
}

export default App;