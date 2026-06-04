import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./profile.css";

const API = "http://localhost:3000/api";

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

  // LootLink ************************************************************************************************
  const handleOpenEdit = ()=>{
    setFormData({
      date_of_birth: user?.date_of_birth ? user.date_of_birth.split("T")[0] : "",
      gender: user?.gender || "",
      bio: user?.bio || ""
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () =>{
    const response = await fetch(`${API}/users/me`, {
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
    console.log("Front end: ", data)
    setUser(data);
    setIsEditing(false);
  }


  // Profile Data Fetch
  useEffect(() => {
    async function getProfile() {
      try {
        const res = await fetch(`${API}/users/me`, {
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

  // Fetch My Active Sessions
  useEffect(() => {
    async function getMySessions() {
      try {
        // This hits the route that calls getSessionsByUserId
        const res = await fetch(`${API}/sessions/user/me`, {
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
        const res = await fetch(`${API}/steam/${user.steam_id}/recent-games`);
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
        const res = await fetch(`${API}/steam/${user.steam_id}/owned-games`);
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
      const res = await fetch(`${API}/xbox/${user.xbox_xuid}/profile`);
      const data = await res.json();
      setXboxProfile(data?.data?.profileUsers?.[0] || data?.data?.content?.profileUsers?.[0]);
    }
    getXboxProfile();
  }, [user?.xbox_xuid]);

  // Handlers
  const connectSteam = () => { window.location.href = `${API}/connections/steam?token=${token}`; };
  const connectXbox = () => { window.location.href = `${API}/connections/xbox?token=${token}`; };
  const connectBattleNet = () => { window.location.href = `${API}/connections/battlenet?token=${token}`; };

  if (error) return <p className="app-shell">{error}</p>;
  if (!user) return <p className="app-shell">Loading profile...</p>;

console.log(user);
console.log("mySteamGames:", mySteamGames);
  return (
    <main className="profile-page">
      <section className="profile-card">
        <div>
          <h1 className="profile-title">Profile</h1>
          <button className="edit-profile-btn" onClick={handleOpenEdit}>Edit Profile</button>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
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
                <option value="Non-binary">Non-binary</option>
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
            <button className="profile-button" onClick={connectBattleNet}>Connect BNET</button>
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
