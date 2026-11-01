import { useState } from "react";
import "./Otp.css";

function OTP({ email, onNavigate }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleVerify = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            otp: otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "OTP verification failed.");
      }

      console.log("OTP VERIFIED:", data);

      setMessage(
        "Email verified successfully! You can now login."
      );

      setTimeout(() => {
        onNavigate("login");
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-page">

      <aside className="auth-story">
        <div>
          <p className="auth-story-kicker">SkinANS.AI</p>
          <h2>Confirm it is you.</h2>
          <p>
            Enter the 6-digit code sent to your email to
            finish creating your account.
          </p>
        </div>
        <p className="auth-story-foot">Email verification</p>
      </aside>

      <div className="otp-card">

        <div className="otp-logo">
          🩺
        </div>

        <span className="otp-label">
          EMAIL VERIFICATION
        </span>

        <h1>Verify Your Email</h1>

        <p className="otp-subtitle">
          We have sent a 6-digit verification code to
        </p>

        <strong className="otp-email">
          {email}
        </strong>

        <form onSubmit={handleVerify}>

          <div className="otp-input-group">
            <label>Enter OTP</label>

            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, ""))
              }
            />
          </div>

          {error && (
            <div className="otp-error">
              {error}
            </div>
          )}

          {message && (
            <div className="otp-success">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="otp-primary-btn"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify Email →"}
          </button>

        </form>

        <button
          className="otp-back-btn"
          onClick={() => onNavigate("register")}
        >
          ← Back to Registration
        </button>

      </div>

    </div>
  );
}

export default OTP;