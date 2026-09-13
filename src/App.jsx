import { useState } from "react";
import "./App.css";

import Auth from "./components/Auth";

import Discover from "./components/Discover";
import CreateProfile from "./components/CreateProfile";
import Login from "./components/Login";
import Connections from "./components/Connections";
import Profile from "./components/Profile";
import AllSkillMates from "./components/AllSkillmates";
import UserDashboard from "./user/UserDashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faLinkedinIn,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  const [showLogin, setShowLogin] =
    useState(false);


  // ==========================================
  // LOGGED IN USER
  // ==========================================

  const [loggedInUser, setLoggedInUser] =
    useState(() => {

      const savedUser =
        localStorage.getItem("skillmateUser");

      return savedUser
        ? JSON.parse(savedUser)
        : null;
    });


  const [selectedUserId, setSelectedUserId] =
    useState(null);


  const [showAllSkillMates, setShowAllSkillMates] =
    useState(false);


  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = (user) => {

    setLoggedInUser(user);

    setShowLogin(false);

    localStorage.setItem(
      "skillmateUser",
      JSON.stringify(user)
    );

  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {

    localStorage.removeItem(
      "skillmateUser"
    );

    setLoggedInUser(null);

    setShowLogin(false);

    setSelectedUserId(null);

    setShowAllSkillMates(false);

  };


  // ==========================================
  // VIEW PROFILE
  // ==========================================

  const handleViewProfile = (userId) => {

    setSelectedUserId(userId);

    setShowAllSkillMates(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };


  // ==========================================
  // AUTH PAGE
  // ==========================================
  //
  // If user is NOT logged in:
  // Show Login / Signup screen.
  //
  // Your original main page is NOT changed.
  // ==========================================

  if (!loggedInUser) {

    return (
      <Auth
        onLogin={handleLogin}
      />
    );

  }


  // ==========================================
  // PROFILE PAGE
  // ==========================================

  if (selectedUserId) {

    return (
      <div className="app">

        <Profile
          userId={selectedUserId}

          onBack={() => {
            setSelectedUserId(null);
          }}
        />

      </div>
    );

  }
  // ==========================================
// USER DASHBOARD
// ==========================================

if (showDashboard) {
  return (
    <UserDashboard
      onBack={() => {
        setShowDashboard(false);
      }}
      onLogout={handleLogout}
    />
  );
}


  // ==========================================
  // ALL SKILLMATES PAGE
  // ==========================================

  if (showAllSkillMates) {

    return (
      <div className="app">

        <AllSkillMates
          onViewProfile={
            handleViewProfile
          }

          onBack={() => {

            setShowAllSkillMates(false);

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });

          }}
        />

      </div>
    );

  }


  // ==========================================
  // ORIGINAL MAIN WEBSITE
  // NOTHING REMOVED
  // ==========================================

  return (

    <div className="app">


      {/* ================= NAVBAR ================= */}

      <nav className="navbar">

        <div className="logo">
          Skill<span>Mates</span>
        </div>


        <div className="nav-links">

          <a href="#discover">
            Discover
          </a>


          <a href="#communities">
            Communities
          </a>


          {loggedInUser && (

            <a href="#connections">
              Connections
            </a>

          )}


          <a href="#activities">
            Activities
          </a>

        </div>


        {/* ================= NAV ACTIONS ================= */}

        <div className="nav-actions">
          

          {!loggedInUser ? (

            <button
              className="login-button"

              onClick={() =>
                setShowLogin(true)
              }
            >
              Login
            </button>

          ) : (

            <>

         <span className="logged-user">
  Hi, {loggedInUser.name}
</span>


<button
  className="login-button"
  onClick={() => setShowDashboard(true)}
>
  👤 Dashboard
</button>

<button
  className="login-button"
  onClick={handleLogout}
>
  Logout
</button>

            </>

          )}


          <button className="ai-button">
            ✦ AI Guide
          </button>

        </div>

      </nav>


      {/* ================= HERO ================= */}

      <main className="hero">

        <div className="hero-content">


          <div className="badge">
            ✦ AI-powered connections
          </div>


          <h1>

            Find people who

            <span>
              {" "}love what you love.
            </span>

          </h1>


          <p>

            SkillMates helps you discover
            people through shared hobbies,
            interests and experiences —
            not just profiles.

          </p>


          <div className="hero-buttons">


            <button className="primary-button">
              Discover Your Mates →
            </button>


            <button className="secondary-button">
              Explore Communities
            </button>


          </div>


          <div className="hero-stats">


            <div>

              <strong>
                10K+
              </strong>

              <small>
                Interests
              </small>

            </div>


            <div>

              <strong>
                5K+
              </strong>

              <small>
                Connections
              </small>

            </div>


            <div>

              <strong>
                AI
              </strong>

              <small>
                Powered matching
              </small>

            </div>


          </div>

        </div>


        {/* ================= HERO VISUAL ================= */}

        <div className="hero-visual">


          <div className="floating-card card-one">
            🎨 Painting
          </div>


          <div className="profile-card">


            <div className="profile-image">
              👩🏻
            </div>


            <h3>
              Meet someone like you
            </h3>


            <p>
              Sarah, 24
            </p>


            <div className="common-score">


              <strong>
                87%
              </strong>


              <span>
                Common Ground
              </span>


            </div>


            <div className="interests">


              <span>
                📸 Photography
              </span>


              <span>
                🎬 Movies
              </span>


              <span>
                ✈️ Travel
              </span>


              <span>
                ☕ Coffee
              </span>


            </div>


            <button className="connect-button">
              View Common Ground
            </button>


          </div>


          <div className="floating-card card-two">
            💻 Coding
          </div>


        </div>

      </main>


      {/* ================= DISCOVER ================= */}

      <section id="discover">


        <Discover

          onViewProfile={
            handleViewProfile
          }


          onViewAll={() => {

            setShowAllSkillMates(true);

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });

          }}

        />


      </section>


      {/* ================= CONNECTIONS ================= */}

      {loggedInUser && (

        <section id="connections">

          <Connections />

        </section>

      )}


      {/* ================= CREATE PROFILE ================= */}

      <section id="create-profile">

        <CreateProfile />

      </section>


      {/* ================= LOGIN MODAL ================= */}

      {showLogin && !loggedInUser && (

        <div className="login-overlay">


          <div className="login-modal">


            <button
              className="close-login"

              onClick={() =>
                setShowLogin(false)
              }
            >
              ×
            </button>


            <Login
              onLogin={handleLogin}
            />


          </div>


        </div>

      )}
     {/* ================= FOOTER ================= */}

 
<footer className="site-footer">

  <div className="footer-credit">
    Created by Deepika © 2026
  </div>

  <div className="footer-socials">

    <a
      href="https://www.instagram.com/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
      className="social-icon instagram"
    >
      <FontAwesomeIcon icon={faInstagram} />
    </a>

    <a
      href="http://www.linkedin.com/in/deepika-m-08b8a41a8"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="LinkedIn"
      className="social-icon linkedin"
    >
      <FontAwesomeIcon icon={faLinkedinIn} />
    </a>

    <a
      href="https://x.com/Deepika409"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Twitter / X"
      className="social-icon twitter"
    >
      <FontAwesomeIcon icon={faXTwitter} />
    </a>

  </div>

</footer>
    </div>

  );

}


export default App;