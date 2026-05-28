import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useParams  } from "react-router-dom";
import "./gamereviews.css";

const API = "http://localhost:3000/api";
// const API = "import.meta.env.VITE_API";

export default function GameReviewDetails() {
  const [gameReviews, setGameReviews] = useState([]);
  const [viewMode, setViewMode] = useState("grid");

  const { id } = useParams();

  const syncGameReviews = async () => {
    // Guard against undefined id
    if (!id) {
      console.warn('Review ID is not available yet');
      return;
    }
    
    try {
      const response = await fetch(`${API}/game-reviews/${id}`);
      
      // Check if response is ok before parsing
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(data);
      setGameReviews(data);
    } catch (error) {
      console.error('Error fetching game review:', error);
    }
  };

  useEffect(() => {
    syncGameReviews();
  }, [id]); // Add id as dependency



  // console.log("filtered:", filteredGameReviews);

  return (
  <div className="game-review-details-page">

    <div className="game-review-details-banner">

      <img
        className="game-review-details-image"
        src={gameReviews.cover_image_url}
        alt={gameReviews.game_title}
      />

      <div className="game-review-details-overlay">

        <h1 className="game-review-details-title">
          {gameReviews.review_title}
        </h1>

        <h2 className="game-review-details-game-title">
          {gameReviews.game_title}
        </h2>

        <div className="game-review-details-meta">

          <span>
            ⭐ {gameReviews.rating_value}/5
          </span>

          <span>
            Written by {gameReviews.username}
          </span>

          <span>
            {new Date(gameReviews.created_at).toLocaleDateString()}
          </span>

        </div>

      </div>

    </div>

    <div className="game-review-details-content">

      <div className="game-review-details-body">

        <p>
          {gameReviews.game_review}
        </p>

      </div>

      <div className="game-review-details-actions">

        <button>
          Rate Review
        </button>

        <button>
          Edit Review
        </button>

        <button>
          Delete Review
        </button>

      </div>

    </div>

  </div>
);

}
