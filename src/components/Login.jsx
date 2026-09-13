import { useState } from "react";

function Login({ onLogin }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] =
    useState(false);

  const [forgotEmail, setForgotEmail] =
    useState("");

  const [forgotMessage, setForgotMessage] =
    useState("");

  const [sendingReset, setSendingReset] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ==========================================
  // LOGIN
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("Logging in...");

    try {
      const response = await fetch(
        `${API_URL}/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      localStorage.setItem(
        "skillmateUser",
        JSON.stringify(data.user)
      );

      setMessage("Login successful! 🎉");

      console.log(
        "Logged in user:",
        data.user
      );

      if (onLogin) {
        onLogin(data.user);
      }

    } catch (error) {
      console.error(error);
      setMessage(error.message);
    }
  };

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    if (!forgotEmail) {
      setForgotMessage(
        "Please enter your email address."
      );
      return;
    }

    setSendingReset(true);
    setForgotMessage("Sending reset email...");

    try {
      const response = await fetch(
        `${API_URL}/api/password/forgot`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: forgotEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not send reset email."
        );
      }

      setForgotMessage(data.message);

    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      setForgotMessage(
        error.message ||
          "Could not send reset email."
      );

    } finally {
      setSendingReset(false);
    }
  };

  // ==========================================
  // FORGOT PASSWORD SCREEN
  // ==========================================

  if (showForgotPassword) {
    return (
      <section className="login-section">

        <div className="section-heading">

          <div className="badge">
            ✦ RESET PASSWORD
          </div>

          <h2>
            Forgot your
            <span> password?</span>
          </h2>

          <p>
            Enter your email and we'll send you
            a password reset link.
          </p>

        </div>

        <form onSubmit={handleForgotPassword}>

          <div>
            <label>Email</label>

            <input
              type="email"
              value={forgotEmail}
              onChange={(event) =>
                setForgotEmail(event.target.value)
              }
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={sendingReset}
          >
            {sendingReset
              ? "Sending..."
              : "Send Reset Link →"}
          </button>

          {forgotMessage && (
            <p className="form-message">
              {forgotMessage}
            </p>
          )}

        </form>

        <button
          type="button"
          onClick={() => {
            setShowForgotPassword(false);
            setForgotMessage("");
          }}
        >
          ← Back to Login
        </button>

      </section>
    );
  }

  // ==========================================
  // LOGIN SCREEN
  // ==========================================

  return (
    <section className="login-section">

      <div className="section-heading">

        <div className="badge">
          ✦ WELCOME BACK
        </div>

        <h2>
          Login to
          <span> SkillMates.</span>
        </h2>

        <p>
          Find people who love what you love.
        </p>

      </div>

      <form onSubmit={handleSubmit}>

        <div>
          <label>Email</label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label>Password</label>

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Your password"
            required
          />
        </div>

        {/* FORGOT PASSWORD */}

        <button
          type="button"
          onClick={() => {
            setShowForgotPassword(true);
            setForgotEmail(formData.email);
            setMessage("");
          }}
        >
          Forgot Password?
        </button>

        <button type="submit">
          Login →
        </button>

        {message && (
          <p className="form-message">
            {message}
          </p>
        )}

      </form>

    </section>
  );
}

export default Login;