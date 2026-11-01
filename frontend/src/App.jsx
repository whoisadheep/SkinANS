import "./App.css";
import Dashboard from "./Dashboard";
import { useEffect, useState } from "react";
import PredictionResult from "./PredictionResult";
import Prediction from "./Prediction";
import Register from "./Register";
import Login from "./Login";
import OTP from "./otp";
import skinScan from "./assets/skin-scan.svg";
function App() {
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [currentPage, setCurrentPage] = useState("home");
  const [otpEmail, setOtpEmail] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState("home");

  const navigate = (page, options = {}) => {
    if (
      page === "history" ||
      page === "doctor" ||
      page === "doctors" ||
      page === "tracker" ||
      page === "contact" ||
      page === "abcde" ||
      page === "specs" ||
      page === "architecture"
    ) {
      setDashboardTab(
        page === "doctor"
          ? "doctors"
          : page === "specs" || page === "architecture"
          ? "specs"
          : page
      );
      page = "dashboard";
    } else if (page === "dashboard") {
      setDashboardTab(options?.tab || "home");
    }
    window.history.pushState({ page, tab: options?.tab }, "", `#${page}`);
    setCurrentPage(page);
    setNavOpen(false);
  };


const [user, setUser] = useState(() => {
  const savedUser = localStorage.getItem("skinans_user");
  return savedUser ? JSON.parse(savedUser) : null;
});
const isLoggedIn = !!user;
  // Prediction Result ke liye
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionPreview, setPredictionPreview] = useState(null);
  
  const [predictionData, setPredictionData] = useState({
    skinTone: 2,
    symptoms: [],
    additionalInfo: "",
  });
  
  
   // Browser Back / Forward handle karne ke liye
 useEffect(() => {
  if (!window.history.state) {
    window.history.replaceState(
      { page: "home" },
      "",
      "#home"
    );
  }

  const handlePopState = (event) => {
    const page = event.state?.page || "home";
    setCurrentPage(page);
  };

  window.addEventListener("popstate", handlePopState);

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}, []);
  
 // LOGIN PAGE
if (currentPage === "login") {
  return (
    <Login
      onNavigate={navigate}
            onLogin={(data) => {
          console.log("LOGIN SUCCESS:", data);

          localStorage.setItem(
            "skinans_user",
            JSON.stringify(data)
          );

          setUser(data);
          navigate("dashboard");
        }}
    />
  );
}
// registration

 if (currentPage === "register") {
  return (
    <Register
      onNavigate={navigate}
      onRegistered={(email) => {
        setRegisteredEmail(email);
        navigate("otp");
      }}
    />
  );
}

//otp block

if (currentPage === "otp") {
  return (
    <OTP
      email={registeredEmail}
      onNavigate={navigate}
    />
  );
}
  // =========================
  // RESULT PAGE
  // =========================
  if (currentPage === "result") {
    return (
      <PredictionResult
        result={predictionResult}
        preview={predictionPreview}
        skinTone={predictionData.skinTone}
        symptoms={predictionData.symptoms}
        additionalInfo={predictionData.additionalInfo}
        onNavigate={navigate}
      />
    );
  }

  // Prediction page
 if (currentPage === "prediction") {
  return (
    <Prediction
      onNavigate={navigate}
      onResult={(data) => {
        setPredictionResult(data.result);
        setPredictionPreview(data.preview);

        setPredictionData({
          skinTone: data.skinTone,
          symptoms: data.symptoms,
          additionalInfo: data.additionalInfo,
        });

        navigate("result");
      }}
    />
  );
}

 // Dashboard page
if (currentPage === "dashboard") {
  return (
    <Dashboard
      user={user}
      initialTab={dashboardTab}
      onNavigate={navigate}
      onLoadScan={(scan) => {
        setPredictionResult(
          scan.result
            ? { ...scan.result, gradcam_heatmap: scan.result.gradcam_heatmap || scan.gradcam_heatmap }
            : {
                disease: scan.disease,
                confidence: scan.confidence,
                gradcam_heatmap: scan.gradcam_heatmap || null,
                clinical_analysis: {
              display_name: scan.disease,
              risk_level: scan.risk_level || "Moderate",
              skin_tone_insights: `Patient Fitzpatrick Skin Tone: Type ${
                scan.skin_tone || "Not Specified"
              }.`,
              symptom_analysis: scan.symptoms
                ? `Reported symptoms: ${scan.symptoms}`
                : "No specific symptoms reported.",
              care_recommendations: [
                "Keep the affected skin clean and gently moisturized.",
                "Avoid scratching or aggressive rubbing of the affected skin.",
                "Protect skin from extreme temperatures and direct UV radiation.",
              ],
              when_to_see_doctor: [
                "Condition spreads, worsens, or fails to improve within 7-10 days.",
                "Noticeable pain, increasing warmth, or signs of secondary bacterial infection.",
              ],
            },
          }
        );
        setPredictionPreview(scan.preview_image || null);
        setPredictionData({
          skinTone: scan.skin_tone || 2,
          symptoms: scan.symptoms ? scan.symptoms.split(", ") : [],
          additionalInfo: scan.notes || "",
        });
        navigate("result");
      }}
      onLogout={() => {
        localStorage.removeItem("skinans_token");
        localStorage.removeItem("skinans_user");

        setUser(null);

        navigate("home");
      }}
    />
  );
}
  return (
    <div className="app">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">🩺</div>
          <div>
            <h2>SkinANS.AI</h2>
            <span>AI Skin Analysis</span>
          </div>
        </div>

      <button
        className="nav-toggle"
        aria-label={navOpen ? "Close menu" : "Open menu"}
        aria-expanded={navOpen}
        onClick={() => setNavOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

              <div className={`nav-links${navOpen ? " open" : ""}`}>
                <button
        className="nav-home-btn"
        onClick={() => navigate("home")}
      >
        Home
      </button>
          <a href="#about" onClick={() => setNavOpen(false)}>About</a>
          <a href="#features" onClick={() => setNavOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setNavOpen(false)}>How It Works</a>
          <button
            className="nav-home-btn"
            onClick={() => navigate("dashboard")}
          >
            Dashboard
          </button>
         {isLoggedIn ? (
      <button
        className="user-account"
        onClick={() => navigate("dashboard")}
        aria-label="Open dashboard"
      >
        <span className="user-circle">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </span>
      </button>
    ) : (
      <button
        className="login-btn"
        onClick={() => navigate("login")}
      >
        Login
      </button>
    )}
        </div>

      </nav>


      {/* HERO */}
      <section className="hero" id="home">

        <div className="hero-content">

          <div className="badge">
            AI-Powered Skin Analysis
          </div>
          <h1>
            Your Skin.
            <br />
            <span>Our Intelligence.</span>
          </h1>

          <p>
            Discover what your skin is trying to tell you.
            SkinANS uses advanced Artificial Intelligence to
            analyze skin conditions and provide personalized
            insights.
          </p>

          <div className="hero-buttons">
           <button
              className="primary-btn"
              onClick={() => navigate("prediction")}
            >
              Let's Predict
              <span>→</span>
            </button>

            <a className="secondary-btn" href="#about">
              Learn More
            </a>
          </div>

          <div className="trust">
            <div className="avatars">
              <span>👩</span>
              <span>👨</span>
              <span>👩‍⚕️</span>
            </div>

            <div>
              <strong>AI-powered analysis</strong>
              <small>Built for smarter skin care</small>
            </div>
          </div>
        </div>
<div className="hero-visual">
  <img
    src={skinScan}
    alt="Full body skin analysis"
    className="skin-scan-image"
  />
</div>

</section>



      {/* STATS */}
      <section className="stats">

        <div>
          <strong>23+</strong>
          <span>Skin Conditions</span>
        </div>

        <div>
          <strong>AI</strong>
          <span>Powered Analysis</span>
        </div>

        <div>
          <strong>24/7</strong>
          <span>Accessible</span>
        </div>

        <div>
          <strong>100%</strong>
          <span>Privacy Focused</span>
        </div>

      </section>


      {/* FEATURES */}
      <section className="features" id="features">

        <div className="section-heading">
          <span>WHAT WE OFFER</span>
          <h2>Smarter Skin Care Starts Here</h2>
          <p>
            Everything you need to understand and monitor
            your skin health.
          </p>
        </div>

        <div className="feature-grid">
        <div className="feature-card">
  <div className="feature-icon blue">🔬</div>

  <h3>AI Skin Prediction</h3>

  <p>
    Upload an image and let our AI model analyze
    possible skin conditions.
  </p>

  <button
    className="feature-link"
    onClick={() => navigate("prediction")}
  >
    Try Prediction →
  </button>
</div>
        

          <div className="feature-card">
            <div className="feature-icon purple">📊</div>
            <h3>Health Tracking</h3>
            <p>
              Monitor your skin health and track changes
              over time.
            </p>
            <a href="#tracker">View Tracker →</a>
          </div>

          <div className="feature-card">
            <div className="feature-icon pink">📋</div>
            <h3>Result History</h3>
            <p>
              Keep all your previous skin analysis results
              in one place.
            </p>
            <a href="#history">View History →</a>
          </div>

          <div className="feature-card">
            <div className="feature-icon violet">👨‍⚕️</div>
            <h3>Doctor Recommendation</h3>
            <p>
              Get guidance about when professional medical
              consultation may be appropriate.
            </p>
            <a href="#doctor">Find Guidance →</a>
          </div>

        </div>

      </section>


      {/* ABOUT */}
      <section className="about" id="about">

        <div className="about-visual">
          <div className="about-circle">
            <span>AI</span>
          </div>
        </div>

        <div className="about-content">

          <span className="section-label">
            ABOUT SKINANS
          </span>

          <h2>
            Technology That
            <span> Cares.</span>
          </h2>

          <p>
            SkinANS combines computer vision and deep
            learning to make preliminary skin analysis
            easier and more accessible.
          </p>

          <div className="about-points">
            <div>
              <span>✓</span>
              <p>AI-powered image analysis</p>
            </div>

            <div>
              <span>✓</span>
              <p>Easy-to-understand results</p>
            </div>

            <div>
              <span>✓</span>
              <p>Privacy-focused design</p>
            </div>
          </div>

        </div>

      </section>


      {/* HOW IT WORKS */}
      <section className="how" id="how-it-works">

        <div className="section-heading">
          <span>HOW IT WORKS</span>
          <h2>Three Simple Steps</h2>
          <p>
            Get your preliminary skin analysis in minutes.
          </p>
        </div>

        <div className="steps">

          <div className="step">
            <div className="step-number">01</div>
            <h3>Upload</h3>
            <p>
              Upload a clear image of the affected skin area.
            </p>
          </div>

          <div className="step">
            <div className="step-number">02</div>
            <h3>Analyze</h3>
            <p>
              Our AI model processes the image and identifies
              possible conditions.
            </p>
          </div>

          <div className="step">
            <div className="step-number">03</div>
            <h3>Understand</h3>
            <p>
              View the predicted condition, confidence and
              useful insights.
            </p>
          </div>

        </div>

      </section>


      {/* CTA */}
      <section className="cta">

        <div>
          <span>READY TO GET STARTED?</span>

          <h2>
            Give Your Skin
            <br />
            the Attention It Deserves.
          </h2>

          <p>
            Start your AI-powered skin analysis today.
          </p>

          <button
            className="primary-btn"
            onClick={() => navigate("prediction")}
          >
            Let's Predict →
          </button>
        </div>

      </section>


      {/* FOOTER */}
      <footer>

        <div className="footer-brand">
          <div className="brand-icon">✚</div>

          <div>
            <h2>SkinANS</h2>
            <p>AI-powered skin analysis</p>
          </div>
        </div>

        <div className="footer-links">
          <button
            className="nav-home-btn"
            onClick={() => navigate("home")}
          >
            Home
          </button>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <button
            className="nav-home-btn"
            onClick={() => navigate("dashboard")}
          >
            Dashboard
          </button>
        </div>

        <p className="copyright">
          © 2026 SkinANS. All rights reserved.
        </p>

      </footer>

    </div>
  );
}

export default App;