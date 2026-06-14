import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./home.css";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [liveSessions, setLiveSessions] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [featuredGame, setFeaturedGame] = useState(null);
  const [_loading, setLoading] = useState(true);
  const API = import.meta.env.VITE_API;

  useEffect(() => {
    async function loadLivePlatformData() {
      try {
        // 1. Fetch your live database sessions (which already includes game names and images via SQL JOIN)
        const response = await fetch(`${API}/api/sessions`);
        if (!response.ok) throw new Error("Database offline");
        const data = await response.json();
        setLoading(false);

        // Take the first 3 active rooms for your "Live Sessions" section grid
        const liveRooms = data.slice(0, 3).map(session => ({
          id: session.session_id,
          title: session.game_title || "LFG Lobby",
          desc: session.session_title || "Active Matchmaking Lobby",
          
          // ✅ FIXED: Takes host_username straight from your database join query fields
          host: session.host_username || "Admin",
          
          count: `${session.current_user_count || 1} / ${session.max_users || 4}`,
          style: session.playstyle || "Casual",
          banner: session.cover_image_url 
        }));
        setLiveSessions(liveRooms);

        if (liveRooms.length > 0) {
          const randomGame = liveRooms[Math.floor(Math.random() * liveRooms.length)];
          setFeaturedGame(randomGame);
        }

        // Take the next 3 scheduled rooms for your "Upcoming Sessions" timeline strip rows
        const upcomingRooms = data.slice(3, 6).map(session => ({
          id: session.session_id,
          game: session.game_title || "Co-Op Play",
          title: session.session_title || "Squad Up",
          starts: "Active Now",
          slots: `${session.current_user_count || 1} / ${session.max_users || 4}`,
          isFull: Number(session.current_user_count) >= Number(session.max_users),
          image: session.cover_image_url 
        }));
        setUpcomingSessions(upcomingRooms);

        // 3. Dynamic Sidebar Recommendations Matrix - ALIGNED WITH REAL SQL KEYS
        const recommendedRooms = data.slice(6, 10).map(session => ({
          id: session.session_id,
          title: session.game_title || "Recommended Game",
          subtitle: session.session_title || "Squad Up Roster",
          time: "Today " + (session.playstyle || "Active Now"),
          isFull: Number(session.current_user_count) >= Number(session.max_users),
          cover: session.cover_image_url,
          meter: session.playstyle === "Ranked" ? "⭐⭐⭐⭐⭐" : "⭐⭐⭐⭐"
        }));
        setRecommendations(recommendedRooms);

        // 4. Dynamic Sidebar Real Friends List Fetch Request
        const friendsResponse = await fetch(`${API}/api/friendslist`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`, 
          },
        });
        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          setFriends(Array.isArray(friendsData) ? friendsData.slice(0, 3) : []);
        }

      } catch (err) {
        console.error("⚠️ Dashboard API sync paused, using production fail-safes:", err.message);
        setLiveSessions([
          { id: 1, title: "Overwatch 2", desc: "Chill Battle Royale squad run", host: "maverikk", count: "3 / 4", style: "Casual"  },
          { id: 2, title: "Rocket League", desc: "Ranked 3v3 Arena matches", host: "TurboCopter", count: "3 / 3", style: "Ranked" }
        ]);
        setLoading(false);
      }
    }

    loadLivePlatformData();
  }, []);

   return (
    <div className="dashboard-homepage">
      
      {/* DASHBOARD HERO SECTION */}

      <section
        className="dashboard-hero-billboard"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(0,0,0,.65),
              rgba(0,0,0,.75)
            ),
            url(${featuredGame?.banner })
          `
        }}
      >
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-badge">
              🎮 {featuredGame?.style || "Live Matchmaking"}
            </span>

            <h1 className="hero-title">
              {featuredGame?.title || "Find Your Squad"}
            </h1>
            {featuredGame?.desc && (
              <div
                style={{
                  color: "#4f7cff",
                  fontWeight: 700,
                  marginBottom: "12px"
              }}
            >
              {featuredGame.desc}
              </div>
      )}

            <p className="hero-subtitle">
              Join the action in{" "}
              {featuredGame?.title || "your favorite game"} and
              connect with players looking for a team.
            </p>

            <div className="hero-actions">
              <button
                className="hero-primary-btn"
                onClick={() => navigate("/games")}
              >
                Find Your Game
              </button>

              <button
                className="hero-secondary-btn"
                onClick={() => navigate("/sessions")}
              >
                Browse Sessions
              </button>
            </div>
          </div>

          <div className="hero-stats">
            <div className="hero-stat-card">
              <h3>{liveSessions.length}+</h3>
              <span>Live Sessions</span>
            </div>

            <div className="hero-stat-card">
              <h3>{upcomingSessions.length}+</h3>
              <span>Upcoming Events</span>
            </div>

            <div className="hero-stat-card">
              <h3>24/7</h3>
              <span>Matchmaking</span>
            </div>
          </div>
        </div>
      </section>


      <div className="dashboard-grid-layout">
        <div className="main-content-column">
          
          {/* RENDER ROW 1: LIVE LOBBY ACTIVE CARDS MATRIX */}
          <div className="section-block">
            <div className="section-header-row">
              <h2 className="section-title-label">Live Sessions</h2>
              <span className="ticker-alert">Updated seconds ago ×</span>
            </div>
            
            <div className="live-sessions-matrix-grid">
              {liveSessions.map((session) => (
                <div key={session.id} className="live-lobby-card">
                  <div className="card-media-frame">
                    <img 
                      src={session.banner } 
                      alt="Lobby Art" 
                      className="card-cover-photo" 
                      
                    />
                    <button className="card-join-now-overlay-btn" onClick={() => navigate(`/sessions/${session.id}`)}>Join Now</button>
                  </div>
                  <div className="card-body-content">
                    <h3 className="card-game-title-text">{session.title}</h3>
                    <p className="card-lobby-description-text">{session.desc}</p>
                    
                    <div className="card-metadata-footer-row">
                      <div className="host-profile-block-row">
                        <div className="host-mini-avatar-node" />
                        <span className="host-username-text">
                          {session.host || "Admin"}
                      </span>
                      </div>
                      <div className="count-badge-column-alignment">
                        <span className="headcount-fraction-digits">{session.count} 👥</span>
                        <span className={`style-pill-tag style-pill-tag--${session.style.toLowerCase()}`}>{session.style}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* SECTION 2: UPCOMING HORIZONTAL TIMELINE ROWS */}
        <div className="section-block" style={{ marginTop: "40px" }}>
          <h2 className="section-title-label" style={{ marginBottom: "20px" }}>Upcoming Sessions</h2>
          <div className="upcoming-rows-container">
            {upcomingSessions.map((item) => (
              <div key={item.id} className="upcoming-session-strip-row">
                
                <div className="strip-media-block">
                  <img 
                    src={item.image} 
                      alt="Game Thumb" 
                      className="strip-thumb-photo" 
                     
                  />
                  <h4 className="strip-game-name-text">{item.game}</h4>
                  <h3 className="strip-lobby-title-text">{item.title}</h3>
                  <span className="strip-timer-countdown-tag">{item.starts}</span>
                </div>
                
                <div className="strip-controls-alignment-row">
                  <div className="strip-fraction-indicator-block">
                    <span className="strip-fraction-numbers-label">{item.slots}</span>
                    <span className="strip-sub-text-fraction-caption">Players</span>
                  </div>
                  {!item.isFull ? (
                    <button className="strip-action-rsvp-btn" onClick={() => navigate("/sessions")}>RSVP</button>
                  ) : (
                    <button className="strip-action-full-btn" disabled>✔ FULL</button>
                  )}
                </div>

              </div> // Closes the individual upcoming-session-strip-row card cleanly!
            ))}
          </div>
        </div>
        </div>
               {/* RIGHT COLUMN SIDEBAR COMPONENT NODE CONTAINER */}
        <aside className="sidebar-recommendations-column">
          
          {/* COMPACT USER PROFILE CARD */}
          <div className="sidebar-profile-card">
            <div className="profile-card-avatar-wrapper">
              <div className="profile-card-avatar" />
              <span className="profile-online-glow-dot" />
            </div>
            <div className="profile-card-info">
              {user?.username || localStorage.getItem("username") ? (
                <>
                  <h3 className="profile-card-username">
                    {user?.username || localStorage.getItem("username")}
                  </h3>
                <p className="profile-card-rank">🏆 Tier 1 Leader</p>
              </>
            ) : (
              <>
                <h3 className="profile-card-username">Guest</h3>
                <p className="profile-card-rank">Please log in</p>
              </>
          )}
        </div>
          </div>

          <div className="sidebar-friends-card">
            <h3 className="sidebar-sub-section-title">Online Friends ({friends.length})</h3>
            <div className="friends-list-stack">
              
              {/* SAFE FALLBACK CONTAINER LAYER */}
              {friends.length === 0 ? (
                <span style={{ fontSize: "0.8rem", color: "#72768d", fontStyle: "italic" }}>
                  No online friends found. Add players on the Friends tab!
                </span>
              ) : (
                // DYNAMIC LOOP: Binds your live PostgreSQL relational rows natively to your markup columns
                friends.map((friend) => (
                  <div key={friend.session_id || friend.id || friend.username} className="friend-list-item" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <img 
                      src={friend.avatar_url} 
                      alt={friend.username}
                      className="friend-avatar-node" 
                      style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} 
                      
                    />
                    <div className="friend-item-info" style={{ display: "flex", flexDirection: "column" }}>
                      <span className="friend-item-name" style={{ fontSize: "0.85rem", fontWeight: "700" }}>
                        {friend.username || "Operator"}
                      </span>
                      <span className="friend-item-activity" style={{ fontSize: "0.75rem", color: "#00ff66", fontWeight: "600" }}>
                        ● Online
                      </span>
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>

          {/* RECOMMENDATIONS MATRIX HUB CONTAINER */}
          <h2 className="sidebar-sub-section-title" style={{ marginTop: "20px", marginBottom: "15px" }}>Recommended for You</h2>
          <div className="recommendations-sidebar-list-stack">
            {recommendations.map((rec) => (
              <div key={rec.id} className="sidebar-recommendation-item-card">
                <div className="rec-info-left-group">
                  <img 
                    src={rec.cover} 
                    alt="Recommendation Cover" 
                    className="rec-avatar-placeholder-art" 
   
                  />
                  <h4 className="rec-game-title-header">{rec.title}</h4>
                  <p className="rec-lobby-subtitle-caption">{rec.subtitle}</p>
                  <span className="rec-timestamp-calendar-label">{rec.time}</span>
                </div>

                <div className="rec-controls-right-group">
                  {/* CLEAN FIXED METER BLOCK: Simple character string bypassing coworker bracket traps */}
                  <span style={{ color: "#2b55f5", fontSize: "0.85rem", letterSpacing: "1px", fontWeight: "800" }}>{rec.meter}</span>
                  {!rec.isFull ? (
                    <button className="rec-sidebar-action-rsvp-btn" onClick={() => navigate("/sessions")}>RSVP</button>
                  ) : (
                    <button className="rec-sidebar-action-full-btn" disabled>FULL</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
    );
  }