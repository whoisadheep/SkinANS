import { useState } from "react";
import "./Login.css";

function Login({ onNavigate, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!username || !password) {
      setError("Please enter your User ID or Email, and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid User ID or password.");
      }

      // JWT token ko temporarily browser me save kar rahe hain
      localStorage.setItem("skinans_token", data.access_token);

      // Login successful
console.log("LOGIN RESPONSE:", data);

localStorage.setItem("skinans_token", data.access_token);
      onLogin(data);

    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <aside className="auth-story">
        <div>
          <p className="auth-story-kicker">SkinANS.AI</p>
          <h2>Your skin, read with care.</h2>
          <p>
            Sign in to continue analysis, review past scans,
            and pick up your skin health journey.
          </p>
        </div>
        <p className="auth-story-foot">Preliminary insight, not a diagnosis</p>
      </aside>

      <div className="login-card">

        {/* LOGO */}
        <div className="login-logo">
          🩺
        </div>

        <span className="login-label">
          WELCOME BACK
        </span>

        <h1>
          Login to SkinANS
        </h1>

        <p className="login-subtitle">
          Continue your personalized skin health journey.
        </p>


        {/* FORM */}
        <form onSubmit={handleLogin}>

          {/* USERNAME OR EMAIL */}
          <div className="login-input-group">

            <label>
              User ID or Email
            </label>

            <input
              type="text"
              placeholder="Enter your User ID or registered email"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
            />

          </div>


          {/* PASSWORD */}
          <div className="login-input-group">

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />

          </div>


          {/* ERROR */}
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="login-primary-btn"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login →"}
          </button>

        </form>


        {/* REGISTER */}
        <div className="login-divider">
          <span>New to SkinANS?</span>
        </div>

       <button
  className="login-register-btn"
  onClick={() => onNavigate("register")}
>
  Create an Account
</button>


        {/* BACK */}
        <button
          className="login-back-btn"
          onClick={() => onNavigate("home")}
        >
          ← Back to Home
        </button>

      </div>

    </div>
  );
}

export default Login;