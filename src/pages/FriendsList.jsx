import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

const API = "http://localhost:3000/api";

export default function friendsList(){
    const { token, user } = useAuth();
    const [ friends, setFriends] = useState([]);
    const [ requests, setRequests ] = useState([]);
    const [ view, setView ] = useState("friends");

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
                headers: { "Authorization:" : `Bearer ${token}`}
            });
        const data = await response.json();
        setRequests(data);
    }


    const handleSendRequest = async (receiverId) =>{
    try {
        const response = await fetch(`${API}/friendslist/request/${receiverId}`,
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
        {view === "friends" ? (
          friends.map(friend => (
            <div key={friend.user_id} className="friend-card">
              <p>{friend.username}</p>
            </div>
          ))
        ) : (
          requests.map(req => (
            <div key={req.user_id_1} className="request-card">
              <p>New Request from User ID: {req.request_sender_id}</p>
              <button onClick={() => handleAccept(req.request_sender_id)}>Accept</button>
            </div>
          ))
        )}
      </section>
    </div>
  );


}