import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./profile.css";

const API = "http://localhost:3000/api";

export default function Profile() {
  const { token } = useAuth();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  
  const [mySteamGames, setMySteamGames] = useState([]);
  const [psnGames, setPsnGames] = useState([]); 
  const [psnName, setPsnName] = useState("");

  useEffect(() => {
    async function getProfile() {
      try {
        const res = await fetch(`${API}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Could not load profile");
        const data = await res.json();
        setUser(data);
      } catch (err) { setError(err.message); }
    }
    if (token) getProfile();
  }, [token]);

  useEffect(() => {
    async function getSteamData() {
      if (!user?.steam_id) return;
      try {
        const res = await fetch(`${API}/steam/${user.steam_id}/owned-games`);
        const data = await res.json();
        // Steam usually nests games in response.games
        const list = data.response?.games || data.games || data || [];
        setMySteamGames(Array.isArray(list) ? list : []);
      } catch (err) { console.error("Steam Error:", err); }
    }
    getSteamData();
  }, [user?.steam_id]);

  useEffect(() => {
    async function getPsnGames() {
      if (!user?.psn_id) return;
      try {
        const res = await fetch(`${API}/playstation/${user.psn_id}/games`);
        const data = await res.json();
        // Sony data often lives in .titles
        const list = data.titles || data || [];
        setPsnGames(Array.isArray(list) ? list : []);
      } catch (err) { console.error("PSN Error:", err); }
    }
    getPsnGames();
  }, [user?.psn_id]);

  const connectSteam = () => window.location.href = `${API}/connections/steam?token=${token}`;
  
  const connectPsn = async () => {
    if (!psnName) return alert("Enter PSN ID");
    try {
      const res = await fetch(`${API}/playstation/search/${psnName}`);
      const data = await res.json();
      const accountId = data?.socialMetadata?.accountId;
      if (accountId) {
        const saveRes = await fetch(`${API}/connections/psn`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ psnId: accountId })
        });
        if (saveRes.ok) window.location.reload();
      }
    } catch (err) { console.error(err); }
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!user) return <p className="loading-text">Loading profile...</p>;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-title">Profile</h1>
        <div className="user-info">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
        <hr />
        
        <h2>Connected Accounts</h2>
        <div style={{ textAlign: "left" }}>
          <p><strong>Steam:</strong> {user.steam_id ? "Connected ✅" : <button onClick={connectSteam} className="auth-button">Connect Steam</button>}</p>
          <p><strong>PlayStation:</strong> {user.psn_id ? "Connected ✅" : 
            <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
              <input value={psnName} onChange={e => setPsnName(e.target.value)} className="auth-input" placeholder="PSN Online ID" style={{width: '200px'}}/>
              <button onClick={connectPsn} className="auth-button" style={{margin: 0, backgroundColor: "#003791"}}>Connect</button>
            </div>
          }</p>
        </div>
        
        <hr />
        <div style={{ display: "flex", justifyContent: "space-between", gap: "40px", textAlign: "left" }}>
          
          {/* STEAM COLUMN */}
          <div style={{ flex: 1 }}>
            <h3 style={{ borderBottom: "1px solid #444", paddingBottom: "10px" }}>My Steam Games</h3>
            <div className="games-list" style={{ marginTop: "15px" }}>
              {mySteamGames.length > 0 ? mySteamGames.slice(0, 15).map((game) => (
                <div key={game.appid} className="steam-game" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <img 
                    src={`https://steampowered.com{game.appid}/${game.img_icon_url}.jpg`} 
                    style={{ width: "24px", height: "24px", borderRadius: "4px" }} 
                    alt=""
                    onError={(e) => e.target.style.visibility = 'hidden'}
                  />
                  <div style={{ fontSize: "14px" }}>
                    <strong>{game.name}</strong>
                    {game.playtime_forever > 0 && (
                      <div style={{ fontSize: "11px", color: "#888" }}>
                        Total: {Math.round(game.playtime_forever / 60)} hrs
                      </div>
                    )}
                  </div>
                </div>
              )) : <p style={{color: "#888"}}>No Steam games found.</p>}
            </div>
          </div>

          {/* PSN COLUMN */}
          <div style={{ flex: 1 }}>
            <h3 style={{ borderBottom: "1px solid #444", paddingBottom: "10px" }}>My PSN Games</h3>
            <div className="games-list" style={{ marginTop: "15px" }}>
              {psnGames.length > 0 ? psnGames.slice(0, 15).map((game) => (
                <div key={game.npCommunicationId || Math.random()} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <img 
                    src={game.image?.url || game.conceptIconUrl || ""} 
                    style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover" }} 
                    alt="" 
                    onError={(e) => e.target.style.visibility = 'hidden'}
                  />
                  <div style={{ fontSize: "14px" }}>
                    {/* Handles name, titleName, or title depending on API structure */}
                    <strong>{game.name || game.titleName || game.title || "Hidden Game"}</strong>
                  </div>
                </div>
              )) : <p style={{color: '#888'}}>{user.psn_id ? "No games found. Check privacy settings." : "Connect PSN to see games"}</p>}
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
