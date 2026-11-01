import { useState, useEffect } from "react";
import "./ModelSpecs.css";

function ModelSpecs({ onNavigate }) {
  const [activeFaq, setActiveFaq] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");
  const [liveSpecs, setLiveSpecs] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/model/specs")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setLiveSpecs(data);
      })
      .catch((err) => console.log("Model specs fetch notice:", err));
  }, []);

  const taxonomyCategories = {
    Malignant: [
      "Melanoma Skin Cancer Nevi and Moles",
      "Actinic Keratosis Basal Cell Carcinoma and other Malignant Lesions",
      "Seborrheic Keratoses and other Benign Tumors",
      "Vascular Tumors",
    ],
    Inflammatory: [
      "Atopic Dermatitis Photos",
      "Eczema Photos",
      "Psoriasis pictures Lichen Planus and related diseases",
      "Lupus and other Connective Tissue diseases",
      "Vasculitis Photos",
      "Light Diseases and Disorders of Pigmentation",
    ],
    Infectious: [
      "Cellulitis Impetigo and other Bacterial Infections",
      "Herpes HPV and other STDs Photos",
      "Warts Molluscum and other Viral Infections",
      "Tinea Ringworm Candidiasis and other Fungal Infections",
      "Nail Fungus and other Nail Disease",
      "Scabies Lyme Disease and other Infestations and Bites",
    ],
    Allergic: [
      "Urticaria Hives",
      "Exanthems and Drug Eruptions",
      "Poison Ivy Photos and other Contact Dermatitis",
      "Acne and Rosacea Photos",
      "Hair Loss Photos Alopecia and other Hair Diseases",
      "Systemic Disease",
      "Bullous Disease Photos",
    ],
  };

  const vivaQuestions = [
    {
      q: "1. Why choose MobileNetV2 over heavier backbones like ResNet-50 or VGG-16?",
      a: "ResNet-50 contains ~25.6M parameters and VGG-16 contains ~138M parameters. In contrast, MobileNetV2 uses Depthwise Separable Convolutions and Inverted Residual Bottlenecks, requiring only 2.29M total parameters (~90% to 98% reduction in parameter weight). It achieves comparable diagnostic feature sensitivity with ~42ms CPU inference latency, allowing seamless deployment on mobile edge devices and low-bandwidth telehealth clinics without expensive GPU clusters.",
    },
    {
      q: "2. How does Grad-CAM address the 'Black Box' problem in clinical AI?",
      a: "Deep learning models are often rejected by clinicians because their decision criteria are opaque. Grad-CAM (Gradient-Weighted Class Activation Mapping) calculates the gradient of the winning class score y^c with respect to the 7×7×1280 feature activations A^k of the final convolutional layer (`out_relu`). By multiplying feature maps by these pooled gradients and applying a ReLU threshold, it produces a thermal spatial localization map proving the AI is focused on actual lesion borders and melanin irregularities rather than background skin, clothing, or dermoscopic ruler markings.",
    },
    {
      q: "3. How was overfitting prevented when fine-tuning on dermoscopic data?",
      a: "We applied three complementary regularization techniques: (1) Transfer Learning: early convolutional layers pre-trained on ImageNet were frozen (731,584 non-trainable weights), preserving generalized low-level edge and color filters; (2) Spatial Dropout (rate 0.20) placed between the Global Average Pooling layer and the 23-node Dense classifier; (3) Data Augmentation including random affine rotations, horizontal/vertical flips, and zoom variations.",
    },
    {
      q: "4. What loss function and activation mathematics were chosen?",
      a: "The final Dense layer uses the Softmax activation function to convert unbounded logits into a normalized probability distribution summing to 1.0 across the 23 mutually exclusive DermNet classes. Optimization is driven by Categorical Cross-Entropy loss: L = -sum(y_i * log(p_i)) minimized using the Adam optimizer with an initial learning rate of 1e-4 and exponential decay.",
    },
    {
      q: "5. How does the system handle multi-class skin tone bias across Fitzpatrick phototypes?",
      a: "Skin lesions present drastically differently on darker skin (Fitzpatrick Types IV–VI) where erythema may appear violaceous or hyperpigmented rather than pink. SkinANS pairs deep visual embeddings with an interactive multi-modal clinical screener capturing patient phototype, symptom duration, and the standard ABCDE triage score to corroborate the neural network's visual inference.",
    },
  ];

  return (
    <div className="specs-container">
      {/* HEADER BANNER */}
      <div className="specs-header-banner">
        <div className="specs-header-content">
          <div className="specs-badge">AI ARCHITECTURE & VIVA DEFENSE</div>
          <h1 className="specs-title">MobileNetV2 Neural Network & Explainable AI Specs</h1>
          <p className="specs-subtitle">
            Technical blueprint, transfer learning parameters, Grad-CAM mathematical formulation, and academic examination viva defense guide for SkinANS.
          </p>
        </div>
        <div className="specs-actions">
          <button className="specs-action-btn" onClick={() => onNavigate("prediction")}>
            🔬 Test Live Scanner
          </button>
          <button className="specs-action-btn secondary" onClick={() => onNavigate("abcde")}>
            🛡️ ABCDE Screener
          </button>
        </div>
      </div>

      {/* METRICS COUNTER CARDS */}
      <div className="specs-metrics-grid">
        <div className="metric-card">
          <span className="metric-icon">⚙️</span>
          <div className="metric-body">
            <span className="metric-label">TOTAL PARAMETERS</span>
            <span className="metric-value font-mono">
              {liveSpecs?.total_parameters?.toLocaleString() || "2,287,447"}
            </span>
            <span className="metric-sub">~2.29M Deep Weights</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">🎯</span>
          <div className="metric-body">
            <span className="metric-label">TRAINABLE PARAMETERS</span>
            <span className="metric-value font-mono text-emerald">
              {liveSpecs?.trainable_parameters?.toLocaleString() || "1,555,863"}
            </span>
            <span className="metric-sub">Fine-tuned DermNet Top Layers</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">❄️</span>
          <div className="metric-body">
            <span className="metric-label">FROZEN BACKBONE</span>
            <span className="metric-value font-mono text-blue">
              {liveSpecs?.non_trainable_parameters?.toLocaleString() || "731,584"}
            </span>
            <span className="metric-sub">154 MobileNetV2 Layers</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">🏷️</span>
          <div className="metric-body">
            <span className="metric-label">CLASSIFICATION HEAD</span>
            <span className="metric-value font-mono text-amber">
              {liveSpecs?.output_classes_count || 23} Classes
            </span>
            <span className="metric-sub">Softmax Output Tensor</span>
          </div>
        </div>
      </div>

      {/* ARCHITECTURE PIPELINE VISUALIZER */}
      <section className="specs-section">
        <div className="section-head">
          <span className="section-pill">PIPELINE FLOW</span>
          <h2>End-to-End Deep Learning Architecture</h2>
          <p>
            From high-resolution clinical photograph input to calibrated multi-class differential predictions and heatmaps.
          </p>
        </div>

        <div className="pipeline-track">
          <div className="pipeline-node">
            <div className="node-icon">📷</div>
            <div className="node-title">Input Layer</div>
            <div className="node-spec">224 × 224 × 3</div>
            <div className="node-desc">RGB Tensor normalized to [-1, 1]</div>
          </div>

          <div className="pipeline-arrow">➔</div>

          <div className="pipeline-node">
            <div className="node-icon">🧬</div>
            <div className="node-title">MobileNetV2 Backbone</div>
            <div className="node-spec">154 Layers / Inverted Residuals</div>
            <div className="node-desc">Depthwise Separable Convolutions</div>
          </div>

          <div className="pipeline-arrow">➔</div>

          <div className="pipeline-node highlight-node">
            <div className="node-icon">🔥</div>
            <div className="node-title">Target: out_relu</div>
            <div className="node-spec">7 × 7 × 1280 Activation</div>
            <div className="node-desc">Grad-CAM Attribution Hook</div>
          </div>

          <div className="pipeline-arrow">➔</div>

          <div className="pipeline-node">
            <div className="node-icon">📊</div>
            <div className="node-title">Global Avg Pooling</div>
            <div className="node-spec">1280-D Feature Vector</div>
            <div className="node-desc">Dropout Rate: 0.20 Regularization</div>
          </div>

          <div className="pipeline-arrow">➔</div>

          <div className="pipeline-node">
            <div className="node-icon">🩺</div>
            <div className="node-title">Dense Softmax Head</div>
            <div className="node-spec">23 Output Nodes</div>
            <div className="node-desc">Top-1 & Top-3 Differential Probabilities</div>
          </div>
        </div>
      </section>

      {/* GRAD-CAM MATHEMATICAL FORMULATION */}
      <section className="specs-section">
        <div className="section-head">
          <span className="section-pill">EXPLAINABLE AI (XAI)</span>
          <h2>Grad-CAM Mathematical Attribution</h2>
          <p>
            Eliminating the medical black-box dilemma by visualizing exact neural feature activations.
          </p>
        </div>

        <div className="math-grid">
          <div className="math-card">
            <div className="math-header">
              <span className="math-step-num">Step 1</span>
              <h3>Neuron Importance Weights</h3>
            </div>
            <div className="math-formula-box">
              <code className="formula-text">
                α<sub>k</sub><sup>c</sup> = <sup>1</sup>&frasl;<sub>Z</sub> &sum;<sub>i</sub> &sum;<sub>j</sub> ( &part;y<sup>c</sup> / &part;A<sub>i,j</sub><sup>k</sup> )
              </code>
            </div>
            <p className="math-explanation">
              Computes the gradient of the predicted class score <em>y<sup>c</sup></em> with respect to feature map activation <em>A<sup>k</sup></em> of the final convolutional layer. Global average pooling captures spatial importance weight <em>α<sub>k</sub><sup>c</sup></em>.
            </p>
          </div>

          <div className="math-card">
            <div className="math-header">
              <span className="math-step-num">Step 2</span>
              <h3>Rectified Linear Combination (Heatmap)</h3>
            </div>
            <div className="math-formula-box">
              <code className="formula-text">
                L<sub>Grad-CAM</sub><sup>c</sup> = ReLU( &sum;<sub>k</sub> α<sub>k</sub><sup>c</sup> A<sup>k</sup> )
              </code>
            </div>
            <p className="math-explanation">
              Weights the feature activations by their importance factors and passes through a <strong>ReLU</strong> function to retain features positively correlated with the class while discarding negative attributes.
            </p>
          </div>

          <div className="math-card">
            <div className="math-header">
              <span className="math-step-num">Step 3</span>
              <h3>Bilinear Interpolation & JET Colormap</h3>
            </div>
            <div className="math-formula-box">
              <code className="formula-text">
                Overlay = 0.65 × Original + 0.35 × ColorMap(Jet)
              </code>
            </div>
            <p className="math-explanation">
              The 7×7 activation map is upsampled via bicubic interpolation to original lesion dimensions (e.g. 1024×768) and blended with OpenCV's JET thermal palette (Red = High Saliency, Blue = Background).
            </p>
          </div>
        </div>
      </section>

      {/* 23-CLASS DERMNET TAXONOMY */}
      <section className="specs-section">
        <div className="section-head">
          <span className="section-pill">CLINICAL TAXONOMY</span>
          <h2>DermNet NZ 23-Class Categorization</h2>
          <p>
            Organized into clinical dermatological pathology groups for rapid differential triage.
          </p>
        </div>

        <div className="taxonomy-tabs">
          <button
            className={`tax-tab-btn ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            All 23 Classes
          </button>
          <button
            className={`tax-tab-btn ${activeCategory === "Malignant" ? "active" : ""}`}
            onClick={() => setActiveCategory("Malignant")}
          >
            Neoplastic & Malignant
          </button>
          <button
            className={`tax-tab-btn ${activeCategory === "Inflammatory" ? "active" : ""}`}
            onClick={() => setActiveCategory("Inflammatory")}
          >
            Inflammatory & Autoimmune
          </button>
          <button
            className={`tax-tab-btn ${activeCategory === "Infectious" ? "active" : ""}`}
            onClick={() => setActiveCategory("Infectious")}
          >
            Infectious (Viral/Bacterial/Fungal)
          </button>
          <button
            className={`tax-tab-btn ${activeCategory === "Allergic" ? "active" : ""}`}
            onClick={() => setActiveCategory("Allergic")}
          >
            Allergic & Environmental
          </button>
        </div>

        <div className="taxonomy-grid">
          {Object.entries(taxonomyCategories).map(([category, items]) => {
            if (activeCategory !== "all" && activeCategory !== category) return null;
            return (
              <div key={category} className="tax-group-card">
                <h3 className="tax-group-title">{category} Conditions</h3>
                <ul className="tax-list">
                  {items.map((item, idx) => (
                    <li key={idx} className="tax-list-item">
                      <span className="tax-dot"></span>
                      <span>{item.replace(" Photos", "").replace(" pictures", "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* VIVA DEFENSE GUIDE & EXAMINER FAQ */}
      <section className="specs-section">
        <div className="section-head">
          <span className="section-pill">EXAMINATION PREPARATION</span>
          <h2>Project Viva Defense Cheat-Sheet</h2>
          <p>
            Definitive, scientifically sound answers to the most common questions asked by academic examiners and project evaluation panels.
          </p>
        </div>

        <div className="viva-accordion">
          {vivaQuestions.map((item, idx) => (
            <div
              key={idx}
              className={`viva-card ${activeFaq === idx ? "expanded" : ""}`}
              onClick={() => setActiveFaq(activeFaq === idx ? -1 : idx)}
            >
              <div className="viva-q-row">
                <h3 className="viva-question">{item.q}</h3>
                <span className="viva-toggle">{activeFaq === idx ? "−" : "+"}</span>
              </div>
              {activeFaq === idx && (
                <div className="viva-answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ModelSpecs;