import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";

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

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API}/game-reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    reviewTitle: reviewTitle,
                    gameReview: gameReview,
                    gameId: 3,
                    ratingValue: ratingValue,
                    userId: user?.id,
                }),
            });
console.log(response);
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
            <h2>Write a Review</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleSubmitReview}>
                <label>
                    Review Title
                    <input
                        type="text"
                        id='review-title-box'
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Write your review...
                    <input
                        type="text"
                        id='write-review-box'
                        value={gameReview}
                        onChange={(e) => setGameReview(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Which Game Would You Like to Review?
                    <span className="games-search__label">Search</span>
                    <input
                        className="games-search__input"
                        id='game-to-review'
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search games..."
                    />
                </label>
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
                <button type="submit" id="submit-review" disabled={loading}>
                    {loading ? "Posting..." : "Post Review"}
                </button>
            </form>
        </>
    );
}