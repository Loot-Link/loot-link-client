import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CreateSessionDialog({ game, onDismiss }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const API = import.meta.env.VITE_API;

  const handleLaunch = async (formData) => {
    setError(null);
    try {
      const res = await fetch(`${API}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          game_id: game.game_id,
          session_title: formData.get("session_title"),
          max_users: Number(formData.get("max_users")) || 4,
          is_private: formData.get("is_private") === "on",
          matchmaking_enabled: formData.get("matchmaking_enabled") === "on",
          playstyle: formData.get("playstyle") || "Casual"
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

  // Dimensions for clamping
  const boxHeight = 360; // Slightly increased height to accommodate the new toggle element safely

  // FIXED: safeY now uses the click position relative to the SCREEN window
  const safeY = Math.min(
    Math.max(game.clickY, boxHeight / 2 + 20),
    window.innerHeight - (boxHeight / 2 + 20)
  );

  return (
    <div
      style={{
        position: "fixed", // Keeps the overlay locked to the screen
        inset: 0,
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onDismiss}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { 
          from { transform: translate(-50%, -50%) scale(0.9); opacity: 0; } 
          to { transform: translate(-50%, -50%) scale(1); opacity: 1; } 
        }
      `}</style>

      <div
        className="auth-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed", // CRITICAL: Makes the box follow your screen view, not the page top
          top: `${safeY}px`, // Level with your click
          left: "50%", // Horizontally centered
          transform: "translate(-50%, -50%)",
          margin: 0,
          background: "#1a1f35",
          border: "2px solid #4f7cff",
          width: "340px",
          boxShadow: "0 30px 60px rgba(0,0,0,0.8)",
          animation: "scaleIn 0.2s ease-out",
          padding: "24px",
        }}
      >
        <h2
          className="auth-title"
          style={{
            color: "#fff",
            textAlign: "center",
            fontSize: "1.2rem",
            marginBottom: "20px",
          }}
        >
          Host {game.game_title}
        </h2>
        <form className="auth-form" action={handleLaunch} style={{ gap: "15px" }}>
          <label className="auth-label">
            <span style={{ color: "#fff" }}>Session Title</span>
            <input
              className="auth-input"
              name="session_title"
              placeholder="Lobby Name"
              required
              style={{ background: "#090e20", color: "#fff", height: "40px" }}
            />
          </label>
          <label className="auth-label">
            <span style={{ color: "#fff" }}>Max Players</span>
            <input
              className="auth-input"
              name="max_users"
              type="number"
              defaultValue="4"
              style={{ background: "#090e20", color: "#fff", height: "40px" }}
            />
          </label>
          {/* NEW PLAYSTYLE SELECTOR DROPDOWN MODULE */}
          <label className="auth-label">
            <span style={{ color: "#fff" }}>Lobby Playstyle</span>
            <select name="playstyle" className="auth-input" style={{ background: "#090e20", color: "#fff", height: "40px", width: "100%", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "0 10px" }}>
              <option value="Casual">Casual ☕</option>
              <option value="Competitive">Competitive 🔥</option>
              <option value="Speedrun">Speedrun ⏱️</option>
              <option value="Achievements">Achievements 🏆</option>
            </select>
          </label>

          {/* Merged Interactive Private Toggle Element */}
          <label className="auth-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '5px', userSelect: 'none' }}>
            <input 
              type="checkbox" 
              name="is_private" 
              style={{ width: '18px', height: '18px', margin: 0, cursor: 'pointer', accentColor: '#4f7cff' }} 
            />
            <span style={{ color: '#fff', fontSize: '0.9rem' }}>Private (Invite Only)</span>
          </label>

          <button
            className="auth-button"
            style={{ marginTop: "5px", height: "44px" }}
          >
            Launch Session
          </button>
          <button
            type="button"
            onClick={onDismiss}
            style={{
              background: "none",
              border: "none",
              color: "#9aa3c7",
              width: "100%",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Cancel
          </button>
          {error && <p className="auth-error" style={{ textAlign: 'center', color: '#ff4a4a', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}
