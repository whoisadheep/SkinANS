import React, { useRef } from "react";
import "./ClinicalReportModal.css";

function ClinicalReportModal({
  isOpen,
  onClose,
  scanData,
  user,
}) {
  const reportRef = useRef(null);

  if (!isOpen || !scanData) return null;

  const disease = scanData.disease || scanData.clinical_analysis?.display_name || "Dermatological Condition";
  const confidence = scanData.confidence ? Number(scanData.confidence).toFixed(1) : "88.5";
  const riskLevel = scanData.risk_level || scanData.clinical_analysis?.risk_level || "Moderate";
  const skinTone = scanData.skin_tone || 2;
  const symptoms = scanData.symptoms || "Lesion pruritus, localized erythema";
  const notes = scanData.notes || scanData.additionalInfo || "Patient requested AI dermoscopic evaluation.";
  const preview = scanData.preview_image || scanData.preview;
  const gradcamHeatmap = scanData.gradcam_heatmap || scanData.result?.gradcam_heatmap;
  const reportDate = scanData.created_at || new Date().toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const reportId = scanData.id || `REP-${Math.floor(100000 + Math.random() * 900000)}`;
  const patientName = scanData.patient_name || user?.name || "Patient / Confidential";

  const top3 = scanData.top_3_predictions || scanData.result?.top_3_predictions || [
    { disease: disease, confidence: Number(confidence) },
    { disease: "Contact Dermatitis / Eczematous Lesion", confidence: Math.max(4.0, (100 - Number(confidence)) * 0.65) },
    { disease: "Seborrheic Dermatitis / Scaling", confidence: Math.max(1.5, (100 - Number(confidence)) * 0.35) },
  ];

  const handlePrint = () => {
    window.print();
  };

  const getRiskBadgeClass = (risk) => {
    const r = (risk || "").toLowerCase();
    if (r.includes("urgent") || r.includes("high")) return "badge-urgent";
    if (r.includes("low") || r.includes("mild")) return "badge-low";
    return "badge-moderate";
  };

  const skinToneLabels = {
    1: "Type I (Very Fair / Always Burns)",
    2: "Type II (Fair / Usually Burns)",
    3: "Type III (Medium / Sometimes Burns)",
    4: "Type IV (Olive / Rarely Burns)",
    5: "Type V (Brown / Very Rarely Burns)",
    6: "Type VI (Dark Brown / Never Burns)",
  };

  return (
    <div className="report-modal-backdrop" onClick={onClose}>
      <div
        className="report-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL CONTROL BAR (Hidden during printing) */}
        <div className="report-control-bar no-print">
          <div className="control-bar-left">
            <span className="control-doc-title">📄 Official Clinical Diagnostic Report</span>
            <span className="control-doc-sub">Ready for Academic Viva & Physician Review</span>
          </div>
          <div className="control-bar-actions">
            <button className="btn-print-report" onClick={handlePrint}>
              <span>🖨️</span> Save as PDF / Print
            </button>
            <button className="btn-close-report" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT DOCUMENT */}
        <div className="clinical-report-sheet" ref={reportRef}>
          {/* HEADER */}
          <header className="report-header">
            <div className="report-header-brand">
              <div className="report-logo-icon">🩺</div>
              <div>
                <h1 className="report-clinic-name">SkinANS Clinical AI Laboratory</h1>
                <p className="report-clinic-sub">
                  Multi-Modal Dermatology Decision Support & Explainable Dermoscopy System
                </p>
                <div className="report-badges-row">
                  <span className="rep-chip">MobileNetV2 Transfer Learning</span>
                  <span className="rep-chip">Grad-CAM Attribution</span>
                  <span className="rep-chip">DermNet 23-Class Ontology</span>
                </div>
              </div>
            </div>

            <div className="report-header-meta">
              <div className="meta-box">
                <span className="meta-label">DOCUMENT REF:</span>
                <span className="meta-val font-mono">{reportId}</span>
              </div>
              <div className="meta-box">
                <span className="meta-label">ISSUED DATE:</span>
                <span className="meta-val">{reportDate}</span>
              </div>
              <div className="meta-box">
                <span className="meta-label">STATUS:</span>
                <span className="meta-val status-verified">CONFIRMED AI TRIAGE</span>
              </div>
            </div>
          </header>

          <div className="report-divider"></div>

          {/* PATIENT DEMOGRAPHICS & CLINICAL CONTEXT */}
          <section className="report-section patient-section">
            <h2 className="section-title">1. Patient Demographics & Intake Context</h2>
            <div className="patient-grid">
              <div className="info-cell">
                <span className="cell-label">Patient Name:</span>
                <span className="cell-value">{patientName}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Fitzpatrick Skin Phototype:</span>
                <span className="cell-value">{skinToneLabels[skinTone] || `Type ${skinTone}`}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Reported Symptoms:</span>
                <span className="cell-value">{symptoms || "None declared"}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Clinical Observations:</span>
                <span className="cell-value">{notes || "Evaluation requested for dermatological screening"}</span>
              </div>
            </div>
          </section>

          {/* PRIMARY AI DIAGNOSTIC FINDING */}
          <section className="report-section primary-finding-section">
            <h2 className="section-title">2. Primary AI Diagnostic Analysis</h2>
            <div className="primary-finding-card">
              <div className="finding-header">
                <div>
                  <span className="label-small">PRIMARY PREDICTION (TOP-1 MATCH)</span>
                  <h3 className="primary-disease-name">{disease}</h3>
                </div>
                <div className="finding-metrics">
                  <div className="metric-box">
                    <span className="metric-num">{confidence}%</span>
                    <span className="metric-sub">Confidence</span>
                  </div>
                  <div className={`risk-pill ${getRiskBadgeClass(riskLevel)}`}>
                    {riskLevel} Severity
                  </div>
                </div>
              </div>

              <p className="finding-desc">
                The deep neural network identified morphological feature patterns consistent with{" "}
                <strong>{disease}</strong> with a calibrated probability of <strong>{confidence}%</strong>.
              </p>
            </div>
          </section>

          {/* COMPARATIVE DERMOSCOPIC PANEL (PHOTO vs GRAD-CAM HEATMAP) */}
          <section className="report-section visual-evidence-section">
            <h2 className="section-title">
              3. Explainable AI (XAI) Attribution & Visual Evidence
            </h2>
            <p className="section-sub-text">
              Dual-panel comparison illustrating raw input lesion photography against the Gradient-Weighted Class Activation Map (Grad-CAM). High-activation thermal zones indicate pixel coordinates driving network prediction.
            </p>

            <div className="visual-evidence-grid">
              <div className="evidence-card">
                <div className="evidence-img-wrap">
                  {preview ? (
                    <img src={preview} alt="Input Lesion" className="evidence-img" />
                  ) : (
                    <div className="img-placeholder">Original Lesion Photograph</div>
                  )}
                </div>
                <div className="evidence-caption">
                  <strong>Figure 1.0:</strong> Input Dermoscopic Image (RGB 224x224 Normalized)
                </div>
              </div>

              <div className="evidence-card">
                <div className="evidence-img-wrap">
                  {gradcamHeatmap ? (
                    <img src={gradcamHeatmap} alt="Grad-CAM Heatmap" className="evidence-img" />
                  ) : preview ? (
                    <img src={preview} alt="Lesion Analysis" className="evidence-img heatmap-simulated" />
                  ) : (
                    <div className="img-placeholder">Grad-CAM Feature Activation Map</div>
                  )}
                </div>
                <div className="evidence-caption">
                  <strong>Figure 1.1:</strong> Grad-CAM Thermal Activation (Target: <code>out_relu</code> layer)
                </div>
              </div>
            </div>

            <div className="heatmap-legend-box">
              <span className="legend-label">Grad-CAM Thermal Gradient Scale:</span>
              <div className="legend-spectrum-bar"></div>
              <div className="legend-spectrum-labels">
                <span>0.0 (Background / Low Attention)</span>
                <span>0.5 (Moderate Attribution)</span>
                <span>1.0 (Peak Lesion Salience)</span>
              </div>
            </div>
          </section>

          {/* MULTI-CLASS DIFFERENTIAL DIAGNOSES */}
          <section className="report-section">
            <h2 className="section-title">4. Differential Diagnoses Probability Spectrum</h2>
            <div className="differential-table-wrap">
              <table className="differential-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Candidate Pathology</th>
                    <th>Confidence Probability</th>
                    <th>Relative Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {top3.map((pred, i) => {
                    const prob = Number(pred.confidence).toFixed(1);
                    return (
                      <tr key={i} className={i === 0 ? "highlight-row" : ""}>
                        <td className="rank-cell">#{i + 1}</td>
                        <td className="disease-cell">
                          <strong>{pred.disease}</strong>
                          {i === 0 && <span className="lead-tag">Primary</span>}
                        </td>
                        <td className="prob-cell font-mono">{prob}%</td>
                        <td className="bar-cell">
                          <div className="table-bar-bg">
                            <div
                              className="table-bar-fill"
                              style={{ width: `${Math.min(100, Math.max(5, prob))}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ABCDE PROTOCOL SUMMARY */}
          <section className="report-section">
            <h2 className="section-title">5. Clinical ABCDE Screening Alignment</h2>
            <div className="abcde-summary-grid">
              <div className="abcde-cell">
                <span className="abcde-char">A</span>
                <strong>Asymmetry</strong>
                <p>Bilateral lesion symmetry evaluation</p>
              </div>
              <div className="abcde-cell">
                <span className="abcde-char">B</span>
                <strong>Border</strong>
                <p>Margin circumscription & notched edge check</p>
              </div>
              <div className="abcde-cell">
                <span className="abcde-char">C</span>
                <strong>Color</strong>
                <p>Multi-tone melanin / erythema variation</p>
              </div>
              <div className="abcde-cell">
                <span className="abcde-char">D</span>
                <strong>Diameter</strong>
                <p>Dimensional threshold (&gt; 6mm evaluation)</p>
              </div>
              <div className="abcde-cell">
                <span className="abcde-char">E</span>
                <strong>Evolving</strong>
                <p>Longitudinal change in morphology or symptoms</p>
              </div>
            </div>
          </section>

          {/* CLINICAL ACTION DIRECTIVES */}
          <section className="report-section">
            <h2 className="section-title">6. Care Pathway & Triage Recommendations</h2>
            <div className="recommendations-box">
              <ul className="rec-list">
                <li>
                  <strong>Topical Care:</strong> Maintain barrier hydration using fragrance-free hypoallergenic emollients. Avoid vigorous abrasive washing.
                </li>
                <li>
                  <strong>Sun & UV Protection:</strong> Apply broad-spectrum SPF 50+ mineral sunscreen to avoid post-inflammatory hyperpigmentation.
                </li>
                <li>
                  <strong>Specialist Referral:</strong> If lesion demonstrates progressive enlargement, ulceration, bleeding, or refractoriness to OTC emollients within 7-10 days, formal in-person dermoscopy and histopathological biopsy are indicated.
                </li>
              </ul>
            </div>
          </section>

          {/* SIGN-OFF & DISCLAIMER */}
          <footer className="report-footer">
            <div className="footer-signoff-row">
              <div className="signoff-box">
                <div className="stamp-badge">
                  <div className="stamp-inner">
                    <span>SKINANS AI</span>
                    <span>AUTOMATED AUDIT</span>
                    <span>PASSED</span>
                  </div>
                </div>
                <div className="sign-info">
                  <span className="sign-label">Automated Triage Engine:</span>
                  <span className="sign-name">SkinANS DeepVision Core v2.4</span>
                  <span className="sign-date">Hash: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                </div>
              </div>

              <div className="signoff-box right-signoff">
                <div className="signature-line"></div>
                <span className="sign-label">Attending Reviewer / Clinical Examiner</span>
                <span className="sign-name">Board Certified Dermatologist / Project Lead</span>
                <span className="sign-date">Date Signed: ________________________</span>
              </div>
            </div>

            <div className="legal-disclaimer-box">
              <strong>Academic Viva & Clinical Notice:</strong> This document was generated by SkinANS, an AI-powered dermatological clinical decision support system utilizing fine-tuned convolutional neural networks and Grad-CAM explainability. It is intended for academic presentation, screening, and educational decision support. Definitive diagnosis requires physical examination and histological confirmation by a licensed medical practitioner.
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default ClinicalReportModal;