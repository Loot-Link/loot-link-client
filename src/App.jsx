import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./layout/Layout";
import Games from "./pages/games";
import Profile from "./pages/profile";
import Sessions from "./pages/sessions";
import SessionDetails from "./pages/sessiondetails";
import FriendsList from "./pages/FriendsList";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="login" element={<Login />} /> 
        <Route path="games" element={<Games />} /> 
        <Route path="profile" element={<Profile />} /> 
        <Route path="friends" element={<FriendsList />} />
        <Route path="sessions" element={<Sessions />} /> 
        <Route path="/sessions/:sessionId" element={<SessionDetails />} />
        <Route path="register" element={<Register />} /> 
      </Route>
    </Routes>
  );
}