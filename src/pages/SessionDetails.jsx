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
  
  // Isolated ready check states
  const [readyUsers, setReadyUsers] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const countdownTimerRef = useRef(null);
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

  // 2. Session Users Fetch (Updated to monitor roster joins)
  const syncSessionUsers = async () => {
    try {
      const response = await fetch(`${API}/sessions/${sessionId}/users`);
      const data = await response.json();
      
      // NEW SYSTEM TRIGGER: If a new teammate arrives, send a desktop push notification
      if (sessionUsers.length > 0 && data.length > sessionUsers.length && isLobbyHost) {
        const latestJoiner = data[data.length - 1]; // Grabs details for the incoming user
        
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("🎯 Loot Link: Teammate Acquired!", {
            body: `${latestJoiner.username} has just joined your active ${session.game_title || 'Game'} squad!`,
            icon: session.cover_image_url || "/vite.svg"
          });
        }
      }
      
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

  // 4. Isolated Ready List Status Fetch
  const syncReadyCheckList = async () => {
    try {
      const response = await fetch(`${API}/sessions/${sessionId}/ready-list`);
      if (response.ok) {
        const data = await response.json();
        const activeReadyIds = data.readyUserIds || [];
        setReadyUsers(activeReadyIds);
        
        // Auto-launch countdown if all active joined players have clicked ready
        const everyoneReady = sessionUsers.length >= 2 && sessionUsers.every(u => activeReadyIds.includes(Number(u.user_id)));
        
        if (everyoneReady && countdown === null) {
          startLobbyCountdown();
        } else if (!everyoneReady && countdown !== null) {
          clearInterval(countdownTimerRef.current);
          setCountdown(null);
        }
      }
    } catch (err) {
      console.error("Ready data mapping error:", err);
    }
  };

  // Countdown timer clock loop
  const startLobbyCountdown = () => {
    setCountdown(10);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          alert("🚀 MATCH STARTING! Game synchronization complete.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Synchronizes all background data every 3 seconds
  useEffect(() => {
    const init = async () => {
      await syncSession();
      await syncSessionUsers();
      await syncSessionMessages();
      await syncReadyCheckList();

      // NEW NOTIFICATION SYSTEM: Requests permission parameters on initial lobby load
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
    };
    init();

    const interval = setInterval(() => {
      syncSessionUsers();
      syncReadyCheckList(); 
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownTimerRef.current);
    };
  }, [sessionId, countdown, sessionUsers.length]);

  // Auto-scroll chat tracker
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

  // Toggle ready status
  const handleToggleReady = async () => {
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/ready`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) await syncReadyCheckList();
    } catch (err) {
      console.error(err);
    }
  };

  // Reset ready check status
  const handleResetReadyCheck = async () => {
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/ready-reset`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) await syncReadyCheckList();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Clicking the Join Squad Button
  const handleJoinSession = async () => {
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
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
    if (!window.confirm("Are you sure you want to close this lobby?")) return;
    try {
      const res = await fetch(`${API}/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      navigate("/sessions"); 
    } catch (err) {
      alert(err.message); 
    }
  };

  // Handle Regular Player leaving the session
  const handleLeaveSession = async () => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/leave`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      navigate("/sessions"); 
    } catch (err) {
      alert(err.message);
    }
  };

    // Handle Host updates (Updated to track matchmaking parameters)
  const handleUpdateLobbySettings = async (updatedCapacity, updatedStatus, updatedMatchmaking) => {
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          max_users: updatedCapacity !== null ? updatedCapacity : session.max_users,
          session_status: updatedStatus !== null ? updatedStatus : session.session_status,
          // Sends the boolean toggle flag to your backend server client configuration
          matchmaking_enabled: updatedMatchmaking !== null ? updatedMatchmaking : session.matchmaking_enabled
        })
      });
      if (res.ok) await syncSession(); 
    } catch (err) {
      console.error("Failed to push matchmaking status:", err);
    }
  };


  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Invite link copied!");
  };

  const currentUserId = user?.user_id ?? user?.id;
  const isUserInSession = sessionUsers.some((pUser) => Number(pUser.user_id) === Number(currentUserId));
  const isLobbyHost = Number(currentUserId) === Number(session.host_user_id);
  const isLobbyLocked = session.session_status === 'locked';
  const isCurrentPlayerReady = readyUsers.includes(Number(currentUserId));

  const hasDiscordLink = session.session_description?.includes("[DISCORD_LINK]:");
  const displayDescription = hasDiscordLink
    ? session.session_description.split("\n\n[DISCORD_LINK]:")[0]
    : session.session_description;
  let discordUrl = null;
  if (hasDiscordLink) {
    const rawUrlPart = session.session_description.split("\n\n[DISCORD_LINK]:")[1] || "";
    const urlStartIndex = rawUrlPart.indexOf("https://");
    if (urlStartIndex !== -1) {
      discordUrl = rawUrlPart.substring(urlStartIndex).trim();
    }
  }

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
          {sessionUsers.map((member) => (
            <div key={member.user_id} className="session-user-card" >
              <div className="session-user-avatar" style={{ border: '2px solid #4f7cff' }} />
              <div className="session-user-info">
                <div className="session-username">
                  {member.username}
                  {Number(member.user_id) === Number(session.host_user_id) && <span className="host-badge"> Host</span>}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span className={`ready-badge ready-badge--${readyUsers.includes(Number(member.user_id))}`}>
                    {readyUsers.includes(Number(member.user_id)) ? "READY ✅" : "NOT READY ❌"}
                  </span>
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
                </div>
              </div>
            </>
          )}
        </aside>

        <main className="session-main-panel">
          {countdown !== null && (
            <div className="countdown-banner">
              ⚠️ ALL SQUAD MEMBERS READY: LAUNCHING IN {countdown} SECONDS...
            </div>
          )}

          <div className="session-status-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span>Status:</span> 
              <strong style={{ color: isLobbyLocked ? '#ffaa00' : '#4f7cff' }}>
                {session.session_status}
              </strong>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="session-invite-button" onClick={handleCopyInvite}>
                Share Invite 🔗
              </button>

              {isUserInSession && (
                <button 
                  className={`session-ready-button ${isCurrentPlayerReady ? 'session-ready-button--unready' : ''}`}
                  onClick={handleToggleReady}
                >
                  {isCurrentPlayerReady ? "Unready ❌" : "Ready Up! 👍"}
                </button>
              )}

              {isLobbyHost && (
                <button className="session-invite-button" style={{ background: '#3a3a3a' }} onClick={handleResetReadyCheck}>
                  Reset Ready 🔄
                </button>
              )}

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
                  {[2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} Players</option>
                  ))}
                </select>
              </div>
              <div className="host-settings__group">
                <span className="host-settings__label">Lobby Lock:</span>
                <button 
                  type="button" 
                  className={`host-settings__lock-btn ${isLobbyLocked ? 'host-settings__lock-btn--locked' : ''}`} 
                  onClick={() => handleUpdateLobbySettings(null, isLobbyLocked ? 'active' : 'locked')}
                >
                  {isLobbyLocked ? 'Unlock Lobby 🔓' : 'Lock Lobby 🔒'}
                </button>
              </div>
              {/* NEW MATCHMAKING TOGGLE SWITCH ACTION */}
              <div className="host-settings__group">
              <span className="host-settings__label">Public Queue:</span>
              <button 
                type="button" 
                className={`host-settings__toggle-btn ${session.matchmaking_enabled ? 'host-settings__toggle-btn--active' : ''}`} 
                onClick={() => handleUpdateLobbySettings(null, null, !session.matchmaking_enabled)}
              >
                {session.matchmaking_enabled ? 'SEARCHING ⚡' : 'Queue Off 💤'}
              </button>
            </div>
            </div>
          )}

          {(isUserInSession || isLobbyHost) ? (
            <>
              {discordUrl && (
                <div className="discord-widget">
                  <div className="discord-widget__text-group">
                    <span className="discord-widget__label">Discord Comms Engaged</span>
                    <span className="discord-widget__description">A secure Discord voice room is ready for your party.</span>
                  </div>
                  <button className="discord-widget__button" onClick={() => window.open(discordUrl, '_blank')}>
                    Join Voice Lobby 🎧
                  </button>
                </div>
              )}

              <div className="session-chat-container">
                <div className="session-chat-messages">
                  {user && sessionMessages.map((msg) => (
                    <div key={msg.session_message_id} className={`chat-message ${Number(msg.user_id) === Number(currentUserId) ? "own-message" : ""}`}>
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
                  <input 
                    type="text" 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === "Enter") { handleSendMessage(); } }} 
                    placeholder="Type a message..." 
                  />
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
