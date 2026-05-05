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

// LootLink ************************************************************************************************
  //Profile Data Fetch - my loot link db profile.
  useEffect(() => {
    async function getProfile() {
      try {
        const res = await fetch(`${API}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

// STEAM ************************************************************************************************
  //Fetch my RECENT steam games
  useEffect(() => {
    async function getRecentSteamGames() {
      if (!user?.steam_id) return;

      try {
        const res = await fetch(`${API}/steam/${user.steam_id}/recent-games`);
        const data = await res.json();
        setRecentSteamGames(data);
      } catch (err) {
        console.error(err);
      }
    }

    getRecentSteamGames();
  }, [user]);


  //Fetch my ALL steam games
  useEffect(() => {
    async function getMySteamGames() {
      if (!user?.steam_id) return;

      try {
        const res = await fetch(`${API}/steam/${user.steam_id}/owned-games`);
        const data = await res.json();
        setMySteamGames(data);
      } catch (err) {
        console.error(err);
      }
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
      setXboxProfile(data.data.content.profileUsers[0]);
    }

    getXboxProfile();
  }, [user]);













//Steam Connection
  const connectSteam = () => {
    window.location.href = `${API}/connections/steam?token=${token}`;
  };
 //Xbox Connection - XBL
  // const connectXbox = async () => {
  //   const xboxRes = await fetch(`${API}/xbox/account`);
  //   const xboxData = await xboxRes.json();
  //   console.log("Xbox data:", xboxData);


  //   const response = await fetch(`${API}/connections/xbox`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${token}`,
  //     },
  //     body: JSON.stringify({
  //       userId: user.user_id,
  //       xboxXuid: xboxData.content.profileUsers[0].id,
  //       xboxGamertag: xboxData.content.profileUsers[0].settings.find(
  //         (s) => s.id === "Gamertag"
  //       ).value,
  //     }),
  //   });

  //   console.log("Xbox response status:", response.status);
  //   window.location.reload();
  // };


  const connectXbox = () => {
    window.location.href = `${API}/connections/xbox?token=${token}`;
  };





  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading profile...</p>;








  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-title">Profile</h1>

        <p>
          <strong>Username:</strong> {user.username}
        </p>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <hr />

        <h2>Connected Accounts</h2>



        {user.xbox_xuid ? (
          <p>
            <strong>Xbox:</strong> Connected ✅
          </p>
        ) : (
          <>
            <p>
              <strong>Xbox:</strong> Not connected
            </p>

            <button className="auth-button" onClick={connectXbox}>
              Connect Xbox
            </button>
          </>
        )}

        {xboxProfile && (
          <div>
            <h3>Xbox Profile</h3>
            <p>
              <strong>Gamertag:</strong>{" "}
              {xboxProfile.settings.find((s) => s.id === "Gamertag")?.value}
            </p>
            <p>
              <strong>Gamerscore:</strong>{" "}
              {xboxProfile.settings.find((s) => s.id === "Gamerscore")?.value}
            </p>
          </div>
        )}







        {user.steam_id ? (
          <p>
            <strong>Steam:</strong> Connected ✅
          </p>
        ) : (
          <>
            <p>
              <strong>Steam:</strong> Not connected
            </p>

            <button className="auth-button" onClick={connectSteam}>
              Connect Steam
            </button>
          </>
        )}

        {games.length > 0 && (
          <div>
            <h3>Recent Games</h3>
            {games.map((game) => (
              <p key={game.appid}>
                {game.name} — {Math.round(game.playtime_2weeks / 60)} hrs
              </p>
            ))}
          </div>
        )}

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

                  {game.rtime_last_played && (
                    <div className="steam-game-meta">
                      Last played:{" "}
                      {new Date(game.rtime_last_played * 1000).toLocaleDateString()}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </section>
    </main>
  );
}