import tensorflow as tf
import os
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix


# =========================
# Dataset
# =========================

test_dir = "../dataset/test"

print("Test exists:", os.path.exists(test_dir))

test_data = tf.keras.utils.image_dataset_from_directory(
    test_dir,
    image_size=(224, 224),
    batch_size=32,
    shuffle=False
)

class_names = test_data.class_names

print("Classes:", class_names)
print("Number of classes:", len(class_names))


# =========================
# Preprocessing
# =========================

preprocess_input = tf.keras.applications.mobilenet_v2.preprocess_input

test_data = test_data.map(
    lambda x, y: (preprocess_input(x), y),
    num_parallel_calls=tf.data.AUTOTUNE
)

test_data = test_data.prefetch(tf.data.AUTOTUNE)


# =========================
# Load Fine-tuned Model
# =========================

model = tf.keras.models.load_model(
    "skin_disease_model_finetuned.keras"
)

print("Fine-tuned model loaded successfully!")


# =========================
# Basic Evaluation
# =========================

test_loss, test_accuracy = model.evaluate(test_data)

print("Test Loss:", test_loss)
print("Test Accuracy:", test_accuracy)


# =========================
# Predictions
# =========================

y_true = []
y_pred = []

for images, labels in test_data:

    predictions = model.predict(images, verbose=0)

    predicted_labels = np.argmax(predictions, axis=1)

    y_true.extend(labels.numpy())
    y_pred.extend(predicted_labels)


# =========================
# Classification Report
# =========================

print("\nClassification Report:\n")

print(
    classification_report(
        y_true,
        y_pred,
        target_names=class_names,
        zero_division=0
    )
)


# =========================
# Confusion Matrix
# =========================

cm = confusion_matrix(y_true, y_pred)

print("\nConfusion Matrix:\n")
print(cm)