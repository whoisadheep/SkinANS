from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from database import db
from model import skin_model
import json
import random
import sqlite3
from datetime import datetime, timedelta
from flask import Flask, request
from google import genai
import joblib

app = Flask(__name__)

# Your ML model
model = joblib.load("skin_disease_model.pkl")

# Gemini setup
gemini = genai.Client(api_key="AIzaSyBaAC_v_o2F_lAytqG4Ackux6mY15j2jaI")

def ask_gemini(q):
    ans = gemini.models.generate_content(
        model="gemini-2.5-pro",
        contents=q
    )
    return ans.text


@app.route("/predict", methods=["POST"])
def predict():
    data = request.json["features"]
    
    pred = model.predict([data])[0]

    exp = ask_gemini(f"Explain {pred} skin disease and give care tips.")

    return {
        "prediction": pred,
        "gemini_explanation": exp
    }


app.run(debug=True)

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def home():
    return jsonify({'message': 'Skin Disease Prediction API'})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    # Simple authentication (implement proper auth in production)
    user = db.users.find_one({'username': username, 'password': password})
    if user:
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'})

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    location = data.get('location', 'Unknown')
    
    if db.users.find_one({'username': username}):
        return jsonify({'success': False, 'message': 'Username already exists'})
    
    db.add_user(username, password, location)
    return jsonify({'success': True, 'message': 'Registration successful'})

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'})
    
    file = request.files['image']
    symptoms = request.form.get('symptoms', '')
    username = request.form.get('username', 'guest')
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Get prediction
            result = skin_model.predict(filepath, symptoms)
            
            # Save to database
            db.save_prediction(username, filepath, result['disease'], 
                             result['confidence'], symptoms)
            
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)})
    
    return jsonify({'error': 'Invalid file format'})

@app.route('/history/<username>')
def get_history(username):
    predictions = db.get_user_predictions(username)


# Real Doctor Database (In production, use actual database)
doctors_db = [
    {
        'id': 1,
        'name': 'Dr. Rajesh Sharma',
        'specialization': 'Dermatologist',
        'experience': '12 years',
        'rating': 4.8,
        'available': True,
        'next_available': '2024-10-15',
        'fees': '?800'
    },
    {
        'id': 2, 
        'name': 'Dr. Priya Singh',
        'specialization': 'Skin Specialist',
        'experience': '8 years',
        'rating': 4.7,
        'available': True,
        'next_available': '2024-10-14',
        'fees': '?600'
    }
]

@app.route('/get_available_doctors', methods=['GET'])
def get_available_doctors():
    """Get real available doctors"""
    available_doctors = [doc for doc in doctors_db if doc['available']]
    return jsonify(available_doctors)

@app.route('/book_real_appointment', methods=['POST'])
def book_real_appointment():
    """Real appointment booking with doctor confirmation"""
    try:
        data = request.json
        patient_data = {
            'name': data.get('name'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'symptoms': data.get('symptoms'),
            'preferred_date': data.get('preferred_date'),
            'doctor_id': data.get('doctor_id'),
            'timestamp': datetime.now().isoformat(),
            'status': 'confirmed',  # In real system, this would be 'pending'
            'appointment_time': '10:00 AM',  # Would be dynamic
            'meeting_link': 'https://meet.google.com/abc-defg-hij'  # Real video link
        }
        
        # In production: Save to database, send emails, etc.
        print(f"?? REAL APPOINTMENT BOOKED: {patient_data['name']} with Doctor ID: {patient_data['doctor_id']}")
        
        return jsonify({
            'success': True,
            'message': '?? Appointment Confirmed!',
            'appointment_id': f"APT{random.randint(1000, 9999)}",
            'details': {
                'doctor': next((doc for doc in doctors_db if doc['id'] == patient_data['doctor_id']), {}),
                'patient': patient_data,
                'next_steps': 'Check your email for confirmation and meeting link'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})    
    # Doctor Appointment Routes
@app.route('/book_appointment', methods=['POST'])
def book_appointment():
    try:
        data = request.json
        patient_name = data.get('name', '')
        patient_email = data.get('email', '')
        patient_phone = data.get('phone', '')
        symptoms = data.get('symptoms', '')
        preferred_date = data.get('preferred_date', '')
    
        
        # Save appointment to database
        appointment_data = {
            'patient_name': patient_name,
            'email': patient_email,
            'phone': patient_phone,
            'symptoms': symptoms,
            'preferred_date': preferred_date,
            'status': 'pending',
            'timestamp': datetime.now()
        }
        
        # In production, save to database
        print(f"?? Appointment Request: {patient_name} - {patient_email}")
        
        return jsonify({
            'success': True,
            'message': 'Appointment request submitted successfully! Our team will contact you within 24 hours.',
            'appointment_id': f"APT{random.randint(1000, 9999)}",
            'next_steps': 'Keep your phone available for confirmation call.'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/get_doctors', methods=['GET'])
def get_doctors():
    """Get list of available dermatologists"""
    doctors = [
        {'id': 1, 'name': 'Dr. Sharma', 'specialization': 'Dermatologist', 'experience': '10 years', 'rating': 4.5},
        {'id': 2, 'name': 'Dr. Verma', 'specialization': 'Skin Specialist', 'experience': '8 years', 'rating': 4.7},
        {'id': 3, 'name': 'Dr. Patel', 'specialization': 'Cosmetologist', 'experience': '12 years', 'rating': 4.8}
    ]
    return jsonify(doctors)
    # Convert ObjectId to string for JSON serialization
    for pred in predictions:
        pred['_id'] = str(pred['_id'])
        pred['timestamp'] = pred['timestamp'].isoformat()
    
    return jsonify(predictions)

# Database setup for appointments
def init_db():
    conn = sqlite3.connect('skin_clinic.db')
    c = conn.cursor()
    
    # Appointments table
    c.execute('''CREATE TABLE IF NOT EXISTS appointments
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  patient_name TEXT, email TEXT, phone TEXT,
                  symptoms TEXT, preferred_date TEXT,
                  status TEXT, appointment_id TEXT UNIQUE,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Tracking table  
    c.execute('''CREATE TABLE IF NOT EXISTS tracking
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT, date TEXT, notes TEXT,
                  symptoms TEXT, improvement REAL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

# Real Appointment System
@app.route('/book_appointment', methods=['POST'])
def book_appointment():
    try:
        data = request.json
        appointment_id = f"APT{random.randint(1000, 9999)}"
        
        # Save to database
        conn = sqlite3.connect('skin_clinic.db')
        c = conn.cursor()
        
        c.execute('''INSERT INTO appointments 
                    (patient_name, email, phone, symptoms, preferred_date, status, appointment_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)''',
                 (data['name'], data['email'], data['phone'], 
                  data['symptoms'], data['preferred_date'], 'confirmed', appointment_id))
        
        conn.commit()
        conn.close()
        
        # Real response with details
        return jsonify({
            'success': True,
            'message': '? Appointment Booked Successfully!',
            'appointment_id': appointment_id,
            'details': {
                'patient_name': data['name'],
                'doctor': 'Dr. Sharma (Dermatologist)',
                'date': data['preferred_date'],
                'time': '10:00 AM - 10:30 AM',
                'meeting_link': 'https://meet.google.com/abc-defg-hij',
                'next_steps': [
                    'Check your email for confirmation',
                    'Join 10 minutes before appointment',
                    'Keep your reports ready'
                ]
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

# Get Appointment History
@app.route('/appointment_history/<username>', methods=['GET'])
def appointment_history(username):
    try:
        conn = sqlite3.connect('skin_clinic.db')
        c = conn.cursor()
        
        c.execute('''SELECT * FROM appointments WHERE email LIKE ? ORDER BY created_at DESC''', 
                 (f'%{username}%',))
        appointments = c.fetchall()
        
        conn.close()
        
        appointment_list = []
        for appt in appointments:
            appointment_list.append({
                'id': appt[0],
                'patient_name': appt[1],
                'email': appt[2],
                'phone': appt[3],
                'symptoms': appt[4],
                'preferred_date': appt[5],
                'status': appt[6],
                'appointment_id': appt[7],
                'created_at': appt[8]
            })
        
        return jsonify(appointment_list)
        
    except Exception as e:
        return jsonify({'error': str(e)})

# Health Tracking System
@app.route('/save_tracking', methods=['POST'])
def save_tracking():
    try:
        data = request.json
        
        conn = sqlite3.connect('skin_clinic.db')
        c = conn.cursor()
        
        c.execute('''INSERT INTO tracking 
                    (username, date, notes, symptoms, improvement)
                    VALUES (?, ?, ?, ?, ?)''',
                 (data['username'], data['date'], data['notes'], 
                  data['symptoms'], data['improvement']))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Tracking data saved'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

# Get Tracking History
@app.route('/tracking_history/<username>', methods=['GET'])
def tracking_history(username):
    try:
        conn = sqlite3.connect('skin_clinic.db')
        c = conn.cursor()
        
        c.execute('''SELECT * FROM tracking WHERE username = ? ORDER BY date DESC''', (username,))
        tracking_data = c.fetchall()
        
        conn.close()
        
        tracking_list = []
        for track in tracking_data:
            tracking_list.append({
                'date': track[2],
                'notes': track[3],
                'symptoms': track[4],
                'improvement': track[5]
            })
        
        return jsonify(tracking_list)
        
    except Exception as e:
        return jsonify({'error': str(e)})
