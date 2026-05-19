import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import CreateSessionDialog from "./CreateSessionDialog";
import "./games.css";

const API = "http://localhost:3000/api";
// const API = "import.meta.env.VITE_API";

export default function Games() {
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [activeGameForDialog, setActiveGameForDialog] = useState(null);

  const syncGames = async () => {
    const response = await fetch(`${API}/games`);
    const data = await response.json();
    console.log(data);
    setGames(data);
  };

  useEffect(() => {
    syncGames();
  }, []);

  const filteredGames = games.filter((game) =>
    game.game_title && game.game_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="games-page">
      <div className="games-page__header">
        <div className="games-page__title-wrap">
          <h1 className="games-page__title">Games</h1>
          <p className="games-page__subtitle">
            Browse the catalog and start a session.
          </p>
        </div>
        <div className="games-page__controls">
          <label className="games-search">
            <span className="games-search__label">Search</span>
            <input
              className="games-search__input"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search games..."
            />
          </label>
          <div className="games-view-toggle">
            <button
              className={`games-view-toggle__button ${
                viewMode === "grid" ? "is-active" : ""
              }`}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              Grid
            </button>
            <button
              className={`games-view-toggle__button ${
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

      <div className="games-results-bar">
        <p className="games-results-bar__count">
          {filteredGames.length} games
        </p>
      </div>

      <ul
        className={`games-catalog ${
          viewMode === "grid" ? "games-catalog--grid" : "games-catalog--list"
        }`}
      >
        {filteredGames.map((game) => (
          <li className="games-catalog__item" key={game.game_id}>
            <div className="game-card">
              <Link to={`/games/${game.game_id}`}>
                <div className="game-card__image-wrap">
                  <img
                    className="game-card__image"
                    src={game.cover_image_url}
                    alt={game.game_title}
                  />
                </div>
              </Link>
              <div className="game-card__body">
                <div className="game-card__top-row">
                  <h2 className="game-card__title">{game.game_title}</h2>
                  <button
                    className="game-card__badge"
                    style={{ border: "none", cursor: "pointer" }}
                    onClick={(e) => {
                      e.preventDefault();
                      // FIXED: Capture mouse position to pass to the Dialog
                      setActiveGameForDialog({
                        ...game,
                        clickX: e.clientX,
                        clickY: e.clientY
                      });
                    }}
                  >
                    Start Session +
                  </button>
                </div>
                <div className="game-card__meta">
                  {game.genre && (
                    <span className="game-card__meta-item">{game.genre}</span>
                  )}
                  {game.category && (
                    <span className="game-card__meta-item">{game.category}</span>
                  )}
                </div>
                {game.game_description && (
                  <p className="game-card__description">{game.game_description}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {activeGameForDialog && (
        <CreateSessionDialog
          game={activeGameForDialog}
          onDismiss={() => setActiveGameForDialog(null)}
        />
      )}
    </section>
  );
}

// return (
// <>
// <label className="game-list-search">
// Search Book List :
// <input
// type="text"
// name="searchInput"
// value={searchTerm}
// onChange={(event) => setSearchTerm(event.target.value)}
// />
// </label>
// <ul className="game-list">
// {filteredGames.map((game) => (
// <li key={game.game_id}>
// <Link to={`/games/${game.game_id}`} className="game-list-item">
// <img src={game.cover_image_url} alt={game.game_title} />
// <div>
// <h2>{game.game_title}</h2>
// <h2>{game.game_id}</h2>
// <h4>{game.genre}</h4>
// <p>{game.game_description}</p>
// </div>
// </Link>
// </li>
// ))}
// </ul>
// </>
// );
// }
