import { useState, useEffect } from "react";
import "./Dashboard.css";
import ABCDEScreener from "./ABCDEScreener";
import ModelSpecs from "./ModelSpecs";
import ClinicalReportModal from "./ClinicalReportModal";

function Dashboard({ user, initialTab = "home", onNavigate, onLoadScan, onLogout }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [reportModalScan, setReportModalScan] = useState(null);
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState({
    total_scans: 0,
    last_status: "No scans yet",
    urgent_alerts: 0,
    active_consults: 0,
  });
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [trackingLogs, setTrackingLogs] = useState([]);

  // Search & Filter state for History
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  // City & Search state for Doctors
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [availableCities, setAvailableCities] = useState([
    "All Cities",
    "Bengaluru",
    "Delhi NCR",
    "Mumbai",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Pune",
  ]);

  // Booking Modal / Form state
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    patient_name: user?.name || "",
    email: user?.email || "",
    phone: "",
    preferred_date: new Date().toISOString().split("T")[0],
    preferred_time: "10:00 AM",
    symptoms: "",
  });
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Tracking Log Form state
  const [trackingForm, setTrackingForm] = useState({
    date: new Date().toISOString().split("T")[0],
    symptoms: "",
    improvement: "Stable (No Change)",
    notes: "",
  });
  const [trackingSuccess, setTrackingSuccess] = useState(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    subject: "Medical Inquiry",
    message: "",
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Sync initialTab when prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load live data from Backend & LocalStorage
  const loadData = async () => {
    const username = user?.username || "guest";

    // 1. Load Scans
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/scans?username=${username}`);
      if (res.ok) {
        const apiScans = await res.json();
        setScans(apiScans);
        localStorage.setItem("skinans_scans", JSON.stringify(apiScans));
      } else {
        throw new Error("API failed");
      }
    } catch {
      const localScans = JSON.parse(localStorage.getItem("skinans_scans") || "[]");
      setScans(localScans);
    }

    // 2. Load Stats
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/dashboard/stats?username=${username}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Real stats computed directly from local storage records
      const localScans = JSON.parse(localStorage.getItem("skinans_scans") || "[]");
      const localAppts = JSON.parse(localStorage.getItem("skinans_appointments") || "[]");
      setStats({
        total_scans: localScans.length,
        last_status: localScans[0]?.disease ? localScans[0].disease.replace(" Photos", "") : "No scans yet",
        urgent_alerts: localScans.filter((s) => s.risk_level === "Urgent").length,
        active_consults: localAppts.length,
      });
    }

    // 3. Load Doctors & Available Cities
    try {
      const [resDocs, resCities] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/doctors"),
        fetch("http://127.0.0.1:8000/api/doctors/cities"),
      ]);
      if (resDocs.ok) {
        const data = await resDocs.json();
        setDoctors(data);
      }
      if (resCities.ok) {
        const cities = await resCities.json();
        setAvailableCities(cities);
      }
    } catch {
      // Offline fallback doctors
      setDoctors([
        {
          id: "doc-1",
          name: "Dr. Rajesh Sharma, MD (DVL)",
          specialization: "Consultant Dermatologist & Venereologist",
          experience: "12 years",
          rating: 4.8,
          consult_fee: "₹800",
          avatar: "👨‍⚕️",
          available_days: "Mon - Sat",
          clinic: "Apollo Hospitals Dermatology Centre",
          city: "Bengaluru",
          address: "154/11, Opp. IIMB, Bannerghatta Road, Bengaluru 560076",
          phone: "+91 80 2630 4050",
          maps_url: "https://www.google.com/maps/search/Apollo+Hospitals+Bannerghatta+Road+Bengaluru",
        },
        {
          id: "doc-2",
          name: "Dr. Kavitha Reddy, MBBS, DDVL",
          specialization: "Aesthetic & Clinical Dermatologist",
          experience: "9 years",
          rating: 4.9,
          consult_fee: "₹750",
          avatar: "👩‍⚕️",
          available_days: "Mon - Fri",
          clinic: "Manipal Hospital Dermatology Dept",
          city: "Bengaluru",
          address: "98, HAL Old Airport Road, Kodihalli, Bengaluru 560017",
          phone: "+91 80 2502 4444",
          maps_url: "https://www.google.com/maps/search/Manipal+Hospital+Old+Airport+Road+Bengaluru",
        },
        {
          id: "doc-3",
          name: "Dr. Priya Singh, MBBS, MD (DVL)",
          specialization: "Clinical Dermatologist & Laser Specialist",
          experience: "8 years",
          rating: 4.7,
          consult_fee: "₹600",
          avatar: "👩‍⚕️",
          available_days: "Mon - Fri",
          clinic: "Fortis Healthcare Skin Centre",
          city: "Delhi NCR",
          address: "Sector B, Pocket 1, Aruna Asaf Ali Marg, Vasant Kunj, New Delhi 110070",
          phone: "+91 11 4277 6222",
          maps_url: "https://www.google.com/maps/search/Fortis+Hospital+Vasant+Kunj+New+Delhi",
        },
        {
          id: "doc-4",
          name: "Dr. Sameer Batra, MD, FAAD",
          specialization: "Psoriasis & Dermato-Surgeon",
          experience: "14 years",
          rating: 4.9,
          consult_fee: "₹850",
          avatar: "👨‍⚕️",
          available_days: "Tue - Sat",
          clinic: "Max Super Speciality Hospital",
          city: "Delhi NCR",
          address: "1, 2, Press Enclave Marg, Saket Institutional Area, New Delhi 110017",
          phone: "+91 11 2651 5050",
          maps_url: "https://www.google.com/maps/search/Max+Hospital+Saket+New+Delhi",
        },
        {
          id: "doc-5",
          name: "Dr. Aisha Patel, MBBS, DDVL",
          specialization: "Pediatric Dermatology & Dermatosurgery",
          experience: "10 years",
          rating: 4.9,
          consult_fee: "₹700",
          avatar: "👩‍⚕️",
          available_days: "Tue - Sun",
          clinic: "Nanavati Max Super Speciality Hospital",
          city: "Mumbai",
          address: "SV Road, near Vile Parle West, Mumbai 400056",
          phone: "+91 22 2626 7500",
          maps_url: "https://www.google.com/maps/search/Nanavati+Hospital+Vile+Parle+Mumbai",
        },
      ]);
    }

    // 4. Load Appointments
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/appointments?username=${username}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
        localStorage.setItem("skinans_appointments", JSON.stringify(data));
      }
    } catch {
      const localAppts = JSON.parse(localStorage.getItem("skinans_appointments") || "[]");
      setAppointments(localAppts);
    }

    // 5. Load Tracking Logs
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/tracking?username=${username}`);
      if (res.ok) {
        const data = await res.json();
        setTrackingLogs(data);
        localStorage.setItem("skinans_tracking", JSON.stringify(data));
      }
    } catch {
      const localTracking = JSON.parse(localStorage.getItem("skinans_tracking") || "[]");
      setTrackingLogs(localTracking);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Delete Scan
  const handleDeleteScan = async (scanId) => {
    // Delete from state & localStorage
    const updated = scans.filter((s) => s.id !== scanId);
    setScans(updated);
    localStorage.setItem("skinans_scans", JSON.stringify(updated));

    // Try backend
    try {
      await fetch(`http://127.0.0.1:8000/api/scans/${scanId}`, { method: "DELETE" });
    } catch (e) {
      console.log("Delete sync:", e);
    }
  };

  // Handle Book Appointment Submission
  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookingDoctor) return;

    const payload = {
      ...bookingForm,
      doctor_id: bookingDoctor.id,
      username: user?.username || "guest",
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setBookingSuccess(data);
        const updated = [data, ...appointments];
        setAppointments(updated);
        localStorage.setItem("skinans_appointments", JSON.stringify(updated));
      }
    } catch {
      const offlineAppt = {
        appointment_id: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
        doctor: bookingDoctor,
        preferred_date: bookingForm.preferred_date,
        preferred_time: bookingForm.preferred_time,
        status: "Confirmed",
        meeting_link: "https://meet.google.com/skinans-telehealth",
        created_at: new Date().toLocaleDateString(),
      };
      setBookingSuccess(offlineAppt);
      const updated = [offlineAppt, ...appointments];
      setAppointments(updated);
      localStorage.setItem("skinans_appointments", JSON.stringify(updated));
    }
  };

  // Handle Tracking Log Submission
  const handleTrackingSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...trackingForm,
      username: user?.username || "guest",
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = [data, ...trackingLogs];
        setTrackingLogs(updated);
        localStorage.setItem("skinans_tracking", JSON.stringify(updated));
        setTrackingSuccess(true);
        setTimeout(() => setTrackingSuccess(false), 3000);
      }
    } catch {
      const offlineLog = {
        id: `TRK-${Date.now()}`,
        ...trackingForm,
        created_at: new Date().toLocaleDateString(),
      };
      const updated = [offlineLog, ...trackingLogs];
      setTrackingLogs(updated);
      localStorage.setItem("skinans_tracking", JSON.stringify(updated));
      setTrackingSuccess(true);
      setTimeout(() => setTrackingSuccess(false), 3000);
    }
  };

  // Filter scans for History tab
  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      (scan.disease || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (scan.symptoms || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (scan.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk =
      riskFilter === "all" || (scan.risk_level || "").toLowerCase() === riskFilter.toLowerCase();
    return matchesSearch && matchesRisk;
  });

  // Filter doctors by City and Search query
  const filteredDoctors = doctors.filter((doc) => {
    const matchesCity =
      selectedCity === "All Cities" ||
      (doc.city || "").toLowerCase() === selectedCity.toLowerCase();
    const matchesSearch =
      (doc.name || "").toLowerCase().includes(doctorSearch.toLowerCase()) ||
      (doc.specialization || "").toLowerCase().includes(doctorSearch.toLowerCase()) ||
      (doc.clinic || "").toLowerCase().includes(doctorSearch.toLowerCase()) ||
      (doc.city || "").toLowerCase().includes(doctorSearch.toLowerCase());
    return matchesCity && matchesSearch;
  });

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="side-brand">
          <div className="side-logo">🩺</div>
          <div>
            <h2>SkinANS AI</h2>
          </div>
        </div>

        <nav className="side-nav">
          <button
            className={`side-link ${activeTab === "home" ? "active" : ""}`}
            onClick={() => setActiveTab("home")}
          >
            <span>⌂</span>
            Home
          </button>

          <button
            className="side-link"
            onClick={() => onNavigate("prediction")}
          >
            <span>🔬</span>
            AI Prediction
          </button>

          <button
            className={`side-link ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <span>↶</span>
            Scan History
          </button>

          <button
            className={`side-link ${activeTab === "tracker" ? "active" : ""}`}
            onClick={() => setActiveTab("tracker")}
          >
            <span>⌁</span>
            Health Tracker
          </button>

          <button
            className={`side-link ${activeTab === "abcde" ? "active" : ""}`}
            onClick={() => setActiveTab("abcde")}
          >
            <span>🛡️</span>
            ABCDE Screener
          </button>

          <button
            className={`side-link ${activeTab === "specs" ? "active" : ""}`}
            onClick={() => setActiveTab("specs")}
          >
            <span>🧠</span>
            AI Specs & Viva
          </button>

          <button
            className={`side-link ${activeTab === "doctors" ? "active" : ""}`}
            onClick={() => setActiveTab("doctors")}
          >
            <span>👨‍⚕️</span>
            Consult Doctor
          </button>

          <button
            className={`side-link ${activeTab === "contact" ? "active" : ""}`}
            onClick={() => setActiveTab("contact")}
          >
            <span>✉</span>
            Contact Support
          </button>
        </nav>

        <button className="logout" onClick={onLogout}>
          <span>↪</span>
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        {/* TOP NAVBAR */}
        <div className="dashboard-topbar">
          <div className="dashboard-page-title">
            <span>
              {activeTab === "home" && "Dashboard Overview"}
              {activeTab === "history" && "Scan History & Past Reports"}
              {activeTab === "specs" && "AI Model Architecture & Viva Defense"}
              {activeTab === "abcde" && "ABCDE Melanoma Risk Protocol"}
              {activeTab === "doctors" && "Dermatologist Consultation"}
              {activeTab === "tracker" && "Skin Recovery Progress"}
              {activeTab === "contact" && "Medical Support & Inquiries"}
            </span>
          </div>

          <button
            className="dashboard-user"
            onClick={() => setActiveTab("home")}
          >
            <span className="dashboard-user-circle">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </span>
            <span className="dashboard-user-name">
              {user?.name || "Guest User"}
            </span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: HOME (DASHBOARD OVERVIEW)                               */}
        {/* ============================================================== */}
        {activeTab === "home" && (
          <>
            {/* HERO BANNER */}
            <section className="dashboard-banner">
              <div className="banner-content">
                <h1>Welcome back, {user?.name || "User"}!</h1>
                <p>
                  AI-guided skin disease prediction, longitudinal health monitoring, and expert clinical dermatologist consultations.
                </p>
                <button
                  className="scan-button"
                  onClick={() => onNavigate("prediction")}
                >
                  📷 &nbsp; Start New AI Scan
                </button>
              </div>
              <div className="banner-icon">🩺</div>
            </section>

            {/* DYNAMIC STAT CARDS */}
            <section className="stat-grid">
              <div className="stat-card blue-border">
                <span>TOTAL SCANS</span>
                <strong>{scans.length}</strong>
              </div>

              <div className="stat-card green-border">
                <span>LAST STATUS</span>
                <strong className={scans[0]?.disease ? "green-text" : ""}>
                  {scans[0]?.disease
                    ? scans[0].disease.replace(" Photos", "").replace(" and other Malignant Lesions", "")
                    : "No Scans Yet"}
                </strong>
              </div>

              <div className="stat-card orange-border">
                <span>URGENT ALERTS</span>
                <strong>
                  {scans.filter((s) => s.risk_level === "Urgent").length > 0
                    ? `${scans.filter((s) => s.risk_level === "Urgent").length} Flagged`
                    : "0 Flags"}
                </strong>
              </div>

              <div className="stat-card purple-border">
                <span>ACTIVE CONSULTS</span>
                <strong>
                  {appointments.length > 0
                    ? `${appointments.length} Scheduled`
                    : "0 Scheduled"}
                </strong>
              </div>
            </section>

            {/* QUICK SERVICES */}
            <section className="quick-section">
              <h2>Quick Actions</h2>
              <div className="service-grid">
                <div className="service-card">
                  <div className="service-icon blue-icon">🔬</div>
                  <h3>AI Disease Prediction</h3>
                  <p>Upload a skin image and select symptoms for immediate multi-modal preliminary analysis.</p>
                  <button onClick={() => onNavigate("prediction")}>
                    Try Prediction →
                  </button>
                </div>

                <div className="service-card">
                  <div className="service-icon green-icon">👨‍⚕️</div>
                  <h3>Consult Doctors</h3>
                  <p>Connect with verified clinical dermatologists for treatment plans and video consultations.</p>
                  <button onClick={() => setActiveTab("doctors")}>
                    View Doctors →
                  </button>
                </div>

                <div className="service-card">
                  <div className="service-icon orange-icon">⌁</div>
                  <h3>Health Tracker</h3>
                  <p>Log condition improvements, symptom changes, and track recovery trajectory over time.</p>
                  <button onClick={() => setActiveTab("tracker")}>
                    Open Tracker →
                  </button>
                </div>

                <div className="service-card">
                  <div className="service-icon purple-icon">🛡️</div>
                  <h3>ABCDE Melanoma Check</h3>
                  <p>Screen suspicious pigmented moles for asymmetry, border, color, and evolving signs.</p>
                  <button onClick={() => setActiveTab("abcde")}>
                    Start Screener →
                  </button>
                </div>

                <div className="service-card">
                  <div className="service-icon blue-icon">🧠</div>
                  <h3>AI Model Specs & Viva</h3>
                  <p>Inspect MobileNetV2 architecture, layer weights, Grad-CAM attribution math, and project viva questions.</p>
                  <button onClick={() => setActiveTab("specs")}>
                    Inspect Model Specs →
                  </button>
                </div>
              </div>
            </section>

            {/* RECENT SCAN ACTIVITY */}
            <section className="recent-section">
              <div className="recent-header">
                <h2>Recent Scan Activity</h2>
                {scans.length > 0 && (
                  <button onClick={() => setActiveTab("history")}>
                    View All History ({scans.length}) →
                  </button>
                )}
              </div>

              {scans.length > 0 ? (
                scans.slice(0, 4).map((scan) => (
                  <div className="scan-item" key={scan.id}>
                    <div className="scan-icon">
                      {scan.preview_image ? (
                        <img
                          src={scan.preview_image}
                          alt="Scan preview"
                          style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }}
                        />
                      ) : (
                        "🔬"
                      )}
                    </div>

                    <div className="scan-info">
                      <h3>{scan.disease}</h3>
                      <p>
                        Confidence: {scan.confidence}% • Tone {scan.skin_tone || "N/A"} • {scan.created_at}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span className={`risk-tag risk-${(scan.risk_level || "moderate").toLowerCase()}`}>
                        {scan.risk_level || "Moderate"}
                      </span>
                      <button
                        className="view-scan-btn"
                        style={{ background: "#0284c7", color: "#ffffff", borderColor: "#0284c7" }}
                        onClick={() => setReportModalScan(scan)}
                        title="View Official Clinical PDF Diagnostic Report"
                      >
                        📄 PDF Report
                      </button>
                      <button
                        className="view-scan-btn"
                        onClick={() => onLoadScan(scan)}
                      >
                        View Analysis →
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-card">
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>📋</div>
                  <h3>No Scans Recorded Yet</h3>
                  <p>Run your first skin analysis to see your scan history and personalized health metrics here.</p>
                  <button
                    className="scan-button"
                    style={{ marginTop: "12px" }}
                    onClick={() => onNavigate("prediction")}
                  >
                    Run First Scan
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {/* ============================================================== */}
        {/* TAB 2: HISTORY                                                 */}
        {/* ============================================================== */}
        {activeTab === "history" && (
          <section className="history-tab">
            <div className="tab-header">
              <div>
                <h2>Your Complete Scan History</h2>
                <p>Browse and review all past AI skin assessments and clinical reports.</p>
              </div>
              <button
                className="scan-button"
                onClick={() => onNavigate("prediction")}
              >
                + New Scan
              </button>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="history-toolbar">
              <input
                type="text"
                placeholder="🔍 Search scans by condition or symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="history-search-input"
              />

              <div className="history-filter-pills">
                {["all", "urgent", "moderate", "low"].map((lvl) => (
                  <button
                    key={lvl}
                    className={`filter-pill ${riskFilter === lvl ? "active" : ""}`}
                    onClick={() => setRiskFilter(lvl)}
                  >
                    {lvl.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* SCAN LIST */}
            {filteredScans.length > 0 ? (
              <div className="history-grid">
                {filteredScans.map((scan) => (
                  <div className="history-card" key={scan.id}>
                    <div className="history-card-top">
                      {scan.preview_image ? (
                        <img
                          src={scan.preview_image}
                          alt="Scan thumbnail"
                          className="history-thumb"
                        />
                      ) : (
                        <div className="history-thumb-placeholder">🔬</div>
                      )}

                      <div className="history-card-body">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <h3>{scan.disease}</h3>
                          <span className={`risk-tag risk-${(scan.risk_level || "moderate").toLowerCase()}`}>
                            {scan.risk_level || "Moderate"}
                          </span>
                        </div>

                        <div className="history-meta">
                          <span>Confidence: <strong>{scan.confidence}%</strong></span>
                          <span>Skin Tone: <strong>Type {scan.skin_tone || "N/A"}</strong></span>
                          <span>Date: <strong>{scan.created_at}</strong></span>
                        </div>

                        {scan.symptoms && (
                          <div className="history-symptoms-snippet">
                            <strong>Symptoms:</strong> {scan.symptoms}
                          </div>
                        )}

                        {scan.notes && (
                          <div className="history-notes-snippet">
                            <strong>Notes:</strong> {scan.notes}
                          </div>
                        )}

                        <div className="history-card-actions">
                          <button
                            className="primary-action-btn"
                            onClick={() => onLoadScan(scan)}
                          >
                            Open Full Analysis →
                          </button>
                          <button
                            className="primary-action-btn"
                            style={{ background: "#0284c7", borderColor: "#0284c7", color: "#ffffff" }}
                            onClick={() => setReportModalScan(scan)}
                          >
                            📄 Clinical PDF Report
                          </button>
                          <button
                            className="delete-action-btn"
                            onClick={() => handleDeleteScan(scan.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-card">
                <div style={{ fontSize: "36px" }}>🔍</div>
                <h3>No Matching Scans Found</h3>
                <p>Try adjusting your search query or risk filters.</p>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB: ABCDE MELANOMA RISK SCREENER                              */}
        {/* ============================================================== */}
        {activeTab === "abcde" && (
          <section className="abcde-tab">
            <ABCDEScreener
              onNavigate={onNavigate}
              onSaveLog={async (entry) => {
                try {
                  const res = await fetch("http://127.0.0.1:8000/api/tracking", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...entry, username: user?.username || "guest" }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setTrackingLogs([data, ...trackingLogs]);
                  }
                } catch {
                  const offlineLog = { id: `ABCDE-${Date.now()}`, ...entry };
                  setTrackingLogs([offlineLog, ...trackingLogs]);
                }
              }}
            />
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 3: DOCTORS & TELEHEALTH CONSULTATIONS                       */}
        {/* ============================================================== */}
        {activeTab === "doctors" && (
          <section className="doctors-tab">
            <div className="tab-header">
              <div>
                <h2>Clinical Dermatologist Panel</h2>
                <p>Schedule a secure video consultation with verified board-certified dermatologists.</p>
              </div>
            </div>

            {/* BOOKING MODAL */}
            {bookingDoctor && (
              <div className="modal-overlay" onClick={() => setBookingDoctor(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Book Consultation with {bookingDoctor.name}</h3>
                    <button className="close-btn" onClick={() => setBookingDoctor(null)}>✕</button>
                  </div>

                  {bookingSuccess ? (
                    <div className="booking-success-box">
                      <div style={{ fontSize: "40px", color: "var(--ok)" }}>✓</div>
                      <h3>Appointment Confirmed!</h3>
                      <p><strong>Appointment ID:</strong> {bookingSuccess.appointment_id}</p>
                      <p><strong>Date & Time:</strong> {bookingSuccess.preferred_date} at {bookingSuccess.preferred_time}</p>
                      <p><strong>Doctor:</strong> {bookingDoctor.name}</p>
                      <div className="meeting-link-box">
                        <span>Video Meeting Link:</span>
                        <a href={bookingSuccess.meeting_link} target="_blank" rel="noreferrer">
                          {bookingSuccess.meeting_link}
                        </a>
                      </div>
                      <button
                        className="primary-action-btn"
                        style={{ marginTop: "16px" }}
                        onClick={() => {
                          setBookingDoctor(null);
                          setBookingSuccess(null);
                        }}
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleBookSubmit} className="booking-form">
                      <div className="form-group">
                        <label>Patient Full Name</label>
                        <input
                          type="text"
                          required
                          value={bookingForm.patient_name}
                          onChange={(e) => setBookingForm({ ...bookingForm, patient_name: e.target.value })}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Email Address</label>
                          <input
                            type="email"
                            required
                            value={bookingForm.email}
                            onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={bookingForm.phone}
                            onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Preferred Date</label>
                          <input
                            type="date"
                            required
                            value={bookingForm.preferred_date}
                            onChange={(e) => setBookingForm({ ...bookingForm, preferred_date: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Preferred Time Slot</label>
                          <select
                            value={bookingForm.preferred_time}
                            onChange={(e) => setBookingForm({ ...bookingForm, preferred_time: e.target.value })}
                          >
                            <option>10:00 AM</option>
                            <option>11:30 AM</option>
                            <option>02:00 PM</option>
                            <option>03:30 PM</option>
                            <option>05:00 PM</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Describe Your Symptoms / Questions</label>
                        <textarea
                          rows={3}
                          placeholder="Provide details about the skin rash, itch, duration, etc."
                          value={bookingForm.symptoms}
                          onChange={(e) => setBookingForm({ ...bookingForm, symptoms: e.target.value })}
                        />
                      </div>

                      <div className="modal-actions">
                        <button type="button" className="delete-action-btn" onClick={() => setBookingDoctor(null)}>
                          Cancel
                        </button>
                        <button type="submit" className="primary-action-btn">
                          Confirm & Book ({bookingDoctor.consult_fee})
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* CITY & SPECIALTY TOOLBAR */}
            <div className="doctor-toolbar">
              <input
                type="text"
                placeholder="🔍 Search by doctor name, hospital, or skin specialty..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                className="doctor-search-input"
              />

              <div className="city-filter-container">
                <span className="city-filter-label">Filter by City:</span>
                <div className="city-pills-row">
                  {availableCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      className={`city-pill ${selectedCity === city ? "active" : ""}`}
                      onClick={() => setSelectedCity(city)}
                    >
                      {city === "All Cities" ? "🌐 All Cities" : `📍 ${city}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DOCTORS GRID */}
            {filteredDoctors.length > 0 ? (
              <div className="doctors-grid">
                {filteredDoctors.map((doc) => (
                  <div className="doctor-card" key={doc.id}>
                    <div>
                      <div className="doctor-card-top">
                        <span className="doctor-avatar">{doc.avatar || "👨‍⚕️"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                            <h3>{doc.name}</h3>
                            <span className="doctor-city-badge">📍 {doc.city}</span>
                          </div>
                          <p className="doctor-specialty">{doc.specialization}</p>
                          <p className="doctor-clinic">🏥 {doc.clinic}</p>
                          {doc.address && <p className="doctor-address">{doc.address}</p>}
                        </div>
                      </div>

                      <div className="doctor-stats-row">
                        <span>⭐ <strong>{doc.rating}</strong> (Rating)</span>
                        <span>🕒 <strong>{doc.experience}</strong> Exp.</span>
                        <span>💵 <strong>{doc.consult_fee}</strong></span>
                      </div>

                      <div className="doctor-availability">
                        <span>📅 Available: <strong>{doc.available_days || "Mon - Sat"}</strong></span>
                      </div>
                    </div>

                    <div className="doctor-actions-column">
                      <div className="doctor-quick-contact-row">
                        {doc.phone && (
                          <a href={`tel:${doc.phone}`} className="doctor-contact-btn phone-btn">
                            📞 Call Clinic
                          </a>
                        )}
                        {doc.maps_url && (
                          <a href={doc.maps_url} target="_blank" rel="noreferrer" className="doctor-contact-btn map-btn">
                            📍 View on Maps
                          </a>
                        )}
                      </div>

                      <button
                        className="book-doc-btn"
                        onClick={() => {
                          setBookingDoctor(doc);
                          setBookingSuccess(null);
                        }}
                      >
                        📅 Book Video Consult ({doc.consult_fee})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-card">
                <div style={{ fontSize: "36px" }}>🏥</div>
                <h3>No Doctors Found in {selectedCity}</h3>
                <p>Try searching for a different doctor, specialty, or switch to another city.</p>
                <button
                  className="primary-action-btn"
                  style={{ marginTop: "12px" }}
                  onClick={() => {
                    setSelectedCity("All Cities");
                    setDoctorSearch("");
                  }}
                >
                  View All Verified Doctors ({doctors.length})
                </button>
              </div>
            )}

            {/* SCHEDULED APPOINTMENTS */}
            {appointments.length > 0 && (
              <div className="booked-section">
                <h2>Your Scheduled Consultations ({appointments.length})</h2>
                <div className="appointments-list">
                  {appointments.map((appt, idx) => (
                    <div className="appointment-card" key={idx}>
                      <div className="appt-info">
                        <h3>{appt.doctor?.name || appt.doctor_name || "Dermatologist"}</h3>
                        <p>
                          📅 <strong>{appt.preferred_date}</strong> at <strong>{appt.preferred_time || "10:00 AM"}</strong>
                        </p>
                        <span className="confirmed-pill">✓ Confirmed</span>
                      </div>
                      <a
                        href={appt.meeting_link || "https://meet.google.com"}
                        target="_blank"
                        rel="noreferrer"
                        className="join-meet-btn"
                      >
                        🎥 Join Video Call
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 4: HEALTH TRACKER                                          */}
        {/* ============================================================== */}
        {activeTab === "tracker" && (
          <section className="tracker-tab">
            <div className="tab-header">
              <div>
                <h2>Skin Condition Recovery Tracker</h2>
                <p>Log your healing progress, treatments used, and monitor recovery over time.</p>
              </div>
            </div>

            {/* LOG FORM */}
            <div className="tracker-card">
              <h3>📝 Add Progress Entry</h3>
              {trackingSuccess && (
                <div className="alert-success">✓ Progress update logged successfully!</div>
              )}
              <form onSubmit={handleTrackingSubmit} className="tracker-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Log Date</label>
                    <input
                      type="date"
                      required
                      value={trackingForm.date}
                      onChange={(e) => setTrackingForm({ ...trackingForm, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Recovery Trend</label>
                    <select
                      value={trackingForm.improvement}
                      onChange={(e) => setTrackingForm({ ...trackingForm, improvement: e.target.value })}
                    >
                      <option>Much Better (Significant Healing)</option>
                      <option>Slightly Better</option>
                      <option>Stable (No Change)</option>
                      <option>Slightly Worse</option>
                      <option>Significant Flare-up</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Current Symptoms</label>
                  <input
                    type="text"
                    placeholder="e.g. Itching reduced, redness subsiding, slight dry flaking"
                    value={trackingForm.symptoms}
                    onChange={(e) => setTrackingForm({ ...trackingForm, symptoms: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Treatments Applied & Care Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Applied ceramide moisturizer 3x daily and took cold showers."
                    value={trackingForm.notes}
                    onChange={(e) => setTrackingForm({ ...trackingForm, notes: e.target.value })}
                  />
                </div>

                <button type="submit" className="primary-action-btn">
                  ✓ Save Progress Entry
                </button>
              </form>
            </div>

            {/* TIMELINE */}
            <div className="timeline-section">
              <h2>Recovery Timeline</h2>
              {trackingLogs.length > 0 ? (
                <div className="timeline-list">
                  {trackingLogs.map((log, idx) => (
                    <div className="timeline-item" key={idx}>
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="timeline-date">{log.date}</span>
                          <span className={`improvement-pill ${log.improvement.toLowerCase().replace(/\s+/g, "-")}`}>
                            {log.improvement}
                          </span>
                        </div>
                        <p><strong>Symptoms:</strong> {log.symptoms}</p>
                        {log.notes && <p className="timeline-notes">{log.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-card">
                  <div style={{ fontSize: "36px" }}>📈</div>
                  <h3>No Tracking Entries Yet</h3>
                  <p>Log your daily or weekly skin condition updates above to track your healing progress over time.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 5: CONTACT SUPPORT                                         */}
        {/* ============================================================== */}
        {activeTab === "contact" && (
          <section className="contact-tab">
            <div className="tab-header">
              <div>
                <h2>Clinical & Technical Support</h2>
                <p>Have questions about your skin analysis, consultations, or technical assistance?</p>
              </div>
            </div>

            <div className="tracker-card" style={{ maxWidth: "680px" }}>
              {contactSubmitted ? (
                <div className="alert-success" style={{ padding: "24px", textAlign: "center" }}>
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>✉️</div>
                  <h3>Message Sent Successfully!</h3>
                  <p>Our clinical support team has received your message and will reply via email within 24 hours.</p>
                  <button
                    className="primary-action-btn"
                    style={{ marginTop: "16px" }}
                    onClick={() => setContactSubmitted(false)}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSubmitted(true);
                  }}
                  className="tracker-form"
                >
                  <div className="form-group">
                    <label>Your Name</label>
                    <input
                      type="text"
                      required
                      defaultValue={user?.name || ""}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Your Email Address</label>
                    <input
                      type="email"
                      required
                      defaultValue={user?.email || ""}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Inquiry Category</label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    >
                      <option>Medical & Dermatologist Consultation Query</option>
                      <option>AI Analysis & Model Feedback</option>
                      <option>Account & OTP Verification Assistance</option>
                      <option>General Support</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Type your message or clinical question here..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="primary-action-btn">
                    Send Inquiry ✉
                  </button>
                </form>
              )}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB: SPECS (AI MODEL & VIVA DEFENSE)                           */}
        {/* ============================================================== */}
        {activeTab === "specs" && (
          <ModelSpecs onNavigate={onNavigate} />
        )}
      </main>

      {/* 1-CLICK CLINICAL PDF REPORT MODAL */}
      <ClinicalReportModal
        isOpen={!!reportModalScan}
        onClose={() => setReportModalScan(null)}
        scanData={reportModalScan}
        user={user}
      />
    </div>
  );
}

export default Dashboard;
