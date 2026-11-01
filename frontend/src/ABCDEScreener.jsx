import { useState } from "react";
import "./ABCDEScreener.css";

const ABCDE_CRITERIA = [
  {
    id: "A",
    letter: "A",
    title: "Asymmetry",
    subtitle: "One half does not match the other half",
    description:
      "Benign moles are typically symmetrical (circular or oval). If you draw a line down the middle and the two halves do not match in shape or outline, it indicates asymmetry.",
    benignLabel: "Symmetrical (Halves Match)",
    concerningLabel: "Asymmetrical (Uneven Halves)",
    icon: "◐",
  },
  {
    id: "B",
    letter: "B",
    title: "Border Irregularity",
    subtitle: "Edges are ragged, notched, blurred, or scalloped",
    description:
      "A normal mole has clearly defined, smooth, even outer margins. Melanoma lesions often exhibit notched, ragged, scalloped, or hazy borders that fade indistinctly into surrounding skin.",
    benignLabel: "Smooth, Distinct Border",
    concerningLabel: "Irregular, Notched, or Blurry",
    icon: "〰️",
  },
  {
    id: "C",
    letter: "C",
    title: "Color Variation",
    subtitle: "Multiple shades of tan, brown, black, red, or blue",
    description:
      "Benign moles are usually a single uniform shade of tan or brown. Pigmented lesions with uneven coloration or mottled patches of black, dark brown, white, red, or slate-blue require attention.",
    benignLabel: "Single Uniform Color",
    concerningLabel: "Multiple Mottled Colors",
    icon: "🎨",
  },
  {
    id: "D",
    letter: "D",
    title: "Diameter",
    subtitle: "Larger than 6 mm (approx. pencil eraser size)",
    description:
      "Most benign moles remain under 6 millimeters across. While early melanomas can be smaller, any mole exceeding 6 mm in width (or growing rapidly) warrants professional measurement.",
    benignLabel: "Under 6 mm (< Pencil Eraser)",
    concerningLabel: "Larger than 6 mm (> 6 mm)",
    icon: "📏",
  },
  {
    id: "E",
    letter: "E",
    title: "Evolving / Changing",
    subtitle: "Noticeable changes in size, shape, color, or symptoms",
    description:
      "The most important clinical indicator. Any mole that is visibly growing, changing contour or color, becoming elevated, or newly developing symptoms like itching, crusting, or spontaneous bleeding.",
    benignLabel: "Stable & Unchanging",
    concerningLabel: "Actively Changing, Itching, or Bleeding",
    icon: "📈",
  },
];

function ABCDEScreener({ onNavigate, onSaveLog }) {
  const [answers, setAnswers] = useState({
    A: null,
    B: null,
    C: null,
    D: null,
    E: null,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSelect = (criterionId, isConcerning) => {
    setAnswers((prev) => ({
      ...prev,
      [criterionId]: isConcerning,
    }));
  };

  const answeredCount = Object.values(answers).filter((v) => v !== null).length;
  const concerningCount = Object.values(answers).filter((v) => v === true).length;
  const isComplete = answeredCount === ABCDE_CRITERIA.length;

  let riskTier = "incomplete";
  let riskBadge = "Complete all 5 criteria to calculate risk index";
  let riskClass = "incomplete";
  let recommendation = "";

  if (isComplete) {
    if (concerningCount >= 3) {
      riskTier = "High Suspicion";
      riskBadge = "🚨 High Clinical Suspicion / Urgent Evaluation";
      riskClass = "risk-high";
      recommendation =
        "Multiple hallmark ABCDE melanoma criteria are present. We strongly advise scheduling an in-person clinical dermoscopic examination and possible biopsy with a board-certified dermatologist without delay.";
    } else if (concerningCount >= 2) {
      riskTier = "Moderate Suspicion";
      riskBadge = "⚠️ Moderate Clinical Suspicion";
      riskClass = "risk-moderate";
      recommendation =
        "Atypical dysplastic mole characteristics detected. A routine professional in-person dermoscopic evaluation is recommended within 2 to 4 weeks to establish a baseline.";
    } else {
      riskTier = "Low Risk";
      riskBadge = "✓ Low Clinical Risk (Benign Characteristics)";
      riskClass = "risk-low";
      recommendation =
        "The lesion displays predominantly benign mole features. Continue routine monthly self-skin monitoring, avoid UV overexposure, and wear broad-spectrum SPF 30+ daily.";
    }
  }

  const handleSaveScreener = () => {
    if (!isComplete) return;

    const reportEntry = {
      date: new Date().toISOString().split("T")[0],
      symptoms: `ABCDE Screener: ${concerningCount}/5 concerning criteria flagged (${riskTier})`,
      improvement: riskTier === "Low Risk" ? "Much Better" : "Slightly Worse",
      notes: `Criteria: Asymmetry=${answers.A ? "Yes" : "No"}, Border=${answers.B ? "Yes" : "No"}, Color=${answers.C ? "Yes" : "No"}, Diameter=${answers.D ? "Yes" : "No"}, Evolving=${answers.E ? "Yes" : "No"}`,
    };

    if (onSaveLog) {
      onSaveLog(reportEntry);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleReset = () => {
    setAnswers({ A: null, B: null, C: null, D: null, E: null });
    setSavedSuccess(false);
  };

  return (
    <div className="abcde-screener-wrapper">
      {/* HEADER */}
      <div className="abcde-header">
        <div className="abcde-badge">INTERNATIONAL CLINICAL DERMATOLOGY PROTOCOL</div>
        <h2>ABCDE Melanoma & Mole Risk Screener</h2>
        <p>
          Evaluate pigmented skin spots or moles using the American Academy of Dermatology's
          clinical ABCDE criteria to assess melanoma suspicion.
        </p>
      </div>

      {/* PROGRESS BAR */}
      <div className="abcde-progress-card">
        <div className="progress-top-row">
          <span>
            Question Completion: <strong>{answeredCount} of 5 Answered</strong>
          </span>
          <span className="concerning-pill">
            Concerning Flags: <strong>{concerningCount}</strong>
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(answeredCount / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* 5 CRITERIA CARDS */}
      <div className="abcde-criteria-list">
        {ABCDE_CRITERIA.map((criterion) => {
          const currentAnswer = answers[criterion.id];
          return (
            <div
              key={criterion.id}
              className={`criterion-card ${
                currentAnswer === true
                  ? "is-concerning"
                  : currentAnswer === false
                  ? "is-benign"
                  : ""
              }`}
            >
              <div className="criterion-left">
                <div className="criterion-letter-box">
                  <span className="criterion-letter">{criterion.letter}</span>
                  <span className="criterion-icon">{criterion.icon}</span>
                </div>
                <div className="criterion-content">
                  <h3>{criterion.title}</h3>
                  <span className="criterion-subtitle">{criterion.subtitle}</span>
                  <p>{criterion.description}</p>
                </div>
              </div>

              <div className="criterion-options">
                <button
                  type="button"
                  className={`option-btn benign-btn ${
                    currentAnswer === false ? "selected" : ""
                  }`}
                  onClick={() => handleSelect(criterion.id, false)}
                >
                  <span className="status-dot green" />
                  {criterion.benignLabel}
                </button>
                <button
                  type="button"
                  className={`option-btn concerning-btn ${
                    currentAnswer === true ? "selected" : ""
                  }`}
                  onClick={() => handleSelect(criterion.id, true)}
                >
                  <span className="status-dot red" />
                  {criterion.concerningLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* RESULT & RECOMMENDATION PANEL */}
      <div className={`abcde-result-card ${riskClass}`}>
        <div className="result-header">
          <div>
            <span className="result-caption">CLINICAL TRIAGE OUTCOME</span>
            <h3>{riskBadge}</h3>
          </div>
          {isComplete && (
            <div className="score-counter">
              <strong>{concerningCount}</strong>
              <small>/ 5 Flags</small>
            </div>
          )}
        </div>

        {isComplete ? (
          <>
            <p className="result-recommendation">{recommendation}</p>

            {savedSuccess && (
              <div className="alert-saved-box">
                ✓ ABCDE assessment saved to your health progress timeline!
              </div>
            )}

            <div className="result-actions-row">
              <button
                type="button"
                className="action-btn-primary"
                onClick={() => onNavigate("doctors")}
              >
                👨‍⚕️ Consult Dermatologist Panel →
              </button>

              <button
                type="button"
                className="action-btn-secondary"
                onClick={() => onNavigate("prediction")}
              >
                📷 Run AI Scan with Heatmap
              </button>

              <button
                type="button"
                className="action-btn-outline"
                onClick={handleSaveScreener}
              >
                💾 Save to Health Tracker
              </button>

              <button
                type="button"
                className="action-btn-text"
                onClick={handleReset}
              >
                🔄 Reset
              </button>
            </div>
          </>
        ) : (
          <p className="result-prompt">
            Please answer all 5 criteria above (A, B, C, D, and E) to generate your clinical risk
            evaluation and actionable dermatologist advice.
          </p>
        )}

        <div className="abcde-disclaimer">
          <strong>Medical Note:</strong> The ABCDE protocol is an educational screening guide and does
          not replace a histological skin biopsy or dermoscopic examination performed by a
          qualified dermatologist.
        </div>
      </div>
    </div>
  );
}

export default ABCDEScreener;
