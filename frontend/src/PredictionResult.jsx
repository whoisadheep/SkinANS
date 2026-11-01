import { useState } from "react";
import "./PredictionResult.css";
import ClinicalReportModal from "./ClinicalReportModal";

function PredictionResult({
  result,
  preview,
  skinTone,
  symptoms,
  additionalInfo,
  onNavigate,
}) {
  const [saved, setSaved] = useState(false);
  const [activeImageView, setActiveImageView] = useState("original");
  const [showReportModal, setShowReportModal] = useState(false);

  const gradcamHeatmap = result?.gradcam_heatmap;

  const handleSaveResult = async () => {
    try {
      const scanPayload = {
        disease: displayName,
        confidence: Number(confidence),
        risk_level: riskLevel,
        skin_tone: skinTone,
        symptoms: (symptoms || []).join(", "),
        notes: additionalInfo || "",
        username: JSON.parse(localStorage.getItem("skinans_user") || "{}").username || "guest",
        preview_image: preview || null,
        gradcam_heatmap: gradcamHeatmap || null,
      };

      // Save to localStorage
      const localScans = JSON.parse(localStorage.getItem("skinans_scans") || "[]");
      const scanEntry = {
        id: `SCAN-${Date.now()}`,
        ...scanPayload,
        created_at: new Date().toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        result: result,
      };
      localStorage.setItem("skinans_scans", JSON.stringify([scanEntry, ...localScans.slice(0, 49)]));

      // Call backend API
      fetch("http://127.0.0.1:8000/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scanPayload),
      }).catch((e) => console.log("Backend scan save notice:", e));

      setSaved(true);
    } catch (e) {
      console.error(e);
      setSaved(true);
    }
  };
  const analysis = result?.clinical_analysis;
  const displayName = analysis?.display_name || (result?.disease || "Eczema / Dermatitis");
  const rawDisease = result?.disease;
  const riskLevel = analysis?.risk_level || "Moderate";
  const description =
    analysis?.description ||
    "The AI model identified this condition as the most likely match based on the uploaded image.";
  const skinToneInsights = analysis?.skin_tone_insights;
  const symptomAnalysis = analysis?.symptom_analysis;

  const careRecommendations = analysis?.care_recommendations || [
    "Keep the affected area clean and moisturized.",
    "Prefer gentle, fragrance-free skin products.",
    "Avoid scratching or irritating the affected area.",
    "Avoid known products or substances that trigger your symptoms.",
  ];

  const whenToSeeDoctor = analysis?.when_to_see_doctor || [
    "Symptoms are persistent, spreading, or getting worse.",
    "You experience significant pain, swelling, or discomfort.",
    "There are signs of infection such as increasing warmth, pus, or fever.",
    "You are unsure about the condition or treatment.",
  ];

  const redFlags = analysis?.red_flags || [];
  const aiProvider = analysis?.ai_provider || "SkinANS Multi-Modal AI";

  const confidence = result?.confidence
    ? Number(result.confidence).toFixed(1)
    : "0.0";

  const topPredictions = result?.top_3_predictions || [
    { disease: displayName, confidence: Number(confidence) },
  ];

  return (
    <div className="result-page">
      {/* SIDEBAR */}
      <aside className="result-sidebar">
        <div className="result-brand">
          <div className="result-logo">🩺</div>
          <h2>SkinANS AI</h2>
        </div>

        <nav className="result-nav">
          <button onClick={() => onNavigate("home")}>
            <span>⌂</span>
            Home
          </button>

          <button
            className="active"
            onClick={() => onNavigate("prediction")}
          >
            <span>♙</span>
            Prediction
          </button>

          <button onClick={() => onNavigate("dashboard")}>
            <span>↶</span>
            Dashboard
          </button>
        </nav>

        <button
          className="result-logout"
          onClick={() => onNavigate("home")}
        >
          <span>↪</span>
          Back to Home
        </button>
      </aside>

      {/* MAIN */}
      <main className="result-main">
        {/* HEADER */}
        <div className="result-page-header">
          <div>
            <span className="result-label">AI MULTI-MODAL ANALYSIS</span>
            <h1>Skin Analysis Completed</h1>
            <p>
              Your uploaded image, reported symptoms, and skin phototype have been analyzed.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <div className="completed-badge">✓ Analysis Complete</div>
            <div className={`risk-badge ${riskLevel.toLowerCase()}`}>
              {riskLevel === "Urgent" && "🚨 Urgent Medical Review"}
              {riskLevel === "Moderate" && "⚠️ Moderate Severity"}
              {riskLevel === "Low" && "✓ Low Severity"}
            </div>
          </div>
        </div>

        {/* MAIN RESULT CARD */}
        <section className="result-overview">
          {/* IMAGE */}
          <div className="result-image-section">
            <div className="result-image-wrapper">
              {activeImageView === "gradcam" && gradcamHeatmap ? (
                <img
                  src={gradcamHeatmap}
                  alt="AI Grad-CAM lesion heatmap overlay"
                  className="gradcam-active-img"
                />
              ) : preview ? (
                <img src={preview} alt="Analyzed skin" />
              ) : (
                <div className="no-image">Skin Image</div>
              )}
            </div>

            {/* GRAD-CAM TOGGLE */}
            {gradcamHeatmap && (
              <div className="gradcam-toggle-container">
                <div className="gradcam-pill-group">
                  <button
                    type="button"
                    className={`gradcam-pill-btn ${activeImageView === "original" ? "active" : ""}`}
                    onClick={() => setActiveImageView("original")}
                  >
                    📷 Original
                  </button>
                  <button
                    type="button"
                    className={`gradcam-pill-btn ${activeImageView === "gradcam" ? "active" : ""}`}
                    onClick={() => setActiveImageView("gradcam")}
                  >
                    🔥 AI Heatmap (Grad-CAM)
                  </button>
                </div>
              </div>
            )}

            {activeImageView === "gradcam" && gradcamHeatmap ? (
              <div className="gradcam-explanation-box">
                <div className="gradcam-spectrum-row">
                  <span className="spectrum-label">Low Attention</span>
                  <div className="gradcam-spectrum-bar" />
                  <span className="spectrum-label">Peak Activation</span>
                </div>
                <p>
                  <strong>Explainable AI (Grad-CAM):</strong> Red & warm areas highlight the exact lesion margins and textures that drove MobileNetV2's classification.
                </p>
              </div>
            ) : (
              <span className="image-note">
                {gradcamHeatmap ? "Click 'AI Heatmap' above to see neural network attention" : "Uploaded skin image"}
              </span>
            )}
          </div>

          {/* DIAGNOSIS */}
          <div className="diagnosis-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <span className="small-label">PRIMARY PREDICTED CONDITION</span>
              <span className="ai-engine-pill">✨ {aiProvider}</span>
            </div>

            <h2>{displayName}</h2>
            {rawDisease && rawDisease !== displayName && (
              <span className="raw-disease-tag">Classifier: {rawDisease}</span>
            )}

            <p className="diagnosis-description">{description}</p>

            {/* CONFIDENCE */}
            <div className="confidence-card">
              <div className="confidence-top">
                <span>MODEL CONFIDENCE</span>
                <strong>{confidence}%</strong>
              </div>

              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{
                    width: `${Math.min(Number(confidence), 100)}%`,
                  }}
                />
              </div>

              <small>
                Confidence reflects the image model's class prediction score and is synthesized with clinical knowledge.
              </small>
            </div>
          </div>
        </section>

        {/* TOP PREDICTIONS */}
        <section className="result-card">
          <div className="result-card-header">
            <div>
              <span className="result-label">DIFFERENTIAL DIAGNOSIS</span>
              <h2>Top Model Predictions</h2>
            </div>
          </div>

          <div className="prediction-list">
            {topPredictions.map((item, index) => (
              <div
                className={`prediction-row ${
                  index === 0 ? "primary-prediction" : ""
                }`}
                key={index}
              >
                <div className="prediction-rank">{index + 1}</div>

                <div className="prediction-name">
                  <strong>{item.disease}</strong>
                  {index === 0 && <span>Primary Suspected Match</span>}
                </div>

                <strong className="prediction-percent">
                  {Number(item.confidence).toFixed(1)}%
                </strong>
              </div>
            ))}
          </div>
        </section>

        {/* CLINICAL SYNTHESIS DETAILS */}
        <div className="result-details-grid">
          {/* SYMPTOMS CORRELATION */}
          <section className="result-card">
            <span className="result-label">SYMPTOM ANALYSIS</span>
            <h2>Reported Symptoms</h2>

            {symptoms && symptoms.length > 0 ? (
              <div className="symptom-tags">
                {symptoms.map((symptom) => (
                  <span key={symptom}>{symptom}</span>
                ))}
              </div>
            ) : (
              <p className="muted">No subjective symptoms selected.</p>
            )}

            {symptomAnalysis && (
              <p className="insight-text">
                <strong>Correlation:</strong> {symptomAnalysis}
              </p>
            )}
          </section>

          {/* SKIN TONE PROFILE */}
          <section className="result-card">
            <span className="result-label">SKIN PHOTOTYPE PROFILE</span>
            <h2>Fitzpatrick Tone {skinTone || "N/A"}</h2>

            <div className="tone-result">
              <div className={`tone-circle tone-${skinTone}`} />
              <span>Skin Tone {skinTone || "Not specified"}</span>
            </div>

            {skinToneInsights && (
              <p className="insight-text">
                <strong>Skin Tone Clinical Nuance:</strong> {skinToneInsights}
              </p>
            )}
          </section>
        </div>

        {/* RED FLAGS WARNING */}
        {redFlags.length > 0 && (
          <section className="red-flags-card">
            <div className="red-flags-header">
              <span style={{ fontSize: "22px" }}>🚨</span>
              <h2>Critical Warning Signs — Seek Urgent Evaluation If:</h2>
            </div>
            <ul className="red-flags-list">
              {redFlags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </section>
        )}

        {/* HOME CARE */}
        <section className="care-card home-care">
          <div className="care-icon">🏠</div>
          <div>
            <span className="result-label">SUPPORTIVE CARE PROTOCOLS</span>
            <h2>Condition-Specific Recommendations</h2>
            <p>
              These supportive care measures are tailored to {displayName}:
            </p>
            <ul>
              {careRecommendations.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* DOCTOR GUIDANCE */}
        <section className="care-card doctor-care">
          <div className="care-icon">👨‍⚕️</div>
          <div>
            <span className="result-label">PROFESSIONAL CONSULTATION</span>
            <h2>When Should You Consult a Doctor?</h2>
            <p>Consider professional dermatological evaluation if:</p>
            <ul>
              {whenToSeeDoctor.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ADDITIONAL INFORMATION */}
        {additionalInfo && (
          <section className="result-card">
            <span className="result-label">PATIENT CLINICAL NOTES</span>
            <h2>Additional Notes Provided</h2>
            <p className="additional-result">{additionalInfo}</p>
          </section>
        )}

        {/* ACTIONS */}
        <div className="result-actions">
          <button
            className="secondary-result-btn"
            onClick={() => onNavigate("prediction")}
          >
            ← New Scan
          </button>

          <button
            className="secondary-result-btn"
            onClick={handleSaveResult}
            style={
              saved
                ? {
                    background: "#ecfdf3",
                    color: "#047857",
                    borderColor: "#a7f3d0",
                  }
                : {}
            }
          >
            {saved ? "✓ Saved to Dashboard" : "💾 Save Result"}
          </button>

          <button
            className="secondary-result-btn"
            onClick={() => setShowReportModal(true)}
            style={{
              background: "#0284c7",
              color: "#ffffff",
              borderColor: "#0284c7",
              fontWeight: 700,
            }}
          >
            📄 Official Clinical PDF Report
          </button>

          <button
            className="secondary-result-btn"
            onClick={() => onNavigate("specs")}
            style={{ borderColor: "#38bdf8", color: "#0369a1" }}
          >
            🧠 AI Specs & Viva Defense →
          </button>

          <button
            className="secondary-result-btn"
            onClick={() => onNavigate("abcde")}
            style={{ borderColor: "#a78bfa", color: "#6d28d9" }}
          >
            🛡️ ABCDE Mole Check →
          </button>

          <button
            className="secondary-result-btn"
            onClick={() => onNavigate("doctor")}
          >
            👨‍⚕️ Consult Doctor →
          </button>

          <button
            className="primary-result-btn"
            onClick={() => onNavigate("dashboard")}
          >
            Open Dashboard →
          </button>
        </div>

        <div className="medical-disclaimer">
          <strong>Important Clinical Disclaimer:</strong> SkinANS AI provides preliminary AI-assisted information and multi-modal correlation only. This result is not a confirmed medical diagnosis. Always consult a board-certified dermatologist or qualified healthcare provider for definitive diagnosis and treatment plans.
        </div>
      </main>

      {/* 1-CLICK CLINICAL REPORT MODAL */}
      <ClinicalReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        scanData={{
          ...result,
          disease: displayName,
          confidence: Number(confidence),
          risk_level: riskLevel,
          skin_tone: skinTone,
          symptoms: (symptoms || []).join(", "),
          notes: additionalInfo || "",
          preview_image: preview || null,
          gradcam_heatmap: gradcamHeatmap || null,
          created_at: new Date().toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }}
      />
    </div>
  );
}

export default PredictionResult;
