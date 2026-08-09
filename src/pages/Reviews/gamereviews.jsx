import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "./gamereviews.css";

const API = import.meta.env.VITE_API;

export default function GameReviews() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [gameReviews, setGameReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewView, setReviewView] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [minRating, setMinRating] = useState("any");

  const syncGameReviews = async () => {
    const response = await fetch(`${API}/api/game-reviews`);
    const data = await response.json();
    setGameReviews(data);
  };

  useEffect(() => {
    syncGameReviews();
  }, []);


  const currentUserId = user?.user_id ?? user?.id;

  const visibleGameReviews = gameReviews
    .filter((review) => {
      const matchesSearch =
        review.review_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.game_title?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesView =
        reviewView === "all" ||
        (reviewView === "mine" && Number(review.user_id) === Number(currentUserId)) ||
        (reviewView === "popular" && Number(review.view_counter) >= 20) ||
        (reviewView === "highlyRated" && Number(review.rating_value) >= 4);

      const matchesRating =
        minRating === "any" || Number(review.rating_value) >= Number(minRating);

      return matchesSearch && matchesView && matchesRating;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return b.view_counter - a.view_counter;
      if (sortBy === "rating") return (b.vote_score || 0) - (a.vote_score || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });



  const incrementViewCount = async (reviewId) => {
    await fetch(`${API}/game-reviews/${reviewId}/view`, {
      method: "PATCH",
    });
  };






  return (
  <div className="game-reviews-page">

    <div className="game-reviews-hero">
      <div>
        <h1>Reviews</h1>
        <p>
          Browse player-written reviews across Loot-Link.
        </p>
        <p className="review-count">
          Showing {visibleGameReviews.length} reviews
        </p>
      </div>

      <button className="write-review-button" onClick={() => navigate("/writeReviews")}>
        Write a Review
      </button>
    </div>




{/****************************** Control Bar ******************************/}
    <div className="game-reviews-toolbar">
      <div className="review-tabs">
        <button className={reviewView === "all" ? "active" : ""} onClick={() => setReviewView("all")}>
          All Reviews
        </button>

        <button className={reviewView === "mine" ? "active" : ""} onClick={() => setReviewView("mine")}>
          My Reviews
        </button>

        <button className={reviewView === "popular" ? "active" : ""} onClick={() => setReviewView("popular")}>
          Popular
        </button>

        <button className={reviewView === "highlyRated" ? "active" : ""} onClick={() => setReviewView("highlyRated")}>
          Highly Rated
        </button>
      </div>

      <div className="review-control-row">
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search reviews or games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Rating</label>
          <select value={minRating} onChange={(e) => setMinRating(e.target.value)}>
            <option value="any">Any Rating</option>
            <option value="5">5 Stars</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
          </select>
        </div>

        <div className="sort-group">
          <label>Sort by</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="popular">Most Viewed</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>
    </div>



{/****************************** Review List ******************************/}
    <div className="reviews-layout">

      <main className="reviews-main">



        <div className="game-reviews-list">

          {visibleGameReviews.map((review) => (
            <Link
              key={review.game_review_id}
              to={`/game-reviews/${review.game_review_id}`}
              className="game-review-link"
              onClick={() => incrementViewCount(review.game_review_id)}
            >

              <article className="game-review-card">

                <img
                  className="game-review-image"
                  src={review.cover_image_url}
                  alt={review.game_title}
                />

                <div className="game-review-content">

                  <div className="game-review-top-row">

                    <div>
                      <h2>{review.review_title}</h2>

                      <h3>{review.game_title}</h3>
                    </div>

                    <div className="game-review-rating">
                      ⭐ {review.rating_value}/5
                    </div>

                  </div>

                  <p className="game-review-text">
                    {review.game_review.slice(0, 190)}...
                  </p>

                  <div className="game-review-footer">

                    <span>
                      Written by {review.username}
                    </span>

                    <span className="review-vote-counts">
                      👍 {review.vote_upvotes || 0}  👎 {review.vote_downvotes || 0}
                    </span>

                    <span>
                      {review.view_counter} views
                    </span>

                    <span>
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>

                  </div>

                </div>

              </article>

            </Link>
          ))}

        </div>

      </main>





{/****************************** Aside - Side Bar ******************************/}

      <aside className="reviews-sidebar">
        
        {/******** To be implemented at a later date*******/}
        {/* <h3>Popular Filters</h3>

        <button>
          Games I’ve Played
        </button>

        <button>
          Co-op Friendly
        </button>

        <button>
          Single Player
        </button>

        <button>
          New Releases
        </button> */}

        <h3>Rating Quick Filter</h3>

        <button onClick={() => setMinRating("5")}>
          ⭐⭐⭐⭐⭐
        </button>

        <button onClick={() => setMinRating("4")}>
          ⭐⭐⭐⭐ & up
        </button>

        <button onClick={() => setMinRating("3")}>
          ⭐⭐⭐ & up
        </button>

      </aside>

    </div>

  </div>
);
}