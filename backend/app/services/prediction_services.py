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

    # Resize to 224x224
    image_resized = cv2.resize(image_rgb, (224, 224))

    # MobileNetV2 preprocessing
    image_preprocessed = tf.keras.applications.mobilenet_v2.preprocess_input(image_resized)

    # Add batch dimension and convert to float32 tensor
    tensor_input = tf.convert_to_tensor(np.expand_dims(image_preprocessed, axis=0), dtype=tf.float32)

    # Prediction
    predictions = model.predict(tensor_input, verbose=0)

    # Get Top-3 predictions
    top_indices = np.argsort(predictions[0])[-3:][::-1]

    top_predictions = []

    for index in top_indices:
        top_predictions.append({
            "disease": CLASS_NAMES[int(index)],
            "confidence": round(float(predictions[0][index]) * 100, 2)
        })

    # Highest prediction
    predicted_index = int(top_indices[0])
    top_disease = CLASS_NAMES[predicted_index]
    top_confidence = top_predictions[0]["confidence"]

    # Compute Grad-CAM heatmap visualization
    gradcam_heatmap = generate_gradcam(model, tensor_input, orig_bgr, predicted_index)

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