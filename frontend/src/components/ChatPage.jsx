import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import './ChatPage.css';
import uploadIcon from '../assets/upload-icon.png';
import cameraIcon from '../assets/camera.png';
import driveIcon from '../assets/drive-icon.png';

// Helper component to find and create links in text
const Linkify = ({ text }) => {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, index) =>
        urlRegex.test(part) ? (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </>
  );
};

const ChatPage = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const rawEmailParam = params.email || queryParams.get('email');
  const senderEmail = rawEmailParam ? decodeURIComponent(rawEmailParam) : 'unknown@example.com';
  const senderName = queryParams.get('name') || 'Chat User';

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentUrl, setAttachmentUrl] = useState(null);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [darkMode, setDarkMode] = useState(() => document.body.classList.contains('dark'));
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  const chatBodyRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // --- NEW: State for Google Drive authentication ---
  const [googleAccessToken, setGoogleAccessToken] = useState(null);
  const [googleTokenClient, setGoogleTokenClient] = useState(null);
  const [googlePickerApiLoaded, setGooglePickerApiLoaded] = useState(false);
  // --- END NEW ---

  // --- CONSTANTS for Google API ---
  const YOUR_CLIENT_ID = '962192530726-bnmbeihm91a2da3j2rehmbq1087b0b0t.apps.googleusercontent.com';
  const YOUR_API_KEY = 'AIzaSyBNPfxurvc19Zfgfaq01ZQ26h5W9mPWlFM';
  const SCOPES = 'https://www.googleapis.com/auth/drive.file';
  // --- END CONSTANTS ---

  useEffect(() => {
    // Load Google Picker API script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('picker', () => {
        setGooglePickerApiLoaded(true);
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  // --- NEW: Initialize Google Identity Services Client ---
  useEffect(() => {
    // This hook initializes the Google Auth client when the component mounts.
    // It is configured with a callback that receives the access token.
    if (window.google && window.google.accounts) {
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: YOUR_CLIENT_ID,
            scope: SCOPES,
            callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    setGoogleAccessToken(tokenResponse.access_token);
                    // After getting the token, create the picker
                    createPicker(tokenResponse.access_token);
                } else {
                    console.error("Failed to get access token from Google.");
                    setError("Authorization failed. Could not get access token.");
                }
            },
            error_callback: (error) => {
                console.error("Google Sign-In Error:", error);
                setError("Google Sign-In failed. Please check the console for details.");
            },
        });
        setGoogleTokenClient(client);
    } else {
        console.warn("Google Identity Services script not loaded yet.");
    }
  }, []);
  // --- END NEW ---

  // --- UPDATED: Function to create the picker ---
  const createPicker = (token) => {
    if (!googlePickerApiLoaded) {
      setError("Google Picker API is not ready yet. Please try again.");
      return;
    }
    
    const pickerCallback = (data) => {
        if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs[0];
            const url = doc.url;
            const name = doc.name;
            // Append file name and URL to the message input
            setNewMessage(prev => `${prev}${prev ? ' ' : ''}${name}\n${url}`);
        }
    };

    const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
    view.setMimeTypes("image/png,image/jpeg,image/jpg,application/pdf,application/vnd.google-apps.document");

    const picker = new window.google.picker.PickerBuilder()
        .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
        .setOAuthToken(token)
        .setDeveloperKey(YOUR_API_KEY)
        .addView(view)
        .setCallback(pickerCallback)
        .build();
    picker.setVisible(true);
  };
  // --- END UPDATED ---

  // --- NEW: Handler for the Drive button click ---
  const handleDriveClick = () => {
    if (googleAccessToken) {
        // If we already have a token, use it to create the picker immediately.
        createPicker(googleAccessToken);
    } else if (googleTokenClient) {
        // If we don't have a token, request one. 
        // The callback defined in useEffect will handle creating the picker.
        googleTokenClient.requestAccessToken();
    } else {
        setError("Google Auth client is not ready. Please try again in a moment.");
    }
  };
  // --- END NEW ---

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (!menuOpen) {
      const timer = setTimeout(() => setActiveSubMenu(null), 300);
      return () => clearTimeout(timer);
    }
  }, [menuOpen]);

  const handleThemeChange = (theme) => {
    setDarkMode(theme === 'dark');
    setMenuOpen(false);
  };

  const handleWallpaperChange = (wallpaperType) => {
    console.log(`Wallpaper changed to: ${wallpaperType}`);
    setMenuOpen(false);
  };

  const formatTimestampToIST = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) return 'Invalid time';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid time';
    return date.toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata'
    });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      setLoadingMessages(true);
      setError('');
      try {
        const response = await fetch(`http://localhost:5000/api/chat-messages?email=${encodeURIComponent(senderEmail)}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const fetchedChatMessages = data.messages.map((msg, index) => ({
          id: msg.id || `msg-${index}`,
          text: msg.body,
          sender: msg.from === 'you' ? 'self' : 'other',
          timestamp: msg.internalDate,
          attachment: msg.attachment_url ? {
            name: msg.attachment_filename,
            url: msg.attachment_url,
            type: msg.message_type
          } : null,
          reactions: msg.reactions || {}
        }));
        fetchedChatMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(fetchedChatMessages);
      } catch (err) {
        console.error('Error fetching messages:', err.message);
        setError(`Failed to load messages: ${err.message}.`);
      } finally {
        setLoadingMessages(false);
        scrollToBottom();
      }
    };
    fetchMessages();
  }, [senderEmail]);

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (chatBodyRef.current) {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    });
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !attachment && !audioBlob) || sending) return;
    setSending(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('to', senderEmail);
      if (newMessage.trim()) formData.append('text', newMessage.trim());

      let messageType = 'text';
      let file = null;

      if (attachment) {
        formData.append('attachment', attachment, attachment.name);
        messageType = attachment.type.startsWith('image/') ? 'image' : attachment.type.startsWith('audio/') ? 'audio' : 'file';
        file = attachment;
      } else if (audioBlob) {
        const audioFile = new File([audioBlob], `voice_message_${Date.now()}.webm`, { type: 'audio/webm' });
        formData.append('attachment', audioFile, audioFile.name);
        messageType = 'audio';
        file = audioFile;
      }

      const response = await fetch('http://localhost:5000/api/send-message', {
        method: 'POST', body: formData, credentials: 'include',
      });
      if (!response.ok) throw new Error((await response.json()).error || `HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to send message');

      setMessages(prevMessages => [...prevMessages, {
        id: data.messageId, text: newMessage.trim() || '', sender: 'self',
        timestamp: data.message.internalDate,
        attachment: (attachment || audioBlob) ? {
          name: file ? file.name : 'Attached File',
          url: data.message.attachment_url,
          type: messageType
        } : null,
        reactions: {}
      }]);

      setNewMessage('');
      setAttachment(null);
      setAttachmentUrl(null);
      setAudioBlob(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      console.error('Error sending message:', err);
      setError(`Failed to send message: ${err.message}.`);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const handleReaction = async (messageId, reaction) => {
    setSelectedMessageId(null);
    try {
        const response = await fetch('http://localhost:5000/api/react-to-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId, reaction }),
            credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Failed to add reaction.');
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, reactions: data.reactions } : msg));
    } catch (err) {
        console.error('Error sending reaction:', err);
        setError(`Failed to save reaction: ${err.message}.`);
    }
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      setAttachmentUrl(URL.createObjectURL(file));
      setNewMessage('');
      setAudioBlob(null);
    }
  };

  const startRecording = async () => {
    if (audioBlob) setAudioBlob(null);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const newAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(newAudioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setRecording(true);
      setNewMessage('');
      setAttachment(null);
      setAttachmentUrl(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };
const getFileIcon = (filename) => {
  const ext = filename?.split('.').pop().toLowerCase();

  switch (ext) {
    case 'pdf':
      return 'picture_as_pdf';
    case 'mp4':
    case 'mov':
    case 'webm':
      return 'movie';
    case 'mp3':
    case 'wav':
    case 'ogg':
      return 'audiotrack';
    case 'doc':
    case 'docx':
      return 'description';
    case 'ppt':
    case 'pptx':
      return 'slideshow';
    case 'xls':
    case 'xlsx':
      return 'table_chart';
    case 'zip':
    case 'rar':
      return 'folder_zip';
    default:
      return 'insert_drive_file';
  }
};

const renderAttachment = (attachmentData) => {
  if (!attachmentData || !attachmentData.url) return null;

  const type = attachmentData.type;
  const url = attachmentData.url;
  const name = attachmentData.name || 'Attachment';

  if (type === 'image') {
    return <img src={url} alt={name} className="chat-attachment-image" />;
  }

  if (type === 'audio') {
    return <audio controls src={url} className="chat-attachment-audio" />;
  }

  if (type === 'video') {
    return (
      <video controls className="chat-attachment-video">
        <source src={url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }

  if (type === 'pdf' || name.endsWith('.pdf')) {
    return (
      <embed src={url} type="application/pdf" className="chat-attachment-pdf" />
    );
  }

  // fallback for anything else (docs, zip, etc.)
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="chat-attachment-file">
      <span className="material-symbols">insert_drive_file</span>
      {name}
    </a>
  );
};


  return (
    <div className="chat-page">
      <header className="chat-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <span className="material-symbols">arrow_back</span>
        </button>
        <h2>{senderName}</h2>
        {/* --- UPDATED: Use the new handler for the Drive button --- */}
        <button className="header-icon-button" onClick={handleDriveClick}>
          <img src={driveIcon} alt="Drive" className="drive-icon" />
        </button>

        <button
          className="header-icon-button"
          onClick={() => window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer')}
        >
           <img src={cameraIcon} alt="Meet icon" className="meet-icon" />
        </button>

        <div className="theme-menu-container">
          <label className="theme-menu-wrapper">
            <input
              type="checkbox"
              className="theme-menu-input"
              checked={menuOpen}
              onChange={() => setMenuOpen(!menuOpen)}
            />
            <div className="bar">
              <span className="top bar-list" />
              <span className="middle bar-list" />
              <span className="bottom bar-list" />
            </div>
          </label>
          {menuOpen && (
            <section className="menu-dropdown">
              {/* Menu structure remains the same */}
              {!activeSubMenu && (
                <div className="menu-view">
                  <div className="menu-list" onClick={() => setActiveSubMenu('theme')}>Theme <span className="submenu-arrow">›</span></div>
                  <div className="menu-list" onClick={() => console.log('Select Messages Clicked')}>Select Messages</div>
                </div>
              )}
              {activeSubMenu === 'theme' && (
                <div className="menu-view">
                  <div className="menu-list submenu-header" onClick={() => setActiveSubMenu(null)}><span className="back-arrow">‹</span> Theme</div>
                  <div className="menu-list" onClick={() => setActiveSubMenu('appearance')}>Appearance <span className="submenu-arrow">›</span></div>
                  <div className="menu-list" onClick={() => setActiveSubMenu('wallpaper')}>Wallpaper <span className="submenu-arrow">›</span></div>
                </div>
              )}
              {activeSubMenu === 'appearance' && (
                <div className="menu-view">
                  <div className="menu-list submenu-header" onClick={() => setActiveSubMenu('theme')}><span className="back-arrow">‹</span> Appearance</div>
                  <div className="menu-list" onClick={() => handleThemeChange('dark')}>Dark</div>
                  <div className="menu-list" onClick={() => handleThemeChange('light')}>Light</div>
                </div>
              )}
              {activeSubMenu === 'wallpaper' && (
                <div className="menu-view">
                  <div className="menu-list submenu-header" onClick={() => setActiveSubMenu('theme')}><span className="back-arrow">‹</span> Wallpaper</div>
                  <div className="menu-list" onClick={() => handleWallpaperChange('Default')}>Default</div>
                  <div className="menu-list" onClick={() => handleWallpaperChange('Custom')}>Custom</div>
                </div>
              )}
            </section>
          )}
        </div>
      </header>

      <main className="chat-body" ref={chatBodyRef}>
        {error && <div className="error-message">{error}</div>}
        {loadingMessages ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--md-sys-color-outline)' }}>No messages found.</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.sender}`}>
              <div
                className="chat-message-content"
                onClick={() => setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id)}
              >
                {msg.text && <p><Linkify text={msg.text} /></p>}
                {msg.attachment && renderAttachment(msg.attachment)}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="message-reactions">
                      {Object.entries(Object.values(msg.reactions).reduce((acc, emoji) => {
                          acc[emoji] = (acc[emoji] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([emoji, count]) => (
                        <div key={emoji} className="reaction-chip">
                          {emoji} {count > 1 && <span className="reaction-count">{count}</span>}
                        </div>
                      ))}
                    </div>
                )}
                <span className="timestamp">{formatTimestampToIST(msg.timestamp)}</span>
                {selectedMessageId === msg.id && (
                  <>
                    <style>{`.floating-reaction-bar{position:absolute;top:-36px;display:flex;gap:.4rem;padding:6px 10px;border-radius:9999px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);background-color:rgba(255,255,255,.6);box-shadow:0 4px 10px rgba(0,0,0,.1);border:1px solid rgba(0,0,0,.05);opacity:0;animation:fadeSlideIn .2s ease-out forwards;z-index:20}.chat-message.self .floating-reaction-bar{right:0}.chat-message.other .floating-reaction-bar{left:0}.dark .floating-reaction-bar{background-color:rgba(85,83,83,.26);border:1px solid rgba(255,255,255,.12)}@keyframes fadeSlideIn{from{transform:translateY(-5px) scale(.8);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}.floating-reaction-bar button{background:0 0;border:none;font-size:1.2rem;cursor:pointer;transition:transform .2s ease}.floating-reaction-bar button:hover{transform:scale(1.3)}`}</style>
                    <div className="floating-reaction-bar">
                      <button onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, '❤️'); }}>❤️</button>
                      <button onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, '👍'); }}>👍</button>
                      <button onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, '👏'); }}>👏</button>
                      <button onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, '🎉'); }}>🎉</button>
                      <button onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, '✨'); }}>✨</button>
                      <button onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, '🙂'); }}>🙂</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="chat-message self sending-animation">
            <div className="chat-message-content sending-bubble"><div className="google-typing-dots"><span /><span /><span /></div></div>
          </div>
        )}
      </main>

      <div className="chat-input-area">
        {(attachment || audioBlob) && (
          <div className="attachment-preview">
            <span>Attached: {attachment ? attachment.name : `Voice Message (${(audioBlob?.size / 1024).toFixed(1)} KB)`}</span>
            <button onClick={() => { setAttachment(null); setAttachmentUrl(null); setAudioBlob(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="remove-attachment-btn material-symbols">close</button>
          </div>
        )}
        <div className="chat-input-wrapper">
          <label className="attachment-button" onClick={() => fileInputRef.current?.click()}>
            <img src={uploadIcon} alt="Upload" style={{ width: '34px', height: '24px', cursor: 'pointer' }} />
          </label>
<input
  type="file"
  ref={fileInputRef}
  style={{ display: 'none' }}
  onChange={handleAttachmentChange}
/>


<button onClick={() => fileInputRef.current.click()}>
</button>

          <input
            type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            placeholder={recording ? "Recording voice message..." : "Type a message..."}
            className="material-input"
            disabled={sending || recording || attachment || audioBlob}
          />
          <button onClick={recording ? stopRecording : startRecording} disabled={sending} className="voice-button">
            <span className="material-symbols">{recording ? 'stop' : 'mic'}</span>
          </button>
        </div>
        <button onClick={handleSendMessage} disabled={sending || (!newMessage.trim() && !attachment && !audioBlob)} className="send-button">
          <span className="material-symbols">send</span>
        </button>
      </div>
    </div>
  );
};

export default ChatPage;