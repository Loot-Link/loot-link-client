// import { useEffect, useState } from "react";
// import { useAuth } from "../../auth/AuthContext";
// import { Link } from "react-router-dom";
// import Layout from "../../layout/Layout";
// import Games from "../pages/games";

// const API = "http://localhost:3000";

// export default function Reviews() {
//   const { token } = useAuth();
//   const [reviews, setReviews] = useState([]);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const getReviews = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         const headers = {};
//         if (token) {
//           headers.Authorization = `Bearer ${token}`;
//         }

//         const response = await fetch(`${API}/users`, { headers });
//         const result = await response.json();

//         if (!response.ok) {
//           throw new Error(result.message || "Failed to load users.");
//         }

//         setUsers(result);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     getUsers();
//   }, [token]);

//   return (
//     <>
//       <main>
//         <h1>Reviews</h1>

//           {loading && <p>Loading reviews...</p>}
//           {error && <p>{error}</p>}

//         {!loading && !error && (
//           <>
//           <div>
//             <h2>Popular Reviews</h2>
//             <ul>
//               {reviews.map((review) => (
//                 <li key={review.id}>
//                   <h3>{review.title}</h3>
//                   <p>{review.content}</p>
//                 </li>
//               ))}
//             </ul>
//           </div><div>
//               <h2>Session Reviews</h2>
//             </div>
//             </>
//           {token && (
//             <>
//             <div>
//               <h2>My Reviews</h2>
//             </div>
//             <div>
//               <h2>Reviews by Friends</h2>
//             </div>
//             </>
//         )}
//       </main>
//     </>
//     )
}