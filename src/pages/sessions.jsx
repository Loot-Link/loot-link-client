import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";

// import "./Sessions.css";
//client/src/pages/Sessions.css

const API = "http://localhost:3000/api";
// const API = "import.meta.env.VITE_API";

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const syncSessions = async () => {
    // const response = await fetch(`${API}/sessions`);
    const response = await fetch(`${API}/sessions`);
    const data = await response.json();
    console.log(data);
    setSessions(data);
  };

  useEffect(() => {
    syncSessions();
  }, []);

  const filteredSessions = sessions.filter((session) =>
    session.session_title.toLowerCase().includes(searchTerm.toLowerCase())
  );


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
        {filteredSessions.map((session) => (
          <li className="sessions-catalog__item" key={session.session_id}>
            <Link to={`/sessions/${session.session_id}`} className="session-card">
              <div className="session-card__image-wrap">
                <img
                  className="session-card__image"
                  // src={session.image}
                  src={session.cover_image_url}
                  alt={session.session_title}
                />
              </div>

              <div className="session-card__body">
                <div className="session-card__top-row">
                  <h2 className="session-card__title">{session.session_title}</h2>
                  {session.age_rating && (
                    <span className="session-card__badge">{session.age_rating}</span>
                  )}
                </div>

                <div className="session-card__meta">
                  {session.genre && (
                    <span className="session-card__meta-item">{session.genre}</span>
                  )}
                  {session.category && (
                    <span className="session-card__meta-item">{session.category}</span>
                  )}
                </div>

                {session.session_description && (
                  <p className="session-card__description">
                    {session.session_description}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}


