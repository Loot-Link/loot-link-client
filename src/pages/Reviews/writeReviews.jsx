import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import "./WriteReviews.css";

const API = "http://localhost:3000/api";

export default function WriteReviews() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [reviewTitle, setReviewTitle] = useState("");
    const [gameReview, setGameReview] = useState("");
    const [gameId, setGameId] = useState(0);
    const [ratingValue, setRatingValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [games, setGames] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [gamesLoading, setGamesLoading] = useState(false);
    

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    useEffect(() => {
        const fetchGames = async () => {
            setGamesLoading(true);
            try {
                const response = await fetch(`${API}/games`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setGames(data);
                }
            } catch (err) {
                console.error("Failed to fetch games:", err);
            } finally {
                setGamesLoading(false);
            }
        };

        if (token) {
            fetchGames();
        }
    }, [token]);

    const filteredGames = games.filter(game =>
        game.game_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleGameSelect = (game) => {
        setSelectedGame(game);
        setGameId(game.game_id);
        setSearchTerm('');
        setShowDropdown(false);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!gameId) {
            setError("Please select a game");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API}/game-reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    reviewTitle,
                    gameReview,
                    gameId,
                    ratingValue,
                    userId: user.id
                }),
            });
            if (!response.ok) {
                throw new Error("Failed to post review");
            }

            const data = await response.json();
            navigate(`/reviews/${data.id}`);
        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <main className='write-review-page'>
                <h2>Write a Review</h2>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <form onSubmit={handleSubmitReview}>
                    <label className='review-title'>
                        Review Title
                        <input
                            type="text"
                            id='review-title-box'
                            value={reviewTitle}
                            onChange={(e) => setReviewTitle(e.target.value)}
                            required
                        />
                    </label>
                    <label className='write-review'>
                        Write your review...
                        <textarea
                            id='write-review-box'
                            value={gameReview}
                            onChange={(e) => setGameReview(e.target.value)}
                            required
                        />
                    </label>
                    <label className='game-select'>
                        Which Game Would You Like to Review?
                        <div className="games-search__container">
                            <input
                                className="games-search__input"
                                id='game-to-review'
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                placeholder="Search games..."
                                autoComplete="off"
                            />
                            {showDropdown && searchTerm && filteredGames.length > 0 && (
                                <ul className="games-search__dropdown">
                                    {filteredGames.map((game) => (
                                        <li
                                            key={game.id}
                                            className="games-search__dropdown-item"
                                            onClick={() => handleGameSelect(game)}
                                        >
                                            {game.game_title}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {selectedGame && (
                            <div className="selected-game-tile">
                                <img
                                src={selectedGame.cover_image_url}
                                alt={selectedGame.game_title}
                                className="selected-game-tile__image"
                                />
                                <div className="selected-game-tile__info">
                                    <h3>{selectedGame.game_title}</h3>
                                </div>
                            </div>
                        )}
                    </label>
                    <div className="review-row">
                      <fieldset>
                          <legend>Rating</legend>
                          <div>
                              <input
                                  type="radio"
                                  id="rating1"
                                  name="valueRating"
                                  value="recommend"
                                  checked={ratingValue === "recommend"}
                                  onChange={(e) => setRatingValue(e.target.value)}
                              />
                              <label htmlFor="rating1">Recommend</label>

                              <input
                                  type="radio"
                                  id="rating2"
                                  name="valueRating"
                                  value="doNotRecommend"
                                  checked={ratingValue === "doNotRecommend"}
                                  onChange={(e) => setRatingValue(e.target.value)}
                              />
                              <label htmlFor="rating2">Do Not Recommend</label>
                          </div>
                      </fieldset>
                      <div className="review-actions">
                          <button type="submit" id="submit-review" disabled={loading}>
                              {loading ? "Posting..." : "Post Review"}
                          </button>
                      </div>
                    </div>
                </form>
            </main>
        </>
    );
}