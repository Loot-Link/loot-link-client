import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import "./FriendsList.css";

const API = import.meta.env.VITE_API;

export default function FriendsList(){
    const { token, user } = useAuth();
    const [ friends, setFriends] = useState([]);
    const [ requests, setRequests ] = useState([]);
    const [ blocks, setBlocks ] = useState([]);
    const [ view, setView ] = useState("friends");
    const [targetId, setTargetId] = useState("");
    //Gets the list of friends from API
    const fetchFriends = useCallback(async () =>{
      if(!token) return;
      const response = await fetch(`${API}/api/friendslist`, 
        {
          headers: { "Authorization" : `Bearer ${token}`}
        });
      const data = await response.json();
      setFriends(data);
    }, [token]);
    //Gets the list of pending requests from API
    const fetchRequests = useCallback(async () =>{
      if(!token) return;
      const response = await fetch(`${API}/api/friendslist/requests`,
        {
          headers: { "Authorization" : `Bearer ${token}`}
        });
      const data = await response.json();
      setRequests(data);
    }, [token]);
    const fetchBlocks = useCallback(async ()=>{
      if(!token) return;
      const response = await fetch(`${API}/api/friendslist/blocklist`,
      {
        headers: { "Authorization": `Bearer ${token}`}
      });
      const data = await response.json();
      setBlocks(data);
    }, [token]);
    //Handler function for button to send friend requests
    const handleSendRequest = async (username) =>{
    try {
      const response = await fetch(`${API}/api/friendslist/request/${username}`,
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
    const response = await fetch(`${API}/api/friendslist/accept/${senderId}`,
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
    const response = await fetch(`${API}/api/friendslist/deny/${senderId}`,
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
  //Handler function for button to block other users
  const handleBlock = async (receiverId)=>{
    const response = await fetch(`${API}/api/friendslist/blocklist/${receiverId}`,
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
        fetchFriends();
        fetchRequests();
      }
  }
  //Handler function for button to UN-block other users
  const handleUnblock = async (receiverId)=>{
    console.log("Unblock request received for user ID: ", receiverId);
    const response = await fetch(`${API}/api/friendslist/blocklist/${receiverId}`,
      {
        method: "DELETE",
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
        fetchFriends();
        fetchRequests();
      }
  }
  const handleCancel = async (senderId) =>{
    const response = await fetch(`${API}/api/friendslist/request/${senderId}`,
       {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if(!response.ok){
        alert(data.message);
      }
      if(response.ok){
        fetchRequests();
      }
  }

    useEffect(()=>{
        if(token){
            fetchFriends();
            fetchRequests();
            fetchBlocks();
        }
    },[token, fetchFriends, fetchRequests, fetchBlocks]);
    const cleanFriends = Array.isArray(friends) ? friends : [];
    //Var to hold the html view of list of friends 
    
    const friendView = cleanFriends.map((friend) =>{
    return (
        <div key={friend.user_id} className="relation-card">
          <p><strong>{friend.username}</strong></p>
          <button className="btn-deny" onClick={()=>handleDeny(friend.user_id)}>Remove friend</button>
          <button className="btn-block" onClick={()=>handleBlock(friend.user_id)}>Block User</button>
        </div>
        );
      });
    //Var to hold html view of list of requests
    const cleanRequests = Array.isArray(requests) ? requests : [];
    const requestsView = cleanRequests.map((req)=>{
      const isReceived = Number(req.actor_id) !== Number(user.id);
      return (
        <div key={req.friend_id} className="relation-card">
          <span><strong>{req.friend_username}</strong></span>
          {isReceived ? ( 
            <div>
              <button className="btn-accept" onClick={()=> handleAccept(req.friend_id)}>Accept</button> 
              <button className="btn-deny" onClick={()=>handleDeny(req.friend_id)}>Deny</button> 
              <button className="btn-block" onClick={()=>handleBlock(req.friend_id)}>Block User</button>
            </div>
          ) : (
            <div>
              <span className="sent-request">Pending</span>
              <button className="cancel-request" onClick={()=>handleCancel(req.friend_id)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      );
    });
    //Var to hold html view of blocked users
    const cleanBlocks = Array.isArray(blocks) ? blocks : [];
    const blockedView = cleanBlocks.map((blocked)=>{
      return (
        <div key={blocked.user_id} className="relation-card">
          <p><strong>{blocked.username}</strong></p>
          <button onClick={()=>handleUnblock(blocked.user_id)}>Unblock</button>
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

      <section className="friends-view">
        {views[view]}
      </section>
      <section>
        <h3>Add friend by Username</h3>
        <div className="add-friend">
          <input 
            className="add-friend-input"
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

