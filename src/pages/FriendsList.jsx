import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

const API = "http://localhost:3000/api";

export default function FriendsList(){
    const { token, user } = useAuth();
    const [ friends, setFriends] = useState([]);
    const [ requests, setRequests ] = useState([]);
    const [ view, setView ] = useState("friends");
    const [targetId, setTargetId] = useState("");

    const fetchFriends = async () =>{
        const response = await fetch(`${API}/friendslist`, 
            {
                headers: { "Authorization" : `Bearer ${token}`}
            });
        const data = await response.json();
        setFriends(data);
    }
   

    const fetchRequests = async () =>{
        const response = await fetch(`${API}/friendslist/requests`,
            {
                headers: { "Authorization" : `Bearer ${token}`}
            });
        const data = await response.json();
        setRequests(data);
    }


    const handleSendRequest = async (username) =>{
    try {
        const response = await fetch(`${API}/friendslist/request/${username}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            if(response.ok){
                const newRequest = await response.json();
                console.log("Request sent");
                alert("Friend request sent!"); //maybe toastify this later
            }else{
                const data = await response.json();
                alert("Failed to send request.");
            }
    } catch (err) {
        console.log("Error sending request: ", err);
    }
 }
 const handleAccept=async(senderId)=>{
    const response = await fetch(`${API}/friendslist/accept/${senderId}`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if(response.ok){
            fetchFriends();
            fetchRequests();
        }
    } 
    useEffect(()=>{
        if(token){
            fetchFriends();
            fetchRequests();
        }
    },[]);

    const friendView = friends.map((friend) =>(
      <div key={friend.user_id} className="friend-card">
        <p><strong>{friend.username}</strong></p>
      </div>
    ));

    const requestsView = requests.map((req)=>{
      const isReceived = Number(req.request_sender_id) !== Number(user.id);
      console.log(user.id);
      return (
        <div key={req.user_id_1 + req.user_id_2} className="request-card">
          <span><strong>{req.friend_username}</strong></span>
          {isReceived ? (
            <button onClick={()=> handleAccept(req.friend_id)}>Accept</button> 
          ) : (
            <span className="sent-request">-Pending</span>
          )}
        </div>
      );
    });
    return (
    <div className="friends-page">
      <header className="friends-header">
        <h1>Friends List</h1>
        <div className="tab-controls">
          <button onClick={() => setView("friends")} className={view === "friends" ? "active" : ""}>
            Friends ({friends.length})
          </button>
          <button onClick={() => setView("requests")} className={view === "requests" ? "active" : ""}>
            Pending ({requests.length})
          </button>
        </div>
      </header>

      <section className="friends-content">
        {view === "friends" ? friendView : requestsView }
      </section>
      <section>
        <h3>Add friend by Username</h3>
        <div className="add-friend">
          <input 
            type="text"
            placeholder="Enter Username..."
            value={targetId}
            onChange={(e)=>setTargetId(e.target.value)}
          />
          <button onClick={()=>handleSendRequest(targetId)} disabled={!targetId}>
            Add Friend
          </button>
        </div>
      </section>
    </div>
  );
}