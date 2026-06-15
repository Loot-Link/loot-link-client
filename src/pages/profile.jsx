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

  // ✅ DYNAMIC PLAYSTATION STATE HOOKS: Synchronized perfectly with your schema values
  const [psnUsername, setPsnUsername] = useState("");
  const [psnData, setPsnData] = useState({ level: "1", plats: "0", total: "0" });
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  // LootLink ************************************************************************************************ 
  // Profile Data Fetch 
  useEffect(() => { 
    async function getProfile() { 
      try { 
        const res = await fetch(`${API}/me`, { 
          headers: { Authorization: `Bearer ${token}` }, 
        }); 
        if (!res.ok) throw new Error("Could not load profile"); 
        const data = await res.json(); 
        setUser(data); 

        // ✅ AUTO-POPULATE SHELF ON MOUNT: Fills the card fields if they already have saved data in Postgres
        if (data.psn_username) {
          setPsnUsername(data.psn_username);
          setPsnData({
            level: data.psn_level || "1",
            plats: data.psn_plats || "0",
            total: data.total_trophies || "0"
          });
        }
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
  const connectSteam = () => { 
    window.location.href = `${API}/connections/steam?token=${token}`; 
  }; 

  const connectXbox = () => { 
    window.location.href = `${API}/connections/xbox?token=${token}`; 
  }; 

  const connectBattleNet = () => { 
    window.location.href = `${API}/connections/battlenet?token=${token}`; 
  }; 

  // ✅ NEW PLAYSTATION HANDLER: Safely matches your specific API base path configuration
  const handlePsnImport = async (e) => {
    e.preventDefault();
    if (!psnUsername.trim()) return;
    
    try {
      setSyncing(true);
      setSyncError("");
      
      const response = await fetch(`${API}/users/import-psn-stats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ psnUsername: psnUsername.trim() })
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Could not find profile on PSNProfiles");
      }
      
      const result = await response.json();
      
      // Extract the row array records from the backend database response envelope
      if (result.profile && result.profile.length > 0) {
        const u = result.profile[0];
        setPsnData({
          level: u.psn_level || "1",
          plats: u.psn_plats || "0",
          total: u.total_trophies || "0"
        });
        
        // Keep your global user context profile completely fresh in memory
        setUser(prev => ({ ...prev, ...u }));
      }
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (error) return <p className="app-shell">{error}</p>; 
  if (!user) return <p className="app-shell">Loading profile...</p>; 

  console.log(user); 
  console.log("mySteamGames:", mySteamGames);
    return (
    <main className="profile-page">
      <section className="profile-card">
        <h1 className="profile-title">Profile</h1>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        
        <hr />
        
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

          {/* ✅ MERGED PLAYSTATION PROFILE SYNC SECTION */}
          <div className="profile-platform">
            <h3>PlayStation Network</h3>
            {user.psn_username ? (
              <p className="connected">Connected ✅ (@{user.psn_username})</p>
            ) : (
              <p className="not-connected">Not connected</p>
            )}
            
            <form onSubmit={handlePsnImport} style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              <input
                type="text"
                className="profile-form-input"
                style={{ padding: "6px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", color: "#fff", fontSize: "0.85rem" }}
                placeholder="PSN Online ID (e.g., GhostSniper_99)"
                value={psnUsername}
                onChange={(e) => setPsnUsername(e.target.value)}
                disabled={syncing}
              />
              <button 
                type="submit" 
                className="profile-button" 
                style={{ width: "100%", padding: "6px 0" }} 
                disabled={syncing}
              >
                {syncing ? "Syncing..." : "Import Trophies"}
              </button>
            </form>

            {syncError && <p style={{ color: "#ff4a4a", fontSize: "0.75rem", marginTop: "6px", margin: 0 }}>⚠️ {syncError}</p>}
          </div>
        </div>

        {/* ✅ DYNAMIC TROPHY DISPLAY SHELF: Renders live metrics directly inside Connected Accounts */}
        {(user.psn_username || psnData.total !== "0") && (
          <div className="profile-subsection" style={{ background: "rgba(0,0,0,0.15)", padding: "16px", borderRadius: "8px", marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", textAlign: "center" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#72768d", display: "block", marginBottom: "4px" }}>PSN LEVEL</span>
              <strong style={{ fontSize: "1.2rem", color: "#fff" }}>⭐ {psnData.level}</strong>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#72768d", display: "block", marginBottom: "4px" }}>PLATINUMS</span>
              <strong style={{ fontSize: "1.2rem", color: "#d4af37" }}>🏆 {psnData.plats}</strong>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#72768d", display: "block", marginBottom: "4px" }}>TOTAL TROPHIES</span>
              <strong style={{ fontSize: "1.2rem", color: "#4f7cff" }}>🎮 {psnData.total}</strong>
            </div>
          </div>
        )}

        {mySteamGames.length > 0 && (
          <div className="steam-games" style={{ marginTop: "30px" }}>
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
