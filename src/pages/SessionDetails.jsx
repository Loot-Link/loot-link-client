import { useEffect, useState, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import "./sessiondetails.css";

const API = "http://localhost:3000/api";

export default function SessionDetails() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [session, setSession] = useState({});
  const [sessionUsers, setSessionUsers] = useState([]);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  const chatEndRef = useRef(null);

  // 1. Session Data Fetch
  const syncSession = async () => {
    try {
      const response = await fetch(`${API}/sessions/${sessionId}`);
      const data = await response.json();
      setSession(data);
    } catch (err) {
      console.error("Failed to sync session:", err);
    }
  };

  // 2. Session Users Fetch
  const syncSessionUsers = async () => {
    try {
      const response = await fetch(`${API}/sessions/${sessionId}/users`);
      const data = await response.json();
      setSessionUsers(data);
    } catch (err) {
      console.error("Failed to sync users:", err);
    }
  };

  // 3. Session Messages Fetch
  const syncSessionMessages = async () => {
    try {
      const response = await fetch(`${API}/session-messages/${sessionId}`);
      if (!response.ok) throw Error("Failed to fetch messages");
      const data = await response.json();
      setSessionMessages(data);
    } catch (err) {
      console.error("Message sync error:", err);
    }
  };

  // Initial Sync on Mount
  useEffect(() => {
    const init = async () => {
      await syncSession();
      await syncSessionUsers();
      await syncSessionMessages();
    };
    init();
  }, [sessionId]);

  // Auto-scroll watcher logic trigger
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessionMessages]);

  // Handle Sending Message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const response = await fetch(`${API}/session-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          message_text: newMessage
        })
      });
      if (response.ok) {
        setNewMessage("");
        await syncSessionMessages();
      }
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  // Handle Clicking the Join Squad Button
  const handleJoinSession = async () => {
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to join squad");
      }

      alert("Welcome to the squad! Live text and audio channels are now online.");
      await syncSessionUsers(); 
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Closing/Deleting Session
  const handleDeleteSession = async () => {
    if (!window.confirm("Are you sure you want to permanently close and delete this lobby?")) return;

    try {
      const res = await fetch(`${API}/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to delete session");
      }

      alert("Session successfully closed.");
      navigate("/sessions"); 
    } catch (err) {
      alert(err.message); 
    }
  };

  // Handle Regular Player leaving the session
  const handleLeaveSession = async () => {
    if (!window.confirm("Are you sure you want to leave this lobby?")) return;

    try {
      const res = await fetch(`${API}/sessions/${sessionId}/leave`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to leave session");
      }

      alert("You have left the session.");
      navigate("/sessions"); 
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Host pushing dynamic settings changes
  const handleUpdateLobbySettings = async (updatedCapacity, updatedStatus) => {
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          max_users: updatedCapacity !== null ? updatedCapacity : session.max_users,
          session_status: updatedStatus !== null ? updatedStatus : session.session_status
        })
      });

      if (res.ok) {
        await syncSession(); 
      } else {
        const txt = await res.text();
        alert(txt);
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
    }
  };

  // Clipboard Invitation Handler
  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Lobby invite link copied to clipboard! Share it with your squad.");
  };

  const currentUserId = user?.user_id ?? user?.id;
  const isUserInSession = sessionUsers.some((pUser) => Number(pUser.user_id) === Number(currentUserId));
  const isLobbyHost = Number(currentUserId) === Number(session.host_user_id);
  const isLobbyLocked = session.session_status === 'locked';

  // Discord Link Parser - FIXED: Added absolute [1] array slice to grab url string data uniquely
  const hasDiscordLink = session.session_description?.includes("[DISCORD_LINK]:");
  const displayDescription = hasDiscordLink 
    ? session.session_description.split("\n\n[DISCORD_LINK]:")[0]
    : session.session_description;
  const discordUrl = hasDiscordLink 
    ? session.session_description.split("\n\n[DISCORD_LINK]:")[1]
    : null;

  return (
    <div className="session-details-page">
      <div className="session-hero">
        <img className="session-hero-image" src={session.cover_image_url} alt={session.game_title} />
        <div className="session-hero-overlay">
          <h1 className="session-title"> {session.session_title} </h1>
          <h2 className="session-game-title"> {session.game_title} </h2>
          <p className="session-description"> {displayDescription} </p> 
        </div>
      </div>
      <div className="session-content">
        <aside className="session-users-panel">
          
          <h3 className="session-users-heading"> 🛡️ Joined Players ({sessionUsers.length}/{session.max_users}) </h3>
          {sessionUsers.map((user) => (
            <div key={user.user_id} className="session-user-card" >
              <div className="session-user-avatar" style={{ border: '2px solid #4f7cff' }} />
              <div className="session-user-info">
                <div className="session-username">
                  {user.username}
                  {Number(user.user_id) === Number(session.host_user_id) && <span className="host-badge"> Host</span>}
                </div>
                <div className="session-user-status" style={{ color: '#4f7cff', fontWeight: 'bold' }}>
                  Active Member
                </div>
              </div>
            </div>
          ))}

          {!isUserInSession && !isLobbyHost && (
            <>
              <h3 className="session-users-heading" style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}> 
                👁️ Spectators <span className="viewer-count-badge">You</span>
              </h3>
              <div className="session-user-card" style={{ opacity: 0.6 }}>
                <div className="session-user-avatar" style={{ background: '#707070' }} />
                <div className="session-user-info">
                  <div className="session-username">{user?.username || "Guest Viewer"}</div>
                  <div className="session-user-status">Just Browsing</div>
                </div>
              </div>
            </>
          )}
        </aside>

        <main className="session-main-panel">
          <div className="session-status-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span>Status:</span> 
              <strong style={{ color: session.session_status === 'locked' ? '#ffaa00' : '#4f7cff' }}>
                {session.session_status}
              </strong>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="session-invite-button" onClick={handleCopyInvite}>
                Share Invite 🔗
              </button>

              {isLobbyHost ? (
                <button className="session-delete-button" onClick={handleDeleteSession}>
                  Close Session 🚫
                </button>
              ) : isUserInSession ? (
                <button className="session-leave-button" onClick={handleLeaveSession}>
                  Leave Session 🚪
                </button>
              ) : (
                <button 
                  className="session-join-button" 
                  onClick={handleJoinSession}
                  disabled={isLobbyLocked || sessionUsers.length >= session.max_users}
                  style={{ 
                    opacity: (isLobbyLocked || sessionUsers.length >= session.max_users) ? 0.4 : 1,
                    cursor: (isLobbyLocked || sessionUsers.length >= session.max_users) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLobbyLocked ? "Lobby Locked 🔒" : sessionUsers.length >= session.max_users ? "Squad Full 🚫" : "Join Squad +"}
                </button>
              )}
            </div>
          </div>

          {isLobbyHost && (
            <div className="host-settings-bar">
              <div className="host-settings__group">
                <span className="host-settings__label">Player Limit:</span>
                <select 
                  className="host-settings__select" 
                  value={session.max_users || 4} 
                  onChange={(e) => handleUpdateLobbySettings(Number(e.target.value), null)}
                >
                  {[2, 3, 4, 5, 6, 7, 8, 10, 12].map(num => (
                    <option key={num} value={num}>{num} Players</option>
                  ))}
                </select>
              </div>

              <div className="host-settings__group">
                <span className="host-settings__label">Lobby Lock:</span>
                <button 
                  type="button"
                  className={`host-settings__lock-btn ${session.session_status === 'locked' ? 'host-settings__lock-btn--locked' : ''}`}
                  onClick={() => handleUpdateLobbySettings(null, session.session_status === 'locked' ? 'active' : 'locked')}
                >
                  {session.session_status === 'locked' ? 'Unlock Lobby 🔓' : 'Lock Lobby 🔒'}
                </button>
              </div>
            </div>
          )}

          {isUserInSession || isLobbyHost ? (
            <>
              {discordUrl && (
                <div className="discord-widget">
                  <div className="discord-widget__text-group">
                    <span className="discord-widget__label">Discord Comms Engaged</span>
                    <span className="discord-widget__description">A secure Discord voice room is ready for your party.</span>
                  </div>
                  <button 
                    className="discord-widget__button"
                    onClick={() => window.open(discordUrl, '_blank')}
                  >
                    Join Voice Lobby 🎧
                  </button>
                </div>
              )}

              <div className="session-chat-container">
                <div className="session-chat-messages">
                  {user && sessionMessages.map((msg) => (
                    <div key={msg.session_message_id} className={`chat-message ${Number(msg.user_id) === Number(currentUserId) ? "own-message" : ""}`} >
                      <div className="chat-message-avatar" />
                      <div className="chat-message-content">
                        <div className="chat-message-header">
                          <span className="chat-username">{msg.username}</span>
                          <span className="chat-time"> {new Date(msg.created_at).toLocaleTimeString()} </span>
                        </div>
                        <div className="chat-message-text">{msg.message_text}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="session-chat-input">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { handleSendMessage(); } }} placeholder="Type a message..." />
                  <button onClick={handleSendMessage}>Send</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', marginTop: '20px' }}>
              <h3 style={{ color: '#fff', marginBottom: '10px' }}>🔒 Room Comms Restrained</h3>
              <p style={{ color: '#8fa0dd', fontSize: '0.95rem', maxWidth: '440px', margin: '0 auto 20px' }}>
                You are currently spectating. Click the blue <strong>"Join Squad +"</strong> button above to gain access to live text messages and the Discord audio channel!
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
