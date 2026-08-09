import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate, useSearchParams  } from "react-router-dom";
import "./sessions.css"; //client/src/pages/Sessions.css

const API = import.meta.env.VITE_API;
// const API = "import.meta.env.VITE_API";

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameIdFilter = searchParams.get("gameId");

  const syncSessions = async () => {
    // const response = await fetch(`${API}/sessions`);
    const response = await fetch(`${API}/api/sessions`);
    const data = await response.json();
    console.log(data);
    setSessions(data);
  };
  
    // Handle Automatic Search Engine Routing
  const handleTriggerAutoMatchmaking = async () => {
    try {
      const res = await fetch(`${API}/api/sessions/matchmaking/auto-fill`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Leverages your existing global Auth context tokens
        },
      });

      if (!res.ok) {
        const errorNotice = await res.text();
        alert(errorNotice); // Gracefully handles showing "No open matchmaking queues found"
        return;
      }

      const match = await res.json();
      alert("🎯 Squad Found! Transporting your operator to lobby communications...");
      navigate(`/sessions/${match.session_id}`); // Bounces them instantly to the target room details
    } catch (err) {
      console.error("Matchmaking routing failure:", err);
    }
  };


  // FIXED: Wrapped in an async function to satisfy strict React linting rules
  useEffect(() => {
    const init = async () => {
      await syncSessions();
    };
    init();
  }, []);

  // const filteredSessions = sessions.filter((session) =>
  //   session.session_title.toLowerCase().includes(searchTerm.toLowerCase())
  // );
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.session_title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesGame = gameIdFilter
      ? Number(session.game_id) === Number(gameIdFilter)
      : true;

    return matchesSearch && matchesGame;
  });

  const currentUserId = user?.user_id ?? user?.id;



  
  return (
    <section className="sessions-page">
      <div className="sessions-page__header">
        <div className="sessions-page__title-wrap">
          <h1 className="sessions-page__title">sessions</h1>
          <p className="sessions-page__subtitle">
            Browse the catalog and start a session.
          </p>
        </div>
        <div className="sessions-page__controls">
          <label className="sessions-search">
            <span className="sessions-search__label">Search</span>
            <input
              className="sessions-search__input"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search sessions..."
            />
          </label>
  
          {/* NEW GLOWING AUTOMATIC MATCHMAKING TRIGGER LINK (Added) */}
          <button 
            type="button" 
            className="global-matchmaking-btn" 
            onClick={handleTriggerAutoMatchmaking}
          >
            Find a Match 🎲
          </button>

          <div className="sessions-view-toggle">
            <button
              className={`sessions-view-toggle__button ${
                viewMode === "grid" ? "is-active" : ""
              }`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              Grid
            </button>
            <button
              className={`sessions-view-toggle__button ${
                viewMode === "list" ? "is-active" : ""
              }`}
              onClick={() => setViewMode("list")}
              type="button"
            >
              List
            </button>
          </div>
        </div>
      </div>
      <div className="sessions-results-bar">
        <p className="sessions-results-bar__count">
          {filteredSessions.length} sessions
        </p>
      </div>
      <ul
        className={`sessions-catalog ${
          viewMode === "grid" ? "sessions-catalog--grid" : "sessions-catalog--list"
        }`}
      >
        {filteredSessions.map((session) => {
          const isLobbyHost = Number(session.host_user_id) === Number(currentUserId);
          const isLobbyLocked = session.session_status === 'locked';
          
          // NEW INTEGRATION MAPPING: Compares counting aggregates against slot cap settings
          const isLobbyFull = Number(session.current_user_count) >= Number(session.max_users);

          return (
            <li className="sessions-catalog__item" key={session.session_id}>
              <Link 
                to={`/sessions/${session.session_id}`} 
                className="session-card" 
                style={{ 
                  position: 'relative',
                  // Prevent entering a filled session unless you already belong to the host squad
                  pointerEvents: (isLobbyFull && !isLobbyHost) ? 'none' : 'auto',
                  cursor: (isLobbyFull && !isLobbyHost) ? 'not-allowed' : 'pointer'
                }}
              >
                
                {/* Visual Ribbon Badges Overlay Layer (Updated) */}
                <div className="session-badge-container">
                  {isLobbyHost && (
                    <span className="badge-status--host">Lobby Host 👑</span>
                  )}
                  {isLobbyLocked && (
                    <span className="badge-status--locked">Lobby Locked 🔒</span>
                  )}
                  {/* Shows gold "Squad Full" badge when limits are crossed */}
                  {!isLobbyHost && !isLobbyLocked && isLobbyFull && (
                    <span className="badge-status--full">Squad Full 🚫</span>
                  )}
                </div>

                {/* Dims visual covers subtly when filled or frozen to signal block */}
                <div className="session-card__image-wrap" style={{ opacity: (isLobbyLocked || isLobbyFull) ? 0.5 : 1 }}>
                  <img
                    className="session-card__image"
                    // src={session.image}
                    src={session.cover_image_url}
                    alt={session.session_title}
                  />
                </div>
                <div className="session-card__body" style={{ opacity: (isLobbyLocked || isLobbyFull) ? 0.6 : 1 }}>
                  <div className="session-card__top-row">
                    <h2 className="session-card__title">{session.session_title}</h2>
                    
                    {/* Render a sleek fraction headcount micro-badge right inside the card row */}
                    <span 
                      className="session-card__badge" 
                      style={{ background: isLobbyFull ? '#d87a13' : '#1e45b3', transition: 'background-color 0.2s' }}
                    >
                      {session.current_user_count || 1}/{session.max_users || 4}
                    </span>
                  </div>
                  <div className="session-card__meta">
                    {session.genre && (
                      <span className="session-card__meta-item">{session.genre}</span>
                    )}
                    {session.category && (
                      <span className="session-card__meta-item">{session.category}</span>
                    )}
  
                    {/* NEW GLOWING PLAYSTYLE CUSTOM METADATA TAG (Added) */}
                    {session.playstyle && (
                      <span className="session-card__playstyle">{session.playstyle}</span>
                    )}
                  </div>
                  {session.session_description && (
                    <p className="session-card__description">
                      {session.session_description.includes("[DISCORD_LINK]:")
                        ? session.session_description.split("\n\n[DISCORD_LINK]:")[0]   
                        : session.session_description}
                    </p>
                )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
