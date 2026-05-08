import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./profile.css";

const API = "http://localhost:3000/api";

export default function Profile() {
  const { token } = useAuth();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  
  const [mySteamGames, setMySteamGames] = useState([]);
  const [xboxProfile, setXboxProfile] = useState(null);

// LootLink ************************************************************************************************
  //Profile Data Fetch - my loot link db profile.
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

// STEAM ************************************************************************************************
  //Fetch my RECENT steam games
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

    getMySteamGames();
  }, [user]);



// XBOX ************************************************************************************************
  useEffect(() => {
    async function getXboxProfile() {
      if (!user?.xbox_xuid) return;

      const res = await fetch(`${API}/xbox/${user.xbox_xuid}/profile`);
      const data = await res.json();
      console.log("Xbox profile response:", data);
      // setXboxProfile(data.data.content.profileUsers[0]);
      
      setXboxProfile(data?.data?.profileUsers?.[0] || data?.data?.content?.profileUsers?.[0]);
    }

    getXboxProfile();
  }, [user]);













//Steam Connection
  const connectSteam = () => {
    window.location.href = `${API}/connections/steam?token=${token}`;
  };


  const connectXbox = () => {
    window.location.href = `${API}/connections/xbox?token=${token}`;
  };


  const connectBattleNet = () => {
    window.location.href = `${API}/connections/battlenet?token=${token}`;
  };


  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading profile...</p>;








  return (
    <main className="profile-page">
      <section className="profile-card">
        <h1 className="profile-title">Profile</h1>

        <p>
          <strong>Username:</strong> {user.username}
        </p>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <hr />

        {/* <h2>Connected Accounts</h2> */}


        <h2 className="profile-section-title">Connected Accounts</h2>

        <div className="profile-platforms">
          <div className="profile-platform">
            <h3>Battle.net</h3>
            <button className="profile-button" onClick={connectBattleNet}>
              Connect BNET
            </button>
          </div>

          <div className="profile-platform">
            <h3>Xbox</h3>

            {user.xbox_xuid ? (
              <p className="connected">Connected ✅</p>
            ) : (
              <>
                <p className="not-connected">Not connected</p>
                <button className="profile-button" onClick={connectXbox}>
                  Connect Xbox
                </button>
              </>
            )}

            {xboxProfile && (
              <div className="profile-subsection">
                <p><strong>Gamertag:</strong> {xboxProfile.settings.find((s) => s.id === "Gamertag")?.value}</p>
                <p><strong>Gamerscore:</strong> {xboxProfile.settings.find((s) => s.id === "Gamerscore")?.value}</p>
              </div>
            )}
          </div>

          <div className="profile-platform">
            <h3>Steam</h3>

            {user.steam_id ? (
              <p className="connected">Connected ✅</p>
            ) : (
              <>
                <p className="not-connected">Not connected</p>
                <button className="profile-button" onClick={connectSteam}>
                  Connect Steam
                </button>
              </>
            )}

            {games.length > 0 && (
              <div className="profile-subsection">
                <h4>Recent Games</h4>
                {games.map((game) => (
                  <p key={game.appid}>
                    {game.name} — {Math.round(game.playtime_2weeks / 60)} hrs
                  </p>
                ))}
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

                  <div className="steam-game-meta">
                    Total: {Math.round(game.playtime_forever / 60)} hrs
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
