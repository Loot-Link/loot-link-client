// src/App.jsx

import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./layout/Layout";
import Games from "./pages/games";
import GameReviews from "./pages/gamereviews";
import GameReviewDetails from "./pages/gamereviewdetails";
import Profile from "./pages/profile";
import Sessions from "./pages/sessions";
import SessionDetails from "./pages/sessiondetails";
import WriteReviews from "./pages/Reviews/writeReviews";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="login" element={<Login />} /> 
        <Route path="games" element={<Games />} /> 
        <Route path="profile" element={<Profile />} /> 
        <Route path="sessions" element={<Sessions />} /> 
        <Route path='reviews' element={<GameReviews />} />
        <Route path="writeReviews" element={<WriteReviews />} />
        <Route path="/sessions/:sessionId" element={<SessionDetails />} />
        <Route path="register" element={<Register />} /> 
      </Route>
    </Routes>
  );
}

