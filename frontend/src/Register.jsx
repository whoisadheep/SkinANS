import { useState } from "react";
import "./Register.css";

function Register({ onNavigate, onRegistered }) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");

    if (
      !formData.name ||
      !formData.username ||
      !formData.email ||
      !formData.password
    ) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/register",
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
        throw new Error(data.detail || "Registration failed.");
      }

      // OTP page par user details bhejna
      onRegistered(formData.email);

    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <aside className="auth-story">
        <div>
          <p className="auth-story-kicker">SkinANS.AI</p>
          <h2>Begin with a clearer picture.</h2>
          <p>
            Create an account to upload a photo, note your
            symptoms, and receive a preliminary skin analysis.
          </p>
        </div>
        <p className="auth-story-foot">Private by design</p>
      </aside>

      <div className="auth-card">

        <div className="auth-logo">
          🩺
        </div>

        <span className="auth-label">
          SKINANS AI
        </span>

        <h1>Create Account</h1>

        <p className="auth-subtitle">
          Create your account to start your personalized
          skin health journey.
        </p>

        <form onSubmit={handleRegister}>

          <div className="input-group">
            <label>Full Name</label>

            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Username</label>

            <input
              type="text"
              name="username"
              placeholder="Choose a unique username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Gmail Address</label>

            <input
              type="email"
              name="email"
              placeholder="yourname@gmail.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-primary-btn"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Create Account →"}
          </button>

        </form>

        <div className="auth-divider">
          <span>Already have an account?</span>
        </div>

        <button
          className="auth-secondary-btn"
          onClick={() => onNavigate("login")}
        >
          Login
        </button>

        <button
          className="back-home-btn"
          onClick={() => onNavigate("home")}
        >
          ← Back to Home
        </button>

      </div>

    </div>
  );
}

export default Register;