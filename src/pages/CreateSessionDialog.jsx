import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

/** Dialog for launching a session directly from a game card */
export default function CreateSessionDialog({ game, onDismiss }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const API = import.meta.env.VITE_API;

  const handleLaunch = async (formData) => {
    setError(null);
    const session_title = formData.get("session_title");
    const session_description = formData.get("session_description");
    const max_users = formData.get("max_users");

    try {
      const res = await fetch(`${API}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          game_id: game.game_id,
          session_title,
          session_description,
          max_users: Number(max_users) || 4,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw Error(result.message || "Failed to launch session");
      }

      const newSession = await res.json();
      navigate(`/sessions/${newSession.session_id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)' }} onClick={onDismiss}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()} style={{ marginTop: '10vh' }}>
        <h2 className="auth-title">Host {game.game_title}</h2>
        <form className="auth-form" action={handleLaunch}>
          <label className="auth-label">
            <span>Session Title</span>
            <input className="auth-input" name="session_title" placeholder="Give your lobby a name" required />
          </label>
          <label className="auth-label">
            <span>Max Players</span>
            <input className="auth-input" name="max_users" type="number" defaultValue="4" />
          </label>
          <button className="auth-button">Launch Session</button>
          <button type="button" className="auth-switch" onClick={onDismiss} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer' }}>
            Cancel
          </button>
          {error && <p className="auth-error" role="alert">{error}</p>}
        </form>
      </div>
    </div>
  );
}
