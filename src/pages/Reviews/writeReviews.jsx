import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { Link } from "react-router-dom";
import { createGameReviews } from "../../../../loot-link-server/db/queries/reviews";


export default function WriteReviews() {
    const { token } = useAuth();
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [gameOptions, setGameOptions] = useState([]);

    const syncGames = async () => {
        // const response = await fetch(`${API}/games`);
        const response = await fetch(`${API}/games`);
        const data = await response.json();
        console.log(data);
        setGameOptions(data);
    };

    useEffect(() => {
        syncGames();
    }, []);

    const filteredGames = games.filter((game) =>
        game.game_title &&
        game.game_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tryWriteReview = async (formData) => {
        setError(null);

        const reviewTitle = formData.get('reviewTitle');
        const gameReview = formData.get('gameReview');
        const gameTitle = formData.get('gameTitle');
        const genre = formData.get('genre');
        const category = formData.get('category');
        // const gamePlatforms = formData.get('gamePlatforms');
        const userId = formData.get('userId');
        const ratingValue = formData.get('ratingValue');

        try {
            await createGameReviews(token, {
                reviewTitle,
                gameReview,
                gameTitle,
                genre,
                category,
                // gamePlatforms,
                userId,
                ratingValue
            });
            syncGameReviews();
        } catch (e) {
            setError(e.message);
        }
    };

    const handleClick = async (userId) => {
        try {
            await createGameReviews(token, userId);
            await syncGameReviews();
        } catch(error) {
            error(error.message)
        }
    };

    return (
        <>
            <h2>Write a Review!</h2>
            <form action={tryWriteReview}>
                <label>
                    Review Title
                    <input type = 'text' name = 'review-title' required/>
                </label>
                <label>
                    Write your review...
                    <input type = 'text' name='game-review' required/>
                </label>
                <label>
                    Which Game Would You Like to Review?
                    <span className="games-search__label">Search</span>
                    <input
                    className="games-search__input"
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search games..."
                    />
                </label>
                <div className="game-card__meta">
                  {game.genre && (
                    <span className="game-card__meta-item">{game.genre}</span>
                  )}
                  {game.category && (
                    <span className="game-card__meta-item">{game.category}</span>
                  )}
                </div>
                <fieldset>
                    <legend>Rating</legend>
                    <div>
                        <input type='radio' id='rating1' name='recommend' value='recommend'/>
                        <label for='rating1'>Recommend</label>

                        <input type='radio' id='rating2' name='doNotRecommend' value='doNotRecommend'/>
                        <label for='rating2'>Do Not Recommend</label>
                    </div>
                </fieldset>
                <button onClick={() => handleClick(gameReviewId?.id)} id='submit-review'>
                    Post Review
                </button>
            </form>
        </>
    )
};