import { useRef, useState, useEffect } from "react";
import "./Prediction.css";

function Prediction({ onNavigate , onResult }) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [skinTone, setSkinTone] = useState(2);
  const [symptoms, setSymptoms] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Live Webcam state
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState("");
  const [isCameraStreaming, setIsCameraStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [isMirrored, setIsMirrored] = useState(true);

  const symptomList = [
    "Itching",
    "Redness",
    "Pain",
    "Swelling",
    "Blisters",
    "Dryness",
    "Flaking",
    "Rash",
  ];

  // Callback ref to reliably attach stream the exact instant <video> mounts into DOM
  const setVideoRef = (element) => {
    videoRef.current = element;
    if (element && mediaStreamRef.current) {
      if (element.srcObject !== mediaStreamRef.current) {
        element.srcObject = mediaStreamRef.current;
      }
      element.muted = true;
      element.setAttribute("playsinline", "true");
      element.play().catch((err) => console.log("Video direct play error:", err));
    }
  };

  // Re-sync video element whenever isWebcamActive changes
  useEffect(() => {
    if (isWebcamActive && videoRef.current && mediaStreamRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== mediaStreamRef.current) {
        video.srcObject = mediaStreamRef.current;
      }
      video.muted = true;
      video.setAttribute("playsinline", "true");
      video.play().catch((e) => console.log("Video effect play error:", e));
    }
  }, [isWebcamActive]);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startWebcam = async (desiredFacingMode = facingMode) => {
    setError("");
    setWebcamError("");
    setIsCameraStreaming(false);

    // Stop existing stream if any
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    try {
      let stream = null;
      // 1. First attempt: standard user/environment camera
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: desiredFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (modeErr) {
        console.warn("Specific facingMode failed, falling back to basic video constraint:", modeErr);
        // 2. Universal fallback: works on all laptops, USB cams, and browsers
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      mediaStreamRef.current = stream;
      setIsWebcamActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play().catch((err) => console.log("Play failed:", err));
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setIsWebcamActive(false);
      setWebcamError(
        "Could not access camera. Please allow camera permissions in your browser, or ensure no other app (Zoom, Teams, Skype) is using the camera."
      );
    }
  };

  const switchCamera = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startWebcam(nextMode);
  };

  const stopWebcam = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsWebcamActive(false);
    setIsCameraStreaming(false);
    setWebcamError("");
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");

    // Mirror image horizontally if mirror mode is enabled so captured picture matches viewfinder
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `lesion_capture_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setSelectedFile(file);
          setPreview(URL.createObjectURL(blob));
          stopWebcam();
          setError("");
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const handleFile = (file) => {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const handleFileChange = (event) => {
    handleFile(event.target.files[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    const file = event.dataTransfer.files[0];
    handleFile(file);
  };

  const toggleSymptom = (symptom) => {
    setSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom]
    );
  };

  const handlePrediction = async () => {
    if (!selectedFile) {
      setError("Please select a skin image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("image", selectedFile);
      formData.append("skin_tone", skinTone);
      formData.append("symptoms", JSON.stringify(symptoms));
      formData.append("additional_info", additionalInfo);

      /*
        IMPORTANT:
        Replace this URL with your actual FastAPI prediction endpoint.
      */

      const response = await fetch(
        "http://127.0.0.1:8000/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Prediction request failed.");
      }
      const data = await response.json();

onResult({
  result: data,
  preview: preview,
  skinTone: skinTone,
  symptoms: symptoms,
  additionalInfo: additionalInfo,
});
      
    } catch (err) {
      console.error(err);

      setError(
        "Unable to connect with the AI model. Please check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-page">

      {/* SIDEBAR */}

      <aside className="prediction-sidebar">

        <div className="prediction-brand">
          <div className="prediction-logo">
            🩺
          </div>

          <h2>SkinANS AI</h2>
        </div>


        <nav className="prediction-nav">

          <button
            onClick={() => onNavigate("home")}
            className="prediction-nav-item"
          >
            <span>⌂</span>
            Home
          </button>


          <button
            onClick={() => onNavigate("prediction")}
            className="prediction-nav-item active"
          >
            <span>♙</span>
            Prediction
          </button>


          <button
            onClick={() => onNavigate("history")}
            className="prediction-nav-item"
          >
            <span>↶</span>
            History
          </button>


          <button
            onClick={() => onNavigate("tracker")}
            className="prediction-nav-item"
          >
            <span>⌁</span>
            Health Tracker
          </button>


          <button
            onClick={() => onNavigate("doctor")}
            className="prediction-nav-item"
          >
            <span>♧</span>
            Consult Doctor
          </button>


          <button
            onClick={() => onNavigate("contact")}
            className="prediction-nav-item"
          >
            <span>✉</span>
            Contact Us
          </button>

        </nav>


        <button
          className="prediction-logout"
          onClick={() => onNavigate("logout")}
        >
          <span>↪</span>
          Logout
        </button>

      </aside>


      {/* MAIN */}

      <main className="prediction-main">

        <div className="prediction-header">

          <div>
            <span className="page-label">
              AI SKIN ANALYSIS
            </span>

            <h1>
              Skin Disease Prediction
            </h1>

            <p>
              Upload an image of the affected skin area and
              provide some details for a more accurate analysis.
            </p>
          </div>

        </div>


        {/* TWO COLUMN AREA */}

        <div className="prediction-grid">


          {/* IMAGE UPLOAD & LIVE WEBCAM */}

          <section className="prediction-card upload-card">

            <div className="card-title">

              <span className="title-icon">
                ☁
              </span>

              <div>
                <h2>Upload or Capture Skin Image</h2>

                <p>
                  Upload an image or use your device camera with targeting guidance.
                </p>
              </div>

            </div>

            {/* INPUT MODE SWITCHER */}
            <div className="input-mode-switcher">
              <button
                type="button"
                className={`mode-btn ${!isWebcamActive ? "active" : ""}`}
                onClick={() => {
                  if (isWebcamActive) stopWebcam();
                }}
              >
                📁 Upload Photo
              </button>
              <button
                type="button"
                className={`mode-btn ${isWebcamActive ? "active" : ""}`}
                onClick={() => {
                  if (!isWebcamActive) startWebcam();
                }}
              >
                📷 Live Webcam
              </button>
            </div>

            {webcamError && (
              <div className="webcam-alert-error">
                ⚠️ {webcamError}
              </div>
            )}

            {isWebcamActive ? (
              <div className="webcam-viewport">
                <video
                  ref={setVideoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={(e) => {
                    e.target.play().catch(() => {});
                  }}
                  onPlaying={() => setIsCameraStreaming(true)}
                  className={`webcam-live-video ${isMirrored ? "mirrored" : ""}`}
                />

                {!isCameraStreaming && (
                  <div className="webcam-loading-indicator">
                    <span>📷 Initializing camera feed...</span>
                  </div>
                )}

                {/* TARGETING RETICLE OVERLAY */}
                <div className="reticle-overlay">
                  <div className="reticle-circle">
                    <div className="reticle-crosshair-h" />
                    <div className="reticle-crosshair-v" />
                    <div className="reticle-corners top-left" />
                    <div className="reticle-corners top-right" />
                    <div className="reticle-corners bottom-left" />
                    <div className="reticle-corners bottom-right" />
                  </div>
                  <span className="reticle-instruction">
                    Center lesion inside targeting ring
                  </span>
                </div>

                <div className="webcam-actions-bar">
                  <button
                    type="button"
                    className="snap-photo-btn"
                    onClick={capturePhoto}
                  >
                    📸 Capture Lesion Photo
                  </button>
                  <button
                    type="button"
                    className={`mirror-toggle-btn ${isMirrored ? "active" : ""}`}
                    onClick={() => setIsMirrored((prev) => !prev)}
                    title="Toggle mirror view (selfie reflection)"
                  >
                    {isMirrored ? "🪞 Mirror: ON" : "🪞 Mirror: OFF"}
                  </button>
                  <button
                    type="button"
                    className="switch-cam-btn"
                    onClick={switchCamera}
                    title="Flip camera"
                  >
                    🔄 Flip Camera
                  </button>
                  <button
                    type="button"
                    className="cancel-cam-btn"
                    onClick={stopWebcam}
                  >
                    ✕ Cancel
                  </button>
                </div>

                <small className="webcam-hint">
                  💡 Ensure good lighting. If screen is black, check if your laptop has a physical privacy slider / shutter switch closed.
                </small>
              </div>
            ) : (
              <div
                className={`upload-area ${
                  preview ? "has-preview" : ""
                }`}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                onDragOver={(event) =>
                  event.preventDefault()
                }
                onDrop={handleDrop}
              >

                {preview ? (

                  <div className="image-preview-wrapper">

                    <img
                      src={preview}
                      alt="Selected skin"
                      className="skin-preview"
                    />

                    <div className="preview-overlay">
                      <span>
                        Click to Change Image
                      </span>
                    </div>

                  </div>

                ) : (

                  <>

                    <div className="upload-icon">
                      ▧
                    </div>

                    <h3>
                      Click to upload or drag and drop
                    </h3>

                    <p>
                      JPG, PNG or WebP
                    </p>

                    <small>
                      Maximum file size: 5MB
                    </small>

                    <button
                      type="button"
                      className="cam-quick-launch-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        startWebcam();
                      }}
                    >
                      📷 Or Open Live Camera
                    </button>

                  </>

                )}

              </div>
            )}


            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              hidden
            />


            {selectedFile && !isWebcamActive && (
              <div className="selected-file">
                <span>✓</span>

                <div style={{ flex: 1 }}>
                  <strong>
                    {selectedFile.name}
                  </strong>

                  <small>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)}
                    {" MB"}
                  </small>
                </div>

                <button
                  type="button"
                  className="retake-cam-btn"
                  onClick={startWebcam}
                >
                  📷 Retake with Camera
                </button>
              </div>
            )}

          </section>



          {/* SYMPTOMS */}

          <section className="prediction-card symptoms-card">

            <div className="card-title">

              <span className="title-icon">
                ⊞
              </span>

              <div>
                <h2>Symptoms Information</h2>

                <p>
                  Provide details about your symptoms for more
                  accurate diagnosis
                </p>
              </div>

            </div>


            {/* SKIN TONE */}

            <div className="form-section">

              <h3>Skin Tone</h3>

              <p className="form-help">
                Select the closest match to your skin tone
                for better accuracy
              </p>


              <div className="skin-tones">

                {[1, 2, 3, 4].map((tone) => (

                  <button
                    key={tone}
                    type="button"
                    className={`skin-tone tone-${tone} ${
                      skinTone === tone
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => setSkinTone(tone)}
                    aria-label={`Skin tone ${tone}`}
                  />

                ))}

              </div>

            </div>


            {/* SYMPTOMS */}

            <div className="form-section">

              <h3>Common Symptoms</h3>

              <p className="form-help">
                Select all symptoms you're experiencing
              </p>


              <div className="symptoms-grid">

                {symptomList.map((symptom) => (

                  <label
                    key={symptom}
                    className="symptom-option"
                  >

                    <input
                      type="checkbox"
                      checked={symptoms.includes(symptom)}
                      onChange={() =>
                        toggleSymptom(symptom)
                      }
                    />

                    <span className="custom-checkbox">
                      {symptoms.includes(symptom)
                        ? "✓"
                        : ""}
                    </span>

                    <span>
                      {symptom}
                    </span>

                  </label>

                ))}

              </div>

            </div>


            {/* ADDITIONAL INFO */}

            <div className="form-section">

              <h3>
                Additional Information
              </h3>

              <p className="form-help">
                Describe your symptoms in more detail
                (duration, triggers, etc.)
              </p>


              <textarea
                value={additionalInfo}
                onChange={(event) =>
                  setAdditionalInfo(event.target.value)
                }
                placeholder="e.g. The itching started 3 days ago and gets worse at night..."
              />

            </div>


            {/* ERROR */}

            {error && (
              <div className="prediction-error">
                {error}
              </div>
            )}


            {/* BUTTON */}

            <button
              className="analyze-button"
              onClick={handlePrediction}
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  🔬 Analyze Skin
                  <span>→</span>
                </>
              )}

            </button>

          </section>

        </div>


        {/* RESULT */}

        {result && (

          <section className="prediction-result">

            <div className="result-header">

              <div>
                <span>
                  AI ANALYSIS RESULT
                </span>

                <h2>
                  Prediction Completed
                </h2>
              </div>

              <div className="result-check">
                ✓
              </div>

            </div>


            <div className="result-main">

              <div className="result-disease">

                <small>
                  PREDICTED CONDITION
                </small>

                <h3>
                  {result.disease || "Unknown"}
                </h3>

                <p>
                  This is an AI-generated preliminary
                  prediction and should not replace professional
                  medical advice.
                </p>

              </div>


              <div className="confidence-box">

                <span>
                  CONFIDENCE
                </span>

                <strong>
                  {result.confidence
                    ? `${Number(result.confidence).toFixed(2)}%`
                    : "N/A"}
                </strong>

              </div>

            </div>


            {/* TOP 3 */}

            {result.top_3_predictions && (
              <div className="top-predictions">

                <h3>
                  Top Predictions
                </h3>

                {result.top_3_predictions.map(
                  (prediction, index) => (

                    <div
                      className="prediction-result-row"
                      key={index}
                    >

                      <span>
                        {index + 1}
                      </span>

                      <strong>
                        {prediction.disease}
                      </strong>

                      <b>
                        {Number(
                          prediction.confidence
                        ).toFixed(2)}
                        %
                      </b>

                    </div>

                  )
                )}

              </div>
            )}

          </section>

        )}

      </main>

    </div>
  );
}

export default Prediction;