import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo from "../assets/lootlinklogo.png";

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__left">

          <NavLink to="/" className="site-logo">
            <img src={logo} alt="Loot Link" className="site-logo__image" />
            <span className="site-logo__text">LOOT-LINK</span>
          </NavLink>

          <nav className="main-nav">
            <NavLink to="/" className="main-nav__link">
              Home
            </NavLink>
            <NavLink to="/games" className="main-nav__link">
              Games
            </NavLink>
            <NavLink to="/sessions" className="main-nav__link">
              Sessions
            </NavLink>
            <NavLink to="/game-reviews" className="main-nav__link">
              Reviews
            </NavLink>
            

            {token && (
              <>
                <NavLink to="/friends" className="main-nav__link">
                  Friends
                </NavLink>

                <NavLink to="/mynotifications" className="main-nav__link">
                  My Notifications
                </NavLink>

                <NavLink to="/profile" className="main-nav__link">
                  Profile
                </NavLink>

                
              </>
            )}

          </nav>
        </div>

        <div className="site-header__right">
          {token ? (
            <>
              {/* <NavLink to="/account" className="account-link">
                Account
              </NavLink> */}
              <button className="logout-button" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <div className="auth-nav">
              <NavLink to="/register" className="auth-nav__link">
                Register
              </NavLink>
              <NavLink to="/login" className="auth-nav__button">
                Login
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}