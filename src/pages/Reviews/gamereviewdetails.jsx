import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate, useParams, Link } from "react-router-dom";
import "./gamereviewdetails.css";

const API = import.meta.env.VITE_API;
// const API = "import.meta.env.VITE_API";

export default function GameReviewDetails() {
  const [gameReviews, setGameReviews] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [votes, setVotes] = useState({ upvotes: 0, downvotes: 0, score: 0, userVote: null });

  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUserId = user?.user_id || user?.id;

  const syncGameReviews = async () => {
    if (!id) {
      console.warn('Review ID is not available yet');
      return;
    }
    
    try {
      const response = await fetch(`${API}/api/game-reviews/${id}`);
      
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

  const syncVotes = async () => {
    if (!id) return;
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch(`${API}/api/game-reviews/${id}/votes`, { headers });
      if (!resp.ok) throw new Error('Failed to fetch votes');
      const data = await resp.json();
      setVotes(data);
    } catch (err) {
      console.error('Error fetching votes:', err);
    }
  };

  const handleDeleteReview = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this review?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API}/api/game-reviews/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Delete failed with status ${response.status}`);
      }

      navigate("/game-reviews");
    } catch (error) {
      console.error("Error deleting review:", error);
      window.alert("Unable to delete review. You may not be authorized.");
    }
  };

  useEffect(() => {
    syncGameReviews();
    syncVotes();
  }, [id]);

  const handleVote = async (value) => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // If user already voted same value, remove vote
      if (votes.userVote === value) {
        const resp = await fetch(`${API}/api/game-reviews/${id}/vote`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error('Failed to remove vote');
        const result = await resp.json();
        setVotes(result.totals || { ...votes, userVote: null });
        return;
      }

      const resp = await fetch(`${API}/api/game-reviews/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voteValue: value }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to vote');
      }

      const result = await resp.json();
      setVotes(result.totals || votes);
    } catch (err) {
      console.error('Vote error:', err);
      window.alert('Unable to submit vote.');
    }
  };

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

        <button
          className={votes.userVote === 1 ? 'active up' : ''}
          onClick={() => handleVote(1)}
        >
          👍 {votes.upvotes}
        </button>

        <button
          className={votes.userVote === -1 ? 'active down' : ''}
          onClick={() => handleVote(-1)}
        >
          👎 {votes.downvotes}
        </button>

        {currentUserId === gameReviews.user_id && (
          <button
            onClick={() => navigate(`/writeReviews?edit=1&id=${gameReviews.game_review_id}`)}
          >
            Edit Review
          </button>
        )}

        {currentUserId === gameReviews.user_id && (
          <button
            onClick={handleDeleteReview}
          >
            Delete Review
          </button>
        )}

      </div>

    </div>

  </div>
);

}
