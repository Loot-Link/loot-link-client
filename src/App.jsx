import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./layout/Layout";
import Games from "./pages/games";
import GameReviews from "./pages/Reviews/gamereviews";
import GameReviewDetails from "./pages/Reviews/gamereviewdetails";
import GameDetails from "./pages/gamedetails";
import Profile from "./pages/profile";
import Sessions from "./pages/sessions";
import SessionDetails from "./pages/sessiondetails";
import WriteReviews from "./pages/Reviews/writeReviews";
import FriendsList from "./pages/FriendsList";
import MyNotifications from "./pages/mynotifications";
import RaidHelper from "./pages/raidhelperevents";
import RaidHelperUpcoming from "./pages/raidhelpereventsupcoming";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="login" element={<Login />} /> 
        <Route path="games" element={<Games />} /> 
        <Route path="profile" element={<Profile />} /> 
        <Route path="sessions" element={<Sessions />} /> 
        <Route path="writeReviews" element={<WriteReviews />} />
        <Route path="game-reviews/:id" element={<GameReviewDetails />} />
        <Route path="friends" element={<FriendsList />} />
        <Route path="mynotifications" element={<MyNotifications />} />
        <Route path="game-reviews" element={<GameReviews />} /> 
        <Route path="/game-reviews/:id" element={<GameReviewDetails />} />
        <Route path="/games/:gameId" element={<GameDetails />} />
        <Route path="sessions" element={<Sessions />} />        
        <Route path="raidhelper" element={<RaidHelper />} />   
        <Route path="raidhelperupcoming" element={<RaidHelperUpcoming />} />  
        <Route path="/sessions/:sessionId" element={<SessionDetails />} />
        <Route path="register" element={<Register />} /> 
      </Route>
    </Routes>
  );
}

