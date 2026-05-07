import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";

import "./sessiondetails.css";
//client/src/pages/Sessions.css
const API = "http://localhost:3000/api";



export default function SessionDetails() {
  // const [viewMode, setViewMode] = useState("grid");
  const [session, setSession] = useState([]);
  const { sessionId } = useParams();
  const [sessionUsers, setSessionUsers] = useState([]);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const { token, user } = useAuth();

console.log("logged in user:", user);


//Session Data - How to get the data ***************************************************
  const syncSession = async () => {
    const response = await fetch(`${API}/sessions/${sessionId}`);
    const data = await response.json();
    console.log(data);
    setSession(data);
  };
//Session Data - When to get the data
  useEffect(() => {
    syncSession();
  }, [sessionId]);




//Session Users Data - How to get the data ***************************************************
  const syncSessionUsers = async () => {
    const response = await fetch(`${API}/sessions/${sessionId}/users`);
    const data = await response.json();
    console.log(data);
    setSessionUsers(data);
  };
//Session Users Data - When to get the data
  useEffect(() => {
    syncSessionUsers();
  }, [sessionId]);



//Session Messages Data - How to get the data ***************************************************
  const syncSessionMessages = async () => {
    const response = await fetch(`${API}/session-messages/${sessionId}`);
    if (!response.ok) {
      console.error("Failed to fetch messages");
      return;
    } 
    const data = await response.json();
    console.log(data);
    setSessionMessages(data);
  };
//Session Users Data - When to get the data
  useEffect(() => {
    syncSessionMessages();
  }, [sessionId]);


//Function to send message ***************************************************
  const handleSendMessage = async () => {
  await fetch(`${API}/session-messages`, {
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

  setNewMessage("");
  syncSessionMessages();
};
  

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
      </aside>



      <main className="session-main-panel">

        <div className="session-status-card">
          <span>Status:</span>
          <strong>{session.session_status}</strong>
        </div>

        <div className="session-chat-container">

          <div className="session-chat-messages">
            {sessionMessages.map((msg) => (
              <div
                key={msg.session_message_id}
                className={`chat-message ${
                  msg.user_id === user?.id ? "own-message" : ""
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
              placeholder="Type a message..."
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>

        </div>

      </main>

    </div>
  </div>
);
}



