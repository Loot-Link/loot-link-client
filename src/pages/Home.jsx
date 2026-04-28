import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

const API = "http://localhost:3000";

export default function Home() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API}/users`, { headers });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to load users.");
        }

        setUsers(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, [token]);

  return (
    <main>
      <h1>Loot Link</h1>

      <p>
        {token
          ? "Logged in: showing all users."
          : "Logged out: showing public users only."}
      </p>

      {loading && <p>Loading users...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && (
        <ul>
          {users.map((user) => (
            <li key={user.user_id}>
              {user.username} ({user.email}) - role {user.role_id}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}