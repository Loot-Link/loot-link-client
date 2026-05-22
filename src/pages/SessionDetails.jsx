import { useEffect, useState } from "react";
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

  return (
    <div className="session-details-page">
      <div className="session-hero">
        <img 
          className="session-hero-image" 
          src={session.cover_image_url} 
          alt={session.game_title} 
        />
        <div className="session-hero-overlay">
          <h1 className="session-title">{session.session_title}</h1>
          <h2 className="session-game-title">{session.game_title}</h2>
          <p className="session-description">{session.session_description}</p>
        </div>
      </div>

      <div className="session-content">
        <aside className="session-users-panel">
          <h3 className="session-users-heading">Session Players</h3>
          {sessionUsers.map((u) => (
            <div key={u.user_id} className="session-user-card">
              <div className="session-user-avatar" />
              <div className="session-user-info">
                <div className="session-username">
                  {u.username} 
                  {u.is_host && <span className="host-badge"> Host</span>}
                </div>
                <div className="session-user-status">
                  {u.membership_status}
                </div>
              </div>
            </div>
          ))}
        </aside>

        <main className="session-main-panel">
          <div className="session-status-card">
            <span>Status:</span> 
            <strong>{session.session_status}</strong>
          </div>

          <div className="session-chat-container">
            <div className="session-chat-messages">
              {sessionMessages.map((msg) => (
                <div 
                  key={msg.session_message_id} 
                  className={`chat-message ${msg.user_id === user?.user_id ? "own-message" : ""}`}
                >
                  <div className="chat-message-avatar" />
                  <div className="chat-message-content">
                    <div className="chat-message-header">
                      <span className="chat-username">{msg.username}</span>
                      <span className="chat-time">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="chat-message-text">{msg.message_text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="session-chat-input">
              <input 
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="auth-button" onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
