import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import "./gamereviews.css";

const API = "http://localhost:3000/api";
// const API = "import.meta.env.VITE_API";

export default function GameReviews() {
  const [gameReviews, setGameReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [reviewView, setReviewView] = useState("all");
  const { user } = useAuth();

  const syncGameReviews = async () => {
    // const response = await fetch(`${API}/games`);
    const response = await fetch(`${API}/game-reviews`);
    const data = await response.json();
    console.log(data);
    setGameReviews(data);
  };

  useEffect(() => {
    syncGameReviews();
  }, []);

  // const filteredGameReviews = gameReviews.filter((review) =>
  //   review.review_title
  //     ?.toLowerCase()
  //     .includes(searchTerm.toLowerCase())
  // );
  const visibleGameReviews = gameReviews.filter((review) => {
  const matchesSearch = review.review_title
    ?.toLowerCase()
    .includes(searchTerm.toLowerCase());

  const matchesView =
    reviewView === "all" ||
    (reviewView === "mine" &&
      Number(review.user_id) === Number(user?.id))
  console.log("review user:", review.user_id, "logged in:", user);
  return matchesSearch && matchesView;
});

  // console.log("filtered:", filteredGameReviews);

  return (
  <div className="game-reviews-page">

    <div className="game-reviews-header">
      <h1>Game Reviews</h1>

      <input
        type="text"
        placeholder="Search reviews..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
    <div className="review-filter-tabs">
      <button onClick={() => setReviewView("all")}>
        All Reviews
      </button>

      <button onClick={() => setReviewView("mine")}>
        My Reviews
      </button>
    </div>
    <div className="game-reviews-list">

      {visibleGameReviews.map((review) => (
        <Link
          key={review.game_review_id}
          to={`/game-reviews/${review.game_review_id}`}
          className="game-review-link"
        >

          <div className="game-review-card">

            <img
              className="game-review-image"
              src={review.cover_image_url}
              alt={review.game_title}
            />

            <div className="game-review-content">

              <div className="game-review-top-row">

                <div>
                  <h2 className="game-review-title">
                    {review.review_title}
                  </h2>

                  <h3 className="game-review-game-title">
                    {review.game_title}
                  </h3>
                </div>

                <div className="game-review-rating">
                  ⭐ {review.rating_value}/5
                </div>

              </div>

              <p className="game-review-text">
                {review.game_review.slice(0, 280)}...
              </p>

              <div className="game-review-footer">

                <div>
                  Written by {review.username}
                </div>

                <div>
                  {new Date(review.created_at).toLocaleDateString()}
                </div>

              </div>

            </div>

          </div>

        </Link>
      ))}

    </div>

  </div>
);

}
