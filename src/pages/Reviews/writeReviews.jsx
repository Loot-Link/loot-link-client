import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./writeReviews.css";

const API = import.meta.env.VITE_API;

export default function WriteReviews() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
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
    const [editingReviewId, setEditingReviewId] = useState(null);
    const isEditing = searchParams.get('edit') === '1' && searchParams.get('id');
    

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    useEffect(() => {
        const fetchReviewForEdit = async () => {
            if (!isEditing) return;
            const reviewId = searchParams.get('id');
            setEditingReviewId(reviewId);

            try {
                const response = await fetch(`${API}/api/game-reviews/${reviewId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch review for editing');
                }
                const data = await response.json();
                setReviewTitle(data.review_title);
                setGameReview(data.game_review);
                setRatingValue(data.rating_value);
                setGameId(data.game_id);
                // Set selectedGame so the game tile shows
                const gameToFind = games.find(g => g.game_id === data.game_id);
                if (gameToFind) {
                    setSelectedGame(gameToFind);
                }
            } catch (err) {
                console.error('Error fetching review:', err);
                setError('Failed to load review for editing');
            }
        };

        if (isEditing && games.length > 0) {
            fetchReviewForEdit();
        }
    }, [isEditing, searchParams, token, games]);

    useEffect(() => {
        const fetchGames = async () => {
            setGamesLoading(true);
            try {
                const response = await fetch(`${API}/api/games`, {
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

        if (!ratingValue) {
            setError("Please select a rating");
            setLoading(false);
            return;
        }

        try {
            const method = editingReviewId ? "PATCH" : "POST";
            const url = editingReviewId ? `${API}/api/game-reviews/${editingReviewId}` : `${API}/api/game-reviews`;
            
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    reviewTitle,
                    gameReview,
                    gameId,
                    ratingValue
                }),
            });
            if (!response.ok) {
                throw new Error(editingReviewId ? "Failed to update review" : "Failed to post review");
            }

            const data = await response.json();
            const reviewId = editingReviewId || data.game_review_id;
            navigate(`/game-reviews/${reviewId}`);
        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        const gameIdFromUrl = searchParams.get("gameId");

        if (!gameIdFromUrl || games.length === 0) return;

        const game = games.find(
            (g) => Number(g.game_id) === Number(gameIdFromUrl)
        );

        if (game) {
            setSelectedGame(game);
            setGameId(game.game_id);
        }
    }, [games, searchParams]);


    return (
        <>
            <main className='write-review-page'>
                <h2>{editingReviewId ? "Edit Review" : "Write a Review"}</h2>
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
                          <div className="star-rating">
                              {[1, 2, 3, 4, 5].map((value) => (
                                  <label key={value} className="star-rating__label" htmlFor={`rating${value}`}>
                                      <input
                                          type="radio"
                                          id={`rating${value}`}
                                          name="valueRating"
                                          value={value}
                                          checked={ratingValue === value}
                                          onChange={(e) => setRatingValue(Number(e.target.value))}
                                      />
                                      <span className="star-rating__stars">{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
                                  </label>
                              ))}
                          </div>
                      </fieldset>
                      <div className="review-actions">
                          <button type="submit" id="submit-review" disabled={loading}>
                              {loading ? (editingReviewId ? "Updating..." : "Posting...") : (editingReviewId ? "Update Review" : "Post Review")}
                          </button>
                      </div>
                    </div>
                </form>
            </main>
        </>
    );
}