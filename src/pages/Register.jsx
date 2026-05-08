import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import "../auth/auth.css";
/** A form that allows users to register for a new account */
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const tryRegister = async (formData) => {
    setError(null);

    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      await register({username, email, password });
      //setPage("activities");
      navigate("/");
    } catch (e) {
      setError(e.message);
    }
  };

return (
  <div className="auth-page">
    <div className="auth-card">
      <h1 className="auth-title">Register for an account</h1>

      <form className="auth-form" action={tryRegister}>

        <label className="auth-label">
          <span>UserName</span>
          <input className="auth-input" type="text" name="username" required />
        </label>

        <label className="auth-label">
          <span>Email</span>
          <input className="auth-input" type="text" name="email" required />
        </label>

        <label className="auth-label">
          <span>Password</span>
          <input className="auth-input" type="password" name="password" required />
        </label>

        <button className="auth-button">Register</button>

        {error && <p className="auth-error" role="alert">{error}</p>}
      </form>

      <p className="auth-switch">
        <a onClick={() => navigate("/login")}>
          Already have an account? Log in here.
        </a>
      </p>
    </div>
  </div>
);
}
