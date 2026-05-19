import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

/** Form to create a new gaming session */
export default function CreateSession({ gameId, gameTitle }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const API = import.meta.env.VITE_API;

  const tryCreateSession = async (formData) => {
    setError(null);
    const session_title = formData.get("session_title");
    const session_description = formData.get("session_description");
    const max_users = formData.get("max_users");

    try {
      const response = await fetch(`${API}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          game_id: gameId,
          session_title,
          session_description,
          max_users: Number(max_users),
        }),
      });

      const result = await response.json();
      if (!response.ok) throw Error(result.message || "Failed to create session");
      
      navigate(`/sessions/${result.session_id}`);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="auth-card">
      <h2 className="auth-title">Start Session: {gameTitle}</h2>
      <form className="auth-form" action={tryCreateSession}>
        <label className="auth-label">
          <span>Session Title</span>
          <input className="auth-input" name="session_title" placeholder="e.g. Chill Ranked Runs" required />
        </label>
        <label className="auth-label">
          <span>Description</span>
          <textarea className="auth-input" name="session_description" style={{paddingTop: '12px', height: '100px'}} />
        </label>
        <label className="auth-label">
          <span>Max Players</span>
          <input className="auth-input" name="max_users" type="number" defaultValue="4" />
        </label>
        <button className="auth-button">Create Session</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
      </form>
    </div>
  );
}
