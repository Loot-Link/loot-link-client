import { useEffect, useState, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import "./sessiondetails.css";

const API = "http://localhost:3000/api";

export default function SessionDetails() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [session, setSession] = useState({});
  const [sessionUsers, setSessionUsers] = useState([]);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserID, setSelectedUserID] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [addUserError, setAddUserError] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);


  // 4. Fetch Users for dropdown
  const syncSetAllUsers = async () => {
    try {
      const response = await fetch(`${API}/users/dropdown`, {
        headers: {
        Authorization: `Bearer ${token}`,
        }
      });
      const data = await response.json();
      setAllUsers(data);
    } catch (err) {
      console.error("Failed to fetch users for dropdown", err);
    }
  };  



  // 1. Session Data Fetch
  const syncSession = async () => {
    try {
      const response = await fetch(`${API}/sessions/${sessionId}`);
      const data = await response.json();
      setSession(data);
    } catch (err) {
      console.error("Failed to sync session:", err);
    }
  };

  // 2. Session Users Fetch (Updated to monitor roster joins)
  const syncSessionUsers = async () => {
    try {
      const response = await fetch(`${API}/sessions/${sessionId}/users`);
      const data = await response.json();
      
      // NEW SYSTEM TRIGGER: If a new teammate arrives, send a desktop push notification
      if (sessionUsers.length > 0 && data.length > sessionUsers.length && isLobbyHost) {
        const latestJoiner = data[data.length - 1]; // Grabs details for the incoming user
        
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("🎯 Loot Link: Teammate Acquired!", {
            body: `${latestJoiner.username} has just joined your active ${session.game_title || 'Game'} squad!`,
            icon: session.cover_image_url || "/vite.svg"
          });
        }
      }
      
      setSessionUsers(data);
    } catch (err) {
      console.error("Failed to sync users:", err);
    }
  };
  
  // 3. Session Messages Fetch
  const syncSessionMessages = async () => {
    try {
      const response = await fetch(`${API}/session-messages/${sessionId}`);
      if (!response.ok) throw Error("Failed to fetch messages");
      const data = await response.json();
      setSessionMessages(data);
    } catch (err) {
      console.error("Message sync error:", err);
    }
  };

  // 4. Isolated Ready List Status Fetch
  const syncReadyCheckList = async () => {
    try {
      const response = await fetch(`${API}/sessions/${sessionId}/ready-list`);
      if (response.ok) {
        const data = await response.json();
        const activeReadyIds = data.readyUserIds || [];
        setReadyUsers(activeReadyIds);
        
        // Auto-launch countdown if all active joined players have clicked ready
        const everyoneReady = sessionUsers.length >= 2 && sessionUsers.every(u => activeReadyIds.includes(Number(u.user_id)));
        
        if (everyoneReady && countdown === null) {
          startLobbyCountdown();
        } else if (!everyoneReady && countdown !== null) {
          clearInterval(countdownTimerRef.current);
          setCountdown(null);
        }
      }
    } catch (err) {
      console.error("Ready data mapping error:", err);
    }
  };

  // Countdown timer clock loop
  const startLobbyCountdown = () => {
    setCountdown(10);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          alert("🚀 MATCH STARTING! Game synchronization complete.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Synchronizes all background data every 3 seconds
  useEffect(() => {
    const init = async () => {
      await syncSession();
      await syncSessionUsers();
      await syncSessionMessages();
      await syncSetAllUsers();
    };
    init();

    const interval = setInterval(() => {
      syncSessionUsers();
      syncReadyCheckList(); 
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownTimerRef.current);
    };
  }, [sessionId, countdown, sessionUsers.length]);

  // Auto-scroll chat tracker
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessionMessages]);

  // Handle Sending Message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const response = await fetch(`${API}/session-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          message_text: newMessage
        })
      });
      if (response.ok) {
        setNewMessage("");
        await syncSessionMessages();
      }
    } catch (err) {
      console.error("Send error:", err);
    }
  };



  // Handle Add User to Session
  const handleAddUserToSession = async () => {
    if (!selectedUserID) return;
    
    try {
      const response = await fetch(`${API}/sessions/${sessionId}/addUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          user_id: selectedUserID
          
        })
      });

      if (response.ok) {
        //setNewMessage("");
        await syncSessionUsers();
        setAddUserError("");
        setUserSearch("");
        setSelectedUserID("");
      }
      if (!response.ok) {
        const errorText = await response.text();
        setAddUserError(errorText);
        return;
      }
    } catch (err) {
      //console.error("error adding user to session:", err);
      console.error(err);
      setAddUserError(err.message);
    }
  };








  const currentUserId = user?.user_id ?? user?.id;
// console.log("allUsers:", allUsers);
// console.log("userSearch:", userSearch);
// console.log("selectedUserID:", selectedUserID);
  
  return (
    <div className="session-details-page">

      <div className="session-hero">
        <img
          className="session-hero-image"
          src={session.cover_image_url}
          alt={session.game_title}
        />

        <div className="session-hero-overlay">
          <h1 className="session-title">
            {session.session_title}
          </h1>

          <h2 className="session-game-title">
            {session.game_title}
          </h2>

          <p className="session-description">
            {session.session_description}
          </p>
        </div>
      </div>





      <div className="session-content">

        <aside className="session-users-panel">
          <h3 className="session-users-heading">
            Session Players
          </h3>

          {sessionUsers.map((user) => (
            <div
              key={user.user_id}
              className="session-user-card"
            >
              <div className="session-user-avatar" />

              <div className="session-user-info">
                <div className="session-username">
                  {user.username}
                  {user.is_host && <span className="host-badge"> Host</span>}
                </div>

                <div className="session-user-status">
                  {user.membership_status}
                </div>
              </div>
            </div>
          ))}

          <div>Add User to Session:</div>
          <input
            className=""
            type="text"
            value={userSearch}
            onChange={(event) => {
              setUserSearch(event.target.value);
              setShowUserDropdown(true);
            }}
            placeholder="Search users..."
          />
          {showUserDropdown && (
          <div>
            {allUsers
              .filter(
                (user) =>
                  userSearch.trim() !== "" &&
                  user.username.toLowerCase().includes(userSearch.toLowerCase() 
                  
                )
              )
              .map((user) => (
                <div
                  key={user.user_id}
                  onClick={() => {
                    setSelectedUserID(user.user_id);
                    setUserSearch(user.username);
                    setShowUserDropdown(false);
                  }}
                >
                  {user.username}
                </div>
              ))}
            </div>
          )}

          <button onClick={handleAddUserToSession}>Add User to Session</button>
          {addUserError && (
            <div className="add-user-error">
              {addUserError}
            </div>
          )}

        </aside>



        <main className="session-main-panel">

          <div className="session-status-card">
            <span>Status:</span>
            <strong>{session.session_status}</strong>
          </div>

          <div className="session-chat-container">

            <div className="session-chat-messages">
              {user &&
                sessionMessages.map((msg) => (
                  <div
                    key={msg.session_message_id}
                    className={`chat-message ${
                      Number(msg.user_id) === Number(currentUserId) ? "own-message" : ""
                    }`}
                  >



                  <div className="chat-message-avatar" />

                  <div className="chat-message-content">
                    <div className="chat-message-header">
                      <span className="chat-username">{msg.username}</span>
                      <span className="chat-time">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="chat-message-text">
                      {msg.message_text}
                    </div>
                  </div>

                </div>
              ))}
            </div>

            <div className="session-chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
