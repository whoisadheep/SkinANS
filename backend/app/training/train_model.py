import tensorflow as tf
import os
from sklearn.utils.class_weight import compute_class_weight
import numpy as np
# =========================
# Dataset paths
# =========================

train_dir = "../dataset/train"
test_dir = "../dataset/test"

print("Train exists:", os.path.exists(train_dir))
print("Test exists:", os.path.exists(test_dir))


# =========================
# Load Dataset
# =========================

train_data = tf.keras.utils.image_dataset_from_directory(
    train_dir,
    image_size=(224, 224),
    batch_size=32,
    shuffle=True
)

test_data = tf.keras.utils.image_dataset_from_directory(
    test_dir,
    image_size=(224, 224),
    batch_size=32,
    shuffle=False
)


# Save class names BEFORE map()
class_names = train_data.class_names
num_classes = len(class_names)

print("Classes:", class_names)
print("Number of classes:", num_classes)


# =========================
# Calculate Class Weights
# =========================

class_counts = {}

for class_name in class_names:
    class_path = os.path.join(train_dir, class_name)

    image_count = len([
        file for file in os.listdir(class_path)
        if file.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
    ])

    class_counts[class_name] = image_count


print("\nClass Image Counts:")
for class_name, count in class_counts.items():
    print(class_name, ":", count)


# Calculate balanced class weights
total_images = sum(class_counts.values())

class_weights = {}

for index, class_name in enumerate(class_names):
    count = class_counts[class_name]

    class_weights[index] = total_images / (
        num_classes * count
    )


print("\nClass Weights:")
for index, weight in class_weights.items():
    print(class_names[index], ":", round(weight, 3))


# =========================
# Data Augmentation
# =========================

data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal"),
    tf.keras.layers.RandomRotation(0.1),
    tf.keras.layers.RandomZoom(0.1)
])


# =========================
# MobileNetV2 Preprocessing
# =========================

preprocess_input = tf.keras.applications.mobilenet_v2.preprocess_input


def preprocess_train(image, label):
    image = data_augmentation(image)
    image = preprocess_input(image)
    return image, label


def preprocess_test(image, label):
    image = preprocess_input(image)
    return image, label


train_data = train_data.map(
    preprocess_train,
    num_parallel_calls=tf.data.AUTOTUNE
)

test_data = test_data.map(
    preprocess_test,
    num_parallel_calls=tf.data.AUTOTUNE
)


train_data = train_data.prefetch(tf.data.AUTOTUNE)
test_data = test_data.prefetch(tf.data.AUTOTUNE)


# =========================
# MobileNetV2 Base Model
# =========================

base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights="imagenet"
)

# Freeze pretrained layers
base_model.trainable = False


# =========================
# Build Model
# =========================

inputs = tf.keras.Input(shape=(224, 224, 3))

x = base_model(inputs, training=False)

x = tf.keras.layers.GlobalAveragePooling2D()(x)

x = tf.keras.layers.Dropout(0.3)(x)

outputs = tf.keras.layers.Dense(
    num_classes,
    activation="softmax"
)(x)

model = tf.keras.Model(inputs, outputs)


# =========================
# Compile
# =========================

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)


# =========================
# Model Summary
# =========================

model.summary()


# =========================
# Training
# =========================

history = model.fit(
    train_data,
    validation_data=test_data,
    epochs=5,
    class_weight=class_weights
)

# =========================
# Save Model
# =========================

model.save("skin_disease_model.keras")

print("Model saved successfully!")


# =========================
# Evaluate Model
# =========================

test_loss, test_accuracy = model.evaluate(test_data)

print("Test Loss:", test_loss)
print("Test Accuracy:", test_accuracy)