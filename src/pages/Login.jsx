import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import "../auth/auth.css";
/** A form that allows users to log into an existing account. */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState(null);

  const tryLogin = async (formData) => {
    setError(null);


    const email = formData.get("email");
    const password = formData.get("password");

    try {
      await login({ email, password });
      //setPage("activities");
      navigate("/");
    } catch (e) {
      setError(e.message);
    }
  };

return (
  <div className="auth-page">
    <div className="auth-card">
      <h1 className="auth-title">Log in to your account</h1>

      <form className="auth-form" action={tryLogin}>

        <label className="auth-label">
          <span>Email</span>
          <input className="auth-input" type="text" name="email" required />
        </label>

        <label className="auth-label">
          <span>Password</span>
          <input className="auth-input" type="password" name="password" required />
        </label>

        <button className="auth-button">Login</button>

        {error && <p className="auth-error" role="alert">{error}</p>}
      </form>

      <p className="auth-switch">
        <a onClick={() => navigate("/register")}>
          Need an account? Register here.
        </a>
      </p>
    </div>
  </div>
);
}
