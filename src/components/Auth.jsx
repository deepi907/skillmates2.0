import { useState } from "react";

import Login from "./Login";
import CreateProfile from "./CreateProfile";

function Auth({ onLogin }) {

  const [authScreen, setAuthScreen] =
    useState("welcome");


  // ==========================================
  // LOGIN SUCCESS
  // ==========================================

  const handleLogin = (user) => {

    if (onLogin) {
      onLogin(user);
    }

  };


  // ==========================================
  // SIGNUP SUCCESS
  // SIGNUP → LOGIN
  // ==========================================

  const handleSignupSuccess = () => {

    setAuthScreen("login");

  };


  // ==========================================
  // LOGIN SCREEN
  // ==========================================

  if (authScreen === "login") {

    return (

      <div className="auth-page">

        <button
          className="auth-back-button"
          onClick={() =>
            setAuthScreen("welcome")
          }
        >
          ← Back
        </button>


        <Login
          onLogin={handleLogin}
        />

      </div>

    );

  }


  // ==========================================
  // SIGNUP SCREEN
  // ==========================================

  if (authScreen === "signup") {

    return (

      <div className="auth-page">

        <button
          className="auth-back-button"
          onClick={() =>
            setAuthScreen("welcome")
          }
        >
          ← Back
        </button>


        <CreateProfile
          onSignupSuccess={
            handleSignupSuccess
          }
        />

      </div>

    );

  }


  // ==========================================
  // WELCOME SCREEN
  // ==========================================

  return (

    <div className="auth-page">

      <div className="auth-container">


        {/* LOGO */}

        <div className="auth-logo">
          Skill<span>Mates</span>
        </div>


        {/* BADGE */}

        <div className="badge">
          ✦ AI-POWERED CONNECTIONS
        </div>


        {/* HEADING */}

        <h1>
          Find people who
          <span> love what you love.</span>
        </h1>


        {/* DESCRIPTION */}

        <p className="auth-description">
          SkillMates helps you discover people
          who share your hobbies, interests
          and passions.
        </p>


        {/* BUTTONS */}

        <div className="auth-buttons">

          <button
            className="primary-button"
            onClick={() =>
              setAuthScreen("login")
            }
          >
            Login →
          </button>


          <button
            className="secondary-button"
            onClick={() =>
              setAuthScreen("signup")
            }
          >
            Sign Up →
          </button>

        </div>


        <p className="auth-footer">
          Connect. Share. Learn. Grow. 🚀
        </p>

      </div>

    </div>

  );

}

export default Auth;