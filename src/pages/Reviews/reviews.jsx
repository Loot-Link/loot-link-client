// import { useEffect, useState } from "react";
// import { useAuth } from "../../auth/AuthContext";
// import { Link } from "react-router-dom";
// import Games from "../pages/games";

// const API = "http://localhost:3000/api";
// // const API = "import.meta.env.VITE_API";

// export default function Reviews() {
//     const [gameReviews, setGameReviews] = useState([]);
//     const [viewMode, setViewMode] = useState("grid");

//     const syncGameReviews = async () => {
//         const response = await fetch(`${API}/reviews`);
//         const data = await response.json();
//         console.log(data);
//         setGameReviews(data);
//     };

//     useEffect(() => {
//         syncGameReviews();
//     }, []);

    

//     return (
//         <>
//             <section className='reviews-page'>
//                 <div className='reviews-page-header'>
//                     <div className='reviews-page__title-wrap'>
//                         <h1 className='reviews-page__title'>Reviews</h1>
//                         <p className='reviews-page__subtitle'>
//                             Browse Reviews or Write One!
//                         </p>
//                     </div>

//                     <div className="games-view-toggle">
//                         <button
//                         className={`games-view-toggle__button ${
//                             viewMode === "grid" ? "is-active" : ""
//                         }`}
//                         onClick={() => setViewMode("grid")}
//                         type="button"
//                         >
//                         Grid
//                         </button>

//                         <button
//                         className={`games-view-toggle__button ${
//                             viewMode === "list" ? "is-active" : ""
//                         }`}
//                         onClick={() => setViewMode("list")}
//                         type="button"
//                         >
//                         List
//                         </button>
//                     </div>