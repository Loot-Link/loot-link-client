import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

const API = "http://localhost:3000/api";

export default function FriendsList(){
    const { token, user } = useAuth();
    const [ friends, setFriends] = useState([]);
    const [ requests, setRequests ] = useState([]);
    const [ blocks, setBlocks ] = useState([]);
    const [ view, setView ] = useState("friends");
    const [targetId, setTargetId] = useState("");
    //Gets the list of friends from API
    const fetchFriends = async () =>{
        const response = await fetch(`${API}/friendslist`, 
            {
                headers: { "Authorization" : `Bearer ${token}`}
            });
        const data = await response.json();
        setFriends(data);
    }
    //Gets the list of pending requests from API
    const fetchRequests = async () =>{
        const response = await fetch(`${API}/friendslist/requests`,
            {
                headers: { "Authorization" : `Bearer ${token}`}
            });
        const data = await response.json();
        setRequests(data);
    }
    const fetchBlocks = async ()=>{
      const response = await fetch(`${API}/blocklist`,
        {
          headers: { "Authorization": `Bearer ${token}`}
        });
      const data = await response.json();
      setBlocks(data);
    }
    //Handler function for button to send friend requests
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
        const data = await response.json();
          if(!response.ok){
            alert(data.message); //toastify eventually
          }else{
            console.log("Request sent");
            alert("Friend request sent!"); //maybe toastify this later   
          }
    } catch (err) {
        console.log("Error sending request: ", err);
    }
    fetchRequests();
 }
 //Handler function for button to Accept pending requests
 const handleAccept=async(senderId)=>{
    const response = await fetch(`${API}/friendslist/accept/${senderId}`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        if(!response.ok){
          alert(data.message); //toastify
        }
        if(response.ok){
            fetchFriends();
            fetchRequests();
        }
    } 
  //Handler function for button to deny pending requests
  const handleDeny = async (senderId)=>{
    const response = await fetch(`${API}/friendslist/deny/${senderId}`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        if(!response.ok){
          alert(data.message); //toastify
        }
        if(response.ok){
            fetchFriends();
            fetchRequests();
        }
  }
  //Need to figure out which is sender/receiver for this one *******************************************************
  //Handler function for button to block other users
  const handleBlock = async (receiverId)=>{
    const response = await fetch(`${API}/blocklist/${receiverId}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if(!response.ok){
        alert(data.message);//toastify
      }
      if(response.ok){
        fetchBlocks();
      }
  }
    useEffect(()=>{
        if(token){
            fetchFriends();
            fetchRequests();
            fetchBlocks();
        }
    },[]);
    //Varr to hold the html view of list of friends 
    const friendView = friends.map((friend) =>{
    return (
        <div key={friend.user_id} className="friend-card">
          <p><strong>{friend.username}</strong></p>
          <button onClick={()=>handleDeny(friend.user_id)}>Remove friend</button>
          <button onClick={()=>handleBlock(friend.user_id)}>Block User</button>
        </div>
        );
      });
    //Var to hold html view of list of requests
    const requestsView = requests.map((req)=>{
      const isReceived = Number(req.sender_id) !== Number(user.id);
      return (
        <div key={req.friend_id} className="request-card">
          <span><strong>{req.friend_username}</strong></span>
          {isReceived ? ( 
            <div>
              <button onClick={()=> handleAccept(req.friend_id)}>Accept</button> 
              <button onClick={()=>handleDeny(req.friend_id)}>Deny</button> 
              <button onClick={()=>handleBlock(req.friend_id)}>Block User</button>
            </div>
          ) : (
            <span className="sent-request">-Pending</span>
          )}
        </div>
      );
    });
    //Var to hold html view of blocked users
    const blockedView = blocks.map((blocked)=>{
      return (
        <div key={blocked.user_id} className="blocked-card">
          <p><strong>{blocked.username}</strong></p>
          <button onClick={()=>handleBlock(blocked.user_id)}>Unblock -Broken-</button>
        </div>
      );
    });


    const views = {
      friends: friendView,
      requests: requestsView,
      blocked:  blockedView
    }


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
          <button onClick={() => setView("blocked")} className={view === "blocked" ? "active" : ""}>
            Blocked ({blocks.length})
          </button>
        </div>
      </header>

      <section className="friends-content">
        {views[view]}
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

