from fastapi import UploadFile
from typing import Optional, List, Dict, Any
import numpy as np
import cv2
import base64
import tensorflow as tf
from app.services.clinical_ai_service import generate_clinical_analysis


# Load trained model
MODEL_PATH = "skin_disease_model_finetuned.keras"

model = tf.keras.models.load_model(MODEL_PATH)

print("Skin disease model loaded successfully!")


# Same class order used during training
CLASS_NAMES = [
    "Acne and Rosacea Photos",
    "Actinic Keratosis Basal Cell Carcinoma and other Malignant Lesions",
    "Atopic Dermatitis Photos",
    "Bullous Disease Photos",
    "Cellulitis Impetigo and other Bacterial Infections",
    "Eczema Photos",
    "Exanthems and Drug Eruptions",
    "Hair Loss Photos Alopecia and other Hair Diseases",
    "Herpes HPV and other STDs Photos",
    "Light Diseases and Disorders of Pigmentation",
    "Lupus and other Connective Tissue diseases",
    "Melanoma Skin Cancer Nevi and Moles",
    "Nail Fungus and other Nail Disease",
    "Poison Ivy Photos and other Contact Dermatitis",
    "Psoriasis pictures Lichen Planus and related diseases",
    "Scabies Lyme Disease and other Infestations and Bites",
    "Seborrheic Keratoses and other Benign Tumors",
    "Systemic Disease",
    "Tinea Ringworm Candidiasis and other Fungal Infections",
    "Urticaria Hives",
    "Vascular Tumors",
    "Vasculitis Photos",
    "Warts Molluscum and other Viral Infections"
]


def generate_gradcam(model_instance, image_tensor, orig_bgr, class_index: int) -> Optional[str]:
    """
    Computes a Grad-CAM (Gradient-Weighted Class Activation Map) highlighting the
    visual lesion regions that drove the model's decision for the predicted class.
    """
    try:
        mobilenet = model_instance.get_layer("mobilenetv2_1.00_224")
        gap = model_instance.get_layer("global_average_pooling2d")
        dropout = model_instance.get_layer("dropout")
        dense = model_instance.get_layer("dense")

        with tf.GradientTape() as tape:
            conv_outputs = mobilenet(image_tensor, training=False)
            tape.watch(conv_outputs)
            x = gap(conv_outputs)
            x = dropout(x, training=False)
            preds = dense(x)
            loss = preds[:, class_index]

        grads = tape.gradient(loss, conv_outputs)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        # Weight the feature maps by the pooled gradients
        cam = conv_outputs[0] @ pooled_grads[..., tf.newaxis]
        cam = tf.squeeze(cam)
        cam = tf.maximum(cam, 0) / (tf.math.reduce_max(cam) + 1e-10)
        heatmap_np = cam.numpy()

        # Resize heatmap to match the original uploaded image dimensions
        orig_h, orig_w = orig_bgr.shape[:2]
        heatmap_resized = cv2.resize(heatmap_np, (orig_w, orig_h), interpolation=cv2.INTER_CUBIC)
        heatmap_uint8 = np.uint8(255 * heatmap_resized)

        # Apply JET colormap (Red/Yellow = Peak Attention, Blue = Background)
        heatmap_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

        # Blend colormap with the original image
        overlay = cv2.addWeighted(orig_bgr, 0.65, heatmap_color, 0.35, 0)

        # Encode to JPEG Base64 URI
        _, buffer = cv2.imencode(".jpg", overlay, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
        base64_str = base64.b64encode(buffer).decode("utf-8")
        return f"data:image/jpeg;base64,{base64_str}"
    except Exception as e:
        print("Grad-CAM generation notice:", e)
        return None


async def process_image(
    image: UploadFile,
    skin_tone: Optional[int] = None,
    symptoms: Optional[List[str]] = None,
    additional_info: Optional[str] = None
):

    # Read uploaded image
    image_data = await image.read()

    # Convert bytes to numpy array
    image_array = np.frombuffer(image_data, np.uint8)

    # Decode image in BGR
    orig_bgr = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if orig_bgr is None:
        raise ValueError("Invalid image file")

    # OpenCV BGR → RGB for model input
    image_rgb = cv2.cvtColor(orig_bgr, cv2.COLOR_BGR2RGB)

    # ==============================================================
    # 1. ASPECT-RATIO PRESERVING CENTER CROP (Prevents Lesion Distortion)
    # ==============================================================
    h, w = image_rgb.shape[:2]
    min_dim = min(h, w)
    start_x = (w - min_dim) // 2
    start_y = (h - min_dim) // 2
    square_crop = image_rgb[start_y:start_y + min_dim, start_x:start_x + min_dim]

    # View 1: Standard square crop
    view_standard = cv2.resize(square_crop, (224, 224), interpolation=cv2.INTER_LANCZOS4)

    # View 2: Horizontal Mirror (TTA View)
    view_flipped = cv2.flip(view_standard, 1)

    # View 3: Slight 8% Zoom Crop (Captures fine lesion micro-patterns)
    margin = int(min_dim * 0.08)
    if margin > 4 and (min_dim - 2 * margin) > 20:
        zoom_crop = square_crop[margin:min_dim - margin, margin:min_dim - margin]
        view_zoomed = cv2.resize(zoom_crop, (224, 224), interpolation=cv2.INTER_LANCZOS4)
    else:
        view_zoomed = view_standard.copy()

    # MobileNetV2 preprocessing for all 3 views
    v1_prep = tf.keras.applications.mobilenet_v2.preprocess_input(view_standard.astype(np.float32))
    v2_prep = tf.keras.applications.mobilenet_v2.preprocess_input(view_flipped.astype(np.float32))
    v3_prep = tf.keras.applications.mobilenet_v2.preprocess_input(view_zoomed.astype(np.float32))

    # ==============================================================
    # 2. TEST-TIME AUGMENTATION (TTA) BATCHED INFERENCE
    # ==============================================================
    batch_input = tf.convert_to_tensor(np.stack([v1_prep, v2_prep, v3_prep], axis=0), dtype=tf.float32)

    raw_predictions = model.predict(batch_input, verbose=0)
    # Weighted consensus across views: Standard (50%), Zoomed (30%), Flipped (20%)
    ensembled_probs = (
        0.50 * raw_predictions[0] +
        0.30 * raw_predictions[2] +
        0.20 * raw_predictions[1]
    )

    # ==============================================================
    # 3. TEMPERATURE SCALING & CALIBRATION (T = 0.68)
    # ==============================================================
    # Sharpen peak probabilities without changing relative class rankings
    epsilon = 1e-7
    logits = np.log(np.clip(ensembled_probs, epsilon, 1.0))
    temperature = 0.68
    scaled_logits = logits / temperature
    exp_logits = np.exp(scaled_logits - np.max(scaled_logits))
    calibrated_probs = exp_logits / np.sum(exp_logits)

    # ==============================================================
    # 4. MULTI-MODAL SYMPTOM PRIOR (Bayesian Clinical Correlation)
    # ==============================================================
    if symptoms and len(symptoms) > 0:
        symptom_str = " ".join(symptoms).lower()
        prior_weights = np.ones(len(CLASS_NAMES), dtype=np.float32)

        for idx, c_name in enumerate(CLASS_NAMES):
            c_lower = c_name.lower()
            # Itching & rash correlations
            if "itching" in symptom_str and any(k in c_lower for k in ["eczema", "dermatitis", "urticaria", "scabies", "psoriasis"]):
                prior_weights[idx] *= 1.25
            # Pain & blisters correlations
            if any(s in symptom_str for s in ["pain", "blisters"]) and any(k in c_lower for k in ["bullous", "herpes", "cellulitis", "vasculitis"]):
                prior_weights[idx] *= 1.30
            # Dryness & flaking correlations
            if any(s in symptom_str for s in ["dryness", "flaking"]) and any(k in c_lower for k in ["dermatitis", "psoriasis", "seborrheic", "tinea"]):
                prior_weights[idx] *= 1.20

        adjusted_probs = calibrated_probs * prior_weights
        calibrated_probs = adjusted_probs / np.sum(adjusted_probs)

    # Get Top-3 predictions
    top_indices = np.argsort(calibrated_probs)[-3:][::-1]

    top_predictions = []
    for index in top_indices:
        top_predictions.append({
            "disease": CLASS_NAMES[int(index)],
            "confidence": round(float(calibrated_probs[index]) * 100, 2)
        })

    # Highest prediction
    predicted_index = int(top_indices[0])
    top_disease = CLASS_NAMES[predicted_index]
    top_confidence = top_predictions[0]["confidence"]

    # Compute Grad-CAM heatmap visualization using the standard view
    tensor_input_gradcam = tf.convert_to_tensor(np.expand_dims(v1_prep, axis=0), dtype=tf.float32)
    gradcam_heatmap = generate_gradcam(model, tensor_input_gradcam, orig_bgr, predicted_index)

    # Generate multi-modal clinical explanation incorporating skin tone, symptoms, and notes
    clinical_analysis = generate_clinical_analysis(
        disease=top_disease,
        confidence=top_confidence,
        top_3=top_predictions,
        skin_tone=skin_tone,
        symptoms=symptoms or [],
        additional_info=additional_info
    )

    return {
        "disease": top_disease,
        "confidence": top_confidence,
        "top_3_predictions": top_predictions,
        "clinical_analysis": clinical_analysis,
        "gradcam_heatmap": gradcam_heatmap
    }