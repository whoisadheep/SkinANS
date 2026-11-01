from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.records_service import (
    save_scan,
    get_scans,
    get_scan_by_id,
    delete_scan,
    get_dashboard_metrics,
    get_doctors,
    get_available_cities,
    book_doctor_appointment,
    get_appointments,
    save_tracking_log,
    get_tracking_logs,
)
from app.services.prediction_services import CLASS_NAMES

router = APIRouter(prefix="/api", tags=["Clinical Records & Dashboard"])


# Models
class SaveScanRequest(BaseModel):
    disease: str
    confidence: float
    risk_level: Optional[str] = "Moderate"
    skin_tone: Optional[int] = None
    symptoms: Optional[str] = ""
    notes: Optional[str] = ""
    username: Optional[str] = "guest"
    preview_image: Optional[str] = None
    gradcam_heatmap: Optional[str] = None


class BookAppointmentRequest(BaseModel):
    patient_name: str
    doctor_id: str
    preferred_date: str
    preferred_time: Optional[str] = "10:00 AM"
    symptoms: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    username: Optional[str] = "guest"


class TrackingRequest(BaseModel):
    date: str
    symptoms: str
    improvement: str
    notes: Optional[str] = ""
    username: Optional[str] = "guest"


# Routes
@router.post("/scans")
def create_scan(data: SaveScanRequest):
    return save_scan(
        disease=data.disease,
        confidence=data.confidence,
        risk_level=data.risk_level or "Moderate",
        skin_tone=data.skin_tone,
        symptoms=data.symptoms,
        notes=data.notes,
        username=data.username,
        preview_image=data.preview_image,
        gradcam_heatmap=data.gradcam_heatmap,
    )


@router.get("/scans")
def list_scans(username: Optional[str] = Query(None)):
    return get_scans(username=username)


@router.get("/scans/{scan_id}")
def get_scan(scan_id: str):
    scan = get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.delete("/scans/{scan_id}")
def remove_scan(scan_id: str):
    success = delete_scan(scan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"success": True, "message": "Scan deleted"}


@router.get("/dashboard/stats")
def dashboard_stats(username: Optional[str] = Query(None)):
    return get_dashboard_metrics(username=username)


@router.get("/doctors")
def list_doctors(city: Optional[str] = Query(None)):
    return get_doctors(city=city)


@router.get("/doctors/cities")
def list_cities():
    return get_available_cities()


@router.post("/appointments")
def create_appointment(data: BookAppointmentRequest):
    return book_doctor_appointment(
        patient_name=data.patient_name,
        doctor_id=data.doctor_id,
        preferred_date=data.preferred_date,
        preferred_time=data.preferred_time or "10:00 AM",
        symptoms=data.symptoms,
        email=data.email,
        phone=data.phone,
        username=data.username,
    )


@router.get("/appointments")
def list_appointments(username: Optional[str] = Query(None)):
    return get_appointments(username=username)


@router.post("/tracking")
def create_tracking(data: TrackingRequest):
    return save_tracking_log(
        date=data.date,
        symptoms=data.symptoms,
        improvement=data.improvement,
        notes=data.notes,
        username=data.username,
    )


@router.get("/tracking")
def list_tracking(username: Optional[str] = Query(None)):
    return get_tracking_logs(username=username)


@router.get("/model/specs")
def get_model_specs():
    return {
        "model_name": "SkinANS MobileNetV2 Fine-Tuned Classifier",
        "architecture_family": "Convolutional Neural Network (CNN) with Depthwise Separable Convolutions",
        "backbone": "MobileNetV2 (154 functional layers, Inverted Residual Bottlenecks)",
        "input_resolution": "224 x 224 x 3 (RGB normalized [-1, 1])",
        "total_parameters": 2287447,
        "trainable_parameters": 1555863,
        "non_trainable_parameters": 731584,
        "output_classes_count": len(CLASS_NAMES),
        "loss_function": "Categorical Cross-Entropy",
        "activation_function": "Softmax",
        "optimizer": "Adam (LR=1e-4, beta_1=0.9, beta_2=0.999)",
        "explainability_engine": "Grad-CAM (Gradient-Weighted Class Activation Mapping)",
        "gradcam_target_layer": "out_relu (Final 7x7x1280 Conv activation of MobileNetV2)",
        "colormap": "OpenCV COLORMAP_JET",
        "inference_optimizations": [
            "Aspect-Ratio Preserving Center ROI Extraction (Lanczos-4)",
            "3-View Test-Time Augmentation (Standard, Horizontal Flip, 8% Micro-Zoom)",
            "Logit Temperature Calibration (T = 0.68)",
            "Multi-Modal Bayesian Clinical Prior Fusion"
        ],
        "classes": CLASS_NAMES,
        "viva_insights": [
            {
                "question": "Why did you choose MobileNetV2 over heavier models like ResNet-50 or VGG-16?",
                "answer": "ResNet-50 has ~25.6M parameters and VGG-16 has ~138M parameters. MobileNetV2 has only 2.29M parameters (~90% reduction) using Depthwise Separable Convolutions. It achieves comparable classification accuracy while running at ~45ms latency on standard CPUs, making it ideal for edge telehealth clinics."
            },
            {
                "question": "How did you optimize confidence scores and multi-class calibration?",
                "answer": "We implemented Test-Time Augmentation (TTA) with 3 ensembled spatial views (standard, horizontal flip, and 8% micro-zoom) to cancel sensor noise, paired with Logit Temperature Scaling (T = 0.68) to sharpen winning class probabilities while preserving true relative ranking across the 23 DermNet categories."
            },
            {
                "question": "What is the mathematical formulation of Grad-CAM?",
                "answer": "Grad-CAM calculates the gradient of the predicted class score y^c with respect to feature activation maps A^k of the final convolutional layer: alpha_k^c = (1/Z) * sum_i sum_j (d y^c / d A_ij^k). The heat-map is L_GradCAM^c = ReLU(sum_k alpha_k^c * A^k), where ReLU isolates positive features."
            },
            {
                "question": "How did you prevent overfitting on clinical images?",
                "answer": "We utilized ImageNet pre-trained weights for the feature extractor, froze the low-level edge/texture layers (731k parameters), added a Dropout layer (rate 0.20) before the Dense classifier, and applied data augmentation (rotations, flips, zooming)."
            },
            {
                "question": "How does the model handle multi-class skin conditions?",
                "answer": "The classifier produces a 23-way probability distribution via Softmax activation, returning the Top-1 primary diagnosis alongside Top-3 differential diagnoses with calibrated confidence percentages."
            }
        ]
    }
