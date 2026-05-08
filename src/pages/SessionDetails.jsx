import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";


const API = "http://localhost:3000/api";

export default function SessionDetails() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synced with your api/sessions.js (which returns { ...session, players })
  const syncSession = async () => {
    try {
      const response = await fetch(`${API}/sessions/${sessionId}`);
      const data = await response.json();
      console.log("Session Data:", data);
      setSession(data);
    } catch (err) {
      console.error("Failed to sync session:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncSession();
  }, [sessionId]);

  if (loading) return <div className="app-shell">Loading session...</div>;
  if (!session) return <div className="app-shell">Session not found.</div>;

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
          {/* Using session.players from your merged backend route */}
          {session.players?.map((user) => (
            <div key={user.user_id} className="session-user-card">
              <div className="session-user-avatar" />
              <div className="session-user-info">
                <div className="session-username">
                  {user.username} 
                  {user.user_id === session.host_user_id && (
                    <span className="host-badge"> Host</span>
                  )}
                </div>
                <div className="session-user-status">
                  {user.membership_status || 'Joined'}
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
          {/* You can add your "Join" or "Discord" buttons here later */}
        </main>
      </div>
    </div>
  );
}
