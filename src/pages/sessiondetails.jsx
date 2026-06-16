import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import SessionReviewModal from "./Reviews/session-reviews";
import "./sessiondetails.css";
import bootIcon from "../assets/boot.png";

const API = import.meta.env.VITE_API;

export default function SessionDetails() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [session, setSession] = useState({});
  const [sessionUsers, setSessionUsers] = useState([]);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [readyUsers, setReadyUsers] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const countdownTimerRef = useRef(null);
  const chatEndRef = useRef(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserID, setSelectedUserID] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [addUserError, setAddUserError] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [userSessionReview, setUserSessionReview] = useState(null);
  const syncSetAllUsers = async () => {
    try {
    const response = await fetch(`${API}/api/users/dropdown`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    const data = await response.json();
      setAllUsers(data);
    } catch (err) {
      console.error("Failed to fetch users for dropdown", err);
    }
  };

  const loadUserSessionReview = useCallback(async () => {
    if (!token || !sessionId) {
      setUserSessionReview(null);
      return;
    }

    try {
      const res = await fetch(`${API}/api/session-reviews/${sessionId}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setUserSessionReview(null);
        return;
      }

      const data = await res.json();
      setUserSessionReview(data || null);
    } catch (err) {
      console.error("Failed to load user session review:", err);
      setUserSessionReview(null);
    }
  }, [sessionId, token]);

  // 1. Session Data Fetch
  const syncSession = async () => {
    try {
      const response = await fetch(`${API}/api/sessions/${sessionId}`);
      const data = await response.json();
      setSession(data);
    } catch (err) {
      console.error("Failed to sync session:", err);
    }
  };

  // 2. Session Users Fetch (With original automatic desktop notification watcher)
  const syncSessionUsers = async () => {
    try {
      const response = await fetch(`${API}/api/sessions/${sessionId}/users`);
      const data = await response.json();
      
      const currentUserId = user?.user_id ?? user?.id;
      const isLobbyHost = Number(currentUserId) === Number(session.host_user_id);

      if (sessionUsers.length > 0 && data.length > sessionUsers.length && isLobbyHost) {
        const latestJoiner = data[data.length - 1];
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
      const response = await fetch(`${API}/api/session-messages/${sessionId}`);
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
      const response = await fetch(`${API}/api/sessions/${sessionId}/ready-list`);
      if (response.ok) {
        const data = await response.json();
        const activeReadyIds = data.readyUserIds || [];
        setReadyUsers(activeReadyIds);
        
        const everyoneReady = data.length > 0 && sessionUsers.length >= 2 && sessionUsers.every(u => activeReadyIds.includes(Number(u.user_id)));
        
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

  // Countdown timer clock routine
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

  // Synchronizes background interval engines smoothly
  useEffect(() => {
    const init = async () => {
      await syncSession();
      await syncSessionUsers();
      await syncSessionMessages();
      await syncReadyCheckList();
      await syncSetAllUsers();
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
    };
    init();

    const interval = setInterval(() => {
      syncSessionUsers();
      syncReadyCheckList();
      syncSessionMessages();
      syncSession();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownTimerRef.current);
    };
  // }, [sessionId, countdown, sessionUsers.length]);
  }, [sessionId]);


  useEffect(() => {
    if (!sessionId) return;
    const timer = setTimeout(() => {
      void loadUserSessionReview();
    }, 0);
    return () => clearTimeout(timer);
  }, [sessionId, loadUserSessionReview]);

  // Chat auto-scroll tracker - watches length to avoid scroll locking bugs
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessionMessages.length]);

  // Handle Sending Message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const response = await fetch(`${API}/api/session-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: sessionId, message_text: newMessage })
      });
      if (response.ok) {
        setNewMessage("");
        await syncSessionMessages();
      }
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  // Toggle ready check positions
  const handleToggleReady = async () => {
    try {
      const res = await fetch(`${API}/api/sessions/${sessionId}/ready`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) await syncReadyCheckList();
    } catch (err) {
      console.error(err);
    }
  };

  // Force reset ready checks
  const handleResetReadyCheck = async () => {
    try {
      const res = await fetch(`${API}/api/sessions/${sessionId}/ready-reset`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) await syncReadyCheckList();
    } catch (err) {
      console.error(err);
    }
  };

  // COWORKER UPGRADE: Handle Add User to Session manual injection
  const handleAddUserToSession = async () => {
    if (!selectedUserID) return;
    try {
      const response = await fetch(`${API}/api/sessions/${sessionId}/addUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: selectedUserID })
      });
      if (response.ok) {
        await syncSessionUsers();
        setAddUserError("");
        setUserSearch("");
        setSelectedUserID("");
      } else {
        const errorText = await response.text();
        setAddUserError(errorText);
      }
    } catch (err) {
      console.error(err);
      setAddUserError(err.message);
    }
  };

  //EMJ handle boot user from session
  const handleKickUser = async (targetUserId) => {
    if (!window.confirm("Kick this player?")) return;
    try {
      const res = await fetch(`${API}/api/sessions/${sessionId}/kick/${targetUserId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      await syncSessionUsers();
    } catch (err) {
      alert(err.message);
    }
  };


  // Handle Joining the session manually
  const handleJoinSession = async () => {
    try {
      const res = await fetch(`${API}/api/sessions/${sessionId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text() || "Failed to join squad");
      alert("Welcome to the squad! Live text and audio channels are now online.");
      await syncSessionUsers(); 
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Deleting Session
  const handleDeleteSession = async () => {
    if (!window.confirm("Are you sure you want to close this lobby?")) return;
    try {
      const res = await fetch(`${API}/api/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      navigate("/sessions"); 
    } catch (err) {
      alert(err.message); 
    }
  };

  // Handle Player leaving the session
  const handleLeaveSession = async () => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API}/api/sessions/${sessionId}/leave`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      navigate("/sessions"); 
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Host settings changes (With active matchmaking pipeline hooks)
  const handleUpdateLobbySettings = async (updatedCapacity, updatedStatus, updatedMatchmaking) => {
    try {
      const res = await fetch(`${API}/api/sessions/${sessionId}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          max_users: updatedCapacity !== null ? updatedCapacity : session.max_users,
          session_status: updatedStatus !== null ? updatedStatus : session.session_status,
          matchmaking_enabled: updatedMatchmaking !== null ? updatedMatchmaking : session.matchmaking_enabled
        })
      });
      if (res.ok) await syncSession(); 
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Invite link copied!");
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    void loadUserSessionReview();
  };

  const currentUserId = user?.user_id ?? user?.id;
  const isUserInSession = sessionUsers.some((pUser) => Number(pUser.user_id) === Number(currentUserId));
  const isLobbyHost = Number(currentUserId) === Number(session.host_user_id);
  const isLobbyLocked = session.session_status === 'locked';
  const isCurrentPlayerReady = readyUsers.includes(Number(currentUserId));

// DISCORD LINK PARSER
  const hasDiscordLink = session.session_description?.includes("https://discord.gg");
  
  let displayDescription = session.session_description || "";
  let discordUrl = null;

  if (hasDiscordLink) {
    const urlStartIndex = session.session_description.indexOf("https://");
    if (urlStartIndex !== -1) {
      discordUrl = session.session_description.substring(urlStartIndex).trim();
      displayDescription = session.session_description.substring(0, urlStartIndex).replace("[DISCORD_LINK]:", "").trim();
    }
  }

  if (!discordUrl || discordUrl.includes("{channel.id}") || discordUrl.includes("{")) {
    if (session.voice_id || session.session_id) {
      const pureRoomId = session.voice_id || session.session_id;
      discordUrl = `https://discord.gg/${pureRoomId}`;
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

              <div key={member.user_id} className="session-user-card">
                <div className="session-user-avatar" style={{ border: '2px solid #4f7cff' }} />
                <div className="session-user-info">
                  <div className="session-username" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>
                      {member.username}
                      {Number(member.user_id) === Number(session.host_user_id) && <span className="host-badge"> Host</span>}
                    </span>
                    {isLobbyHost && Number(member.user_id) !== Number(currentUserId) && (
                      <button 
                        onClick={() => handleKickUser(member.user_id)} 
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          cursor: 'pointer', 
                          padding: '4px',
                          opacity: 0.5,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                        title="Kick player"
                      >
                        <img src={bootIcon} alt="kick" style={{ width: '40px', height: '40px' }} />
                      </button>
                    )}
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

          {/* COWORKER UPGRADE: Add User Dropdown Panel Forms (Lint-Checked & Fixed) */}
          {isLobbyHost && (
            <div style={{ marginTop: "25px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "15px" }}>
              <div style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "8px", fontWeight: "700" }}>Add User to Session:</div>
              <input 
                type="text" 
                value={userSearch} 
                className="session-chat-input"
                style={{ background: "#090e20", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", padding: "8px 12px", width: "calc(100% - 24px)", marginBottom: "5px" }}
                onChange={(event) => { setUserSearch(event.target.value); setShowUserDropdown(true); }} 
                placeholder="Search users..." 
              />
              
              {showUserDropdown && (
                <div style={{ background: "#111625", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", maxHeight: "120px", overflowY: "auto", padding: "5px" }}>
                  {allUsers
                    .filter((u) => userSearch.trim() !== "" && u.username.toLowerCase().includes(userSearch.toLowerCase()))
                    .map((u) => (
                      <div 
                        key={u.user_id} 
                        style={{ padding: "6px 10px", color: "#fff", cursor: "pointer", borderRadius: "4px" }}
                        onClick={() => { setSelectedUserID(u.user_id); setUserSearch(u.username); setShowUserDropdown(false); }}
                      >
                        {u.username}
                      </div>
                    ))}
                </div>
              )}
              
              <button className="session-invite-button" style={{ width: "100%", marginTop: "8px", background: "#4f7cff" }} onClick={handleAddUserToSession}>
                Add Member +
              </button>
              {addUserError && <div className="add-user-error" style={{ marginTop: "5px", color: "#ff4a4a", fontSize: "0.8rem" }}>{addUserError}</div>}
            </div>
          )}
          {isUserInSession && (
            <button className="session-review-button" onClick={() => setIsReviewModalOpen(true)}>
              {userSessionReview ? "Edit your Review" : "Review Your Session"}
            </button>
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
              <strong style={{ color: isLobbyLocked ? '#ffaa00' : '#4f7cff' }}>{session.session_status}</strong>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="session-invite-button" onClick={handleCopyInvite}>Share Invite 🔗</button>

              {isUserInSession && (
                <button className={`session-ready-button ${isCurrentPlayerReady ? 'session-ready-button--unready' : ''}`} onClick={handleToggleReady}>
                  {isCurrentPlayerReady ? "Unready ❌" : "Ready Up! 👍"}
                </button>
              )}

              {isLobbyHost && (
                <button className="session-invite-button" style={{ background: '#3a3a3a' }} onClick={handleResetReadyCheck}>Reset Ready 🔄</button>
              )}

              {isLobbyHost ? (
                <button className="session-delete-button" onClick={handleDeleteSession}>Close Session 🚫</button>
              ) : isUserInSession ? (
                <button className="session-leave-button" onClick={handleLeaveSession}>Leave Session 🚪</button>
              ) : (
                <button className="session-join-button" onClick={handleJoinSession} disabled={isLobbyLocked || sessionUsers.length >= session.max_users} style={{ opacity: (isLobbyLocked || sessionUsers.length >= session.max_users) ? 0.4 : 1, cursor: (isLobbyLocked || sessionUsers.length >= session.max_users) ? 'not-allowed' : 'pointer' }}>
                  {isLobbyLocked ? "Lobby Locked 🔒" : sessionUsers.length >= session.max_users ? "Squad Full 🚫" : "Join Squad +"}
                </button>
              )}
            </div>
          </div>

          {isLobbyHost && (
            <div className="host-settings-bar">
              <div className="host-settings__group">
                <span className="host-settings__label">Player Limit:</span>
                <select className="host-settings__select" value={session.max_users || 4} onChange={(e) => handleUpdateLobbySettings(Number(e.target.value), null, null)}>
                  {[2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} Players</option>
                  ))}
                </select>
              </div>
              <div className="host-settings__group">
                <span className="host-settings__label">Lobby Lock:</span>
                <button type="button" className={`host-settings__lock-btn ${isLobbyLocked ? 'host-settings__lock-btn--locked' : ''}`} onClick={() => handleUpdateLobbySettings(null, isLobbyLocked ? 'active' : 'locked', null)}>
                  {isLobbyLocked ? 'Unlock Lobby 🔓' : 'Lock Lobby 🔒'}
                </button>
              </div>
              <div className="host-settings__group">
                <span className="host-settings__label">Public Queue:</span>
                <button type="button" className={`host-settings__toggle-btn ${session.matchmaking_enabled ? 'host-settings__toggle-btn--active' : ''}`} onClick={() => handleUpdateLobbySettings(null, null, !session.matchmaking_enabled)}>
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
                  <button className="discord-widget__button" onClick={() => window.open(discordUrl, '_blank')}>Join Voice Lobby 🎧</button>
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
              <p style={{ color: '#8fa0dd', fontSize: '0.95rem', maxWidth: '440px', margin: '0 auto 20px' }}>You are currently spectating. Click the blue <strong>"Join Squad +"</strong> button above to gain access to live text messages and the Discord audio channel!</p>
            </div>
          )}
        </main>
        <SessionReviewModal
          sessionId={sessionId}
          sessionUsers={sessionUsers}
          currentUserId={currentUserId}
          isOpen={isReviewModalOpen}
          onClose={handleCloseReviewModal}
        />
      </div>
    </div>
  );
}