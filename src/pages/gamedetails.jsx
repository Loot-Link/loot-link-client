import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useParams  } from "react-router-dom";
import "./gamedetails.css";

const API = import.meta.env.VITE_API;
// const API = "import.meta.env.VITE_API";

export default function GameDetails() {
  const [gameDetails, setGameDetails] = useState(null);

  const { gameId } = useParams();

  const syncGameDetails = async () => {
    // Guard against undefined id
    if (!gameId) {
      console.warn('Game ID is not available yet');
      return;
    }    
    try {
      const response = await fetch(`${API}/api/games/${gameId}`);
      
      // Check if response is ok before parsing
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(data);
      setGameDetails(data);
    } catch (error) {
      console.error('Error fetching game review:', error);
    }
  };

  useEffect(() => {
    syncGameDetails();
  }, [gameId]); // Add id as dependency


  
  // console.log("filtered:", filteredGameReviews);
  if (!gameDetails) return <p>Loading game...</p>;

  return (
    <main className="game-details-page">
      <img
        src={gameDetails.cover_image_url}
        alt={gameDetails.game_title}
      />

      <h1>{gameDetails.game_title}</h1>

      <p>{gameDetails.game_description}</p>

      <p>Genre: {gameDetails.genre}</p>

      <p>Developer: {gameDetails.category}</p>

      <p>game id: {gameDetails.game_id}</p>

      <p>Rating: {gameDetails.avg_rating}</p>

      <Link to={`/sessions?gameId=${gameDetails.game_id}`}>
        View Sessions
      </Link>
      <div>
        
      </div>
      <Link to={`/writeReviews?gameId=${gameDetails.game_id}`}>
        Write a Review
      </Link>
    </main>
  );

}
