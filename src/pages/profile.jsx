import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./profile.css";

const API = import.meta.env.VITE_API;

export default function Profile() {
  const { token } = useAuth();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [games, setRecentSteamGames] = useState([]);
  const [mySteamGames, setMySteamGames] = useState([]);
  const [xboxProfile, setXboxProfile] = useState(null);
  const [mySessions, setMySessions] = useState([]); // Added for Active Sessions
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({date_of_birth: "", gender: "", bio: ""});
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // LootLink ************************************************************************************************

  // Profile Data Fetch
  useEffect(() => {
    async function getProfile() {
      try {
        const res = await fetch(`${API}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Could not load profile");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      }
    }
    if (token) getProfile();
  }, [token]);
//Fetch list of favorite games
  useEffect(() => {
    async function fetchFavorite(){
      try {
        const response = await fetch(`${API}/api/users/${user?.user_id}/favorites`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setFavorites(data);
        }
      } catch (error) {
        console.error("Failed to load favorite games:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.user_id) {
      fetchFavorite();
    }
  }, [user, token]);

  // Fetch My Active Sessions
  useEffect(() => {
    async function getMySessions() {
      try {
        // This hits the route that calls getSessionsByUserId
        const res = await fetch(`${API}/api/sessions/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setMySessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Sessions Error:", err);
      }
    }
    if (token) getMySessions();
  }, [token]);

  // STEAM ************************************************************************************************
  useEffect(() => {
    async function getRecentSteamGames() {
      if (!user?.steam_id) return;
      try {
        const res = await fetch(`${API}/api/steam/${user.steam_id}/recent-games`);
        const data = await res.json();
        // Steam API usually nests the array in response.games
        setRecentSteamGames(data.response?.games || []);
      } catch (err) {
        console.error(err);
      }
    }
    getRecentSteamGames();
  }, [user?.steam_id]);

  useEffect(() => {
    async function getMySteamGames() {
      if (!user?.steam_id) return;
      try {
        const res = await fetch(`${API}/api/steam/${user.steam_id}/owned-games`);
        const data = await res.json();
        // setMySteamGames(data.response?.games || []);
        setMySteamGames(data.response?.games || data.games || data || []);
      } catch (err) {
        console.error(err);
      }
    }
    getMySteamGames();
  }, [user?.steam_id]);

  // XBOX ************************************************************************************************
  useEffect(() => {
    async function getXboxProfile() {
      if (!user?.xbox_xuid) return;
      const res = await fetch(`${API}/api/xbox/${user.xbox_xuid}/profile`);
      const data = await res.json();
      setXboxProfile(data?.data?.profileUsers?.[0] || data?.data?.content?.profileUsers?.[0]);
    }
    getXboxProfile();
  }, [user?.xbox_xuid]);

  // Handlers
  const connectSteam = () => { window.location.href = `${API}/api/connections/steam?token=${token}`; };
  const connectXbox = () => { window.location.href = `${API}/api/connections/xbox?token=${token}`; };
  const connectBattleNet = () => { window.location.href = `${API}/api/connections/battlenet?token=${token}`; };  
  const handleSaveProfile = async () =>{
    const response = await fetch(`${API}/api/users/me`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    if(!response.ok){
      alert("Failed to update");
    }
    setUser(data);
    setIsEditing(false);
  };

  const handleOpenEdit = ()=> {
    setFormData({
      date_of_birth: user?.date_of_birth ? user.date_of_birth.split("T")[0] : "",
      gender: user?.gender || "",
      bio: user?.bio || ""
    });
    setIsEditing(true);
  };

const handleFavoriteToggle = async (e, game) => {
  e.preventDefault(); 
  try {
    const response = await fetch(`${API}/api/users/${user.id}/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ game_id: game.game_id }),
    });

    if (response.ok) {
      const updatedList = await response.json();
      setFavorites(updatedList);
    }
  } catch (err) {
    console.error("Failed to toggle favorite status:", err);
  }
};

  if (error) return <p className="app-shell">{error}</p>;
  if (!user) return <p className="app-shell">Loading profile...</p>;

console.log(user);
console.log("mySteamGames:", mySteamGames);
  return (
    <main className="profile-page">
      <section className="profile-card">
        <div className="profile-infor-display">
          <h1 className="profile-title">Profile</h1>
          <button className="edit-profile-btn" onClick={handleOpenEdit}>Edit Profile</button>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Gender:</strong> {user.gender || "Not Specified"}</p>
          <p><strong>Birthday:</strong> {user.date_of_birth ? 
            new Date(user.date_of_birth).toLocaleDateString() : "Not specified"}</p>
          <p><strong>Bio:</strong> {user.bio || "No Bio added yet. Tell people a bit about yourself!"}</p>
          {isEditing && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Edit Profile Details</h2>
          
          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select 
                id="gender"
                value={formData.gender} 
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dob">Date of Birth</label>
              <input 
                id="dob"
                type="date" 
                value={formData.date_of_birth} 
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Short Bio</label>
              <textarea 
                id="bio"
                rows="4"
                maxLength="300"
                placeholder="Write a short bio..."
                value={formData.bio} 
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="profile-button">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    <div className="profile-section favorites-section">
  <h2 className="profile-section__title">Favorite Games</h2>
  
  {loading ? (
    <p>Loading favorites...</p>
  ) : (!Array.isArray(favorites) || favorites.length === 0) ? (
  <p className="no-data-text">No favorite games added yet!</p>
) : (
    <ul className="games-catalog__list">
      {favorites.slice(0, 5).map((game) => (
        <li className="games-catalog__item" key={game.game_id}>
            <div className="game-card">
              <Link to={`/games/${game.game_id}`}>
                <div className="game-card__image-wrap">
                  <img
                    className="game-card__image"
                    src={game.cover_image_url}
                    alt={game.game_title}
                  />
                  <button 
                    className="game-card-fav-btn"
                    onClick={(e) => handleFavoriteToggle(e, game)}
                  >
                    {Array.isArray(favorites) && favorites.some(fav => fav.game_id === game.game_id) 
                      ? "★" 
                      : "☆"}
                  </button>
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
                        {game.genre && <span className="game-card__meta-item">{game.genre}</span>}
                        {game.category && <span className="game-card__meta-item">{game.category}</span>}
                      </div>
                      
                      {game.game_description && (
                        <p className="game-card__description">{game.game_description}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
          <hr />
        </div>

        <h2 className="profile-section-title">My Active Sessions</h2>
        <div className="profile-sessions">
          {mySessions.length > 0 ? (
            <div className="steam-games">
              {mySessions.map((session) => (
                <div key={session.session_id} className="steam-game">
                  <div className="steam-game-info">
                    <strong>{session.session_title}</strong>
                    <div className="steam-game-meta">Status: {session.session_status}</div>
                  </div>
                  <button 
                    className="profile-button" 
                    style={{ width: 'auto', padding: '4px 12px' }}
                    onClick={() => window.location.href = `/sessions/${session.session_id}`}
                  >
                    Enter Lobby
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="not-connected">You aren't in any active sessions.</p>
          )}
        </div>

        <hr />
        <h2 className="profile-section-title">Connected Accounts</h2>
        <div className="profile-platforms">
          <div className="profile-platform">
            <h3>Battle.net</h3>
            {user.battle_net_id ? <p className="connected"> Connected ✅</p> : ( 
            <>
              <p className="not-connected">Not connected</p>
              <button className="profile-button" onClick={connectBattleNet}>Connect BNET</button>
            </> )}
          </div>
          <div className="profile-platform">
            <h3>Xbox</h3>
            {user.xbox_xuid ? <p className="connected">Connected ✅</p> : (
              <>
                <p className="not-connected">Not connected</p>
                <button className="profile-button" onClick={connectXbox}>Connect Xbox</button>
              </>
            )}
            {xboxProfile && (
              <div className="profile-subsection">
                <p><strong>Gamertag:</strong> {xboxProfile.settings.find((s) => s.id === "Gamertag")?.value}</p>
              </div>
            )}
          </div>
          <div className="profile-platform">
            <h3>Steam</h3>
            {user.steam_id ? <p className="connected">Connected ✅</p> : (
              <>
                <p className="not-connected">Not connected</p>
                <button className="profile-button" onClick={connectSteam}>Connect Steam</button>
              </>
            )}
            {games.length > 0 && (
              <div className="profile-subsection">
                <h4>Recent Games</h4>
                {games.map((g) => <p key={g.appid}>{g.name} — {Math.round(g.playtime_2weeks / 60)} hrs</p>)}
              </div>
            )}
          </div>
        </div>

        

        {mySteamGames.length > 0 && (
          <div className="steam-games">
            <h3>My Steam Games</h3>
            {mySteamGames.slice(0, 10).map((game) => (
              <div key={game.appid} className="steam-game">
                {game.img_icon_url && (
                  <img 
                    className="steam-game-icon" 
                    src={`https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`} 
                    alt={game.name} 
                  />
                )}
                <div className="steam-game-info">
                  <strong>{game.name}</strong>
                  <div className="steam-game-meta">Total: {Math.round(game.playtime_forever / 60)} hrs</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
    </main>
  );
}
