import os
import sqlite3
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "skin_records.db")

AVAILABLE_DOCTORS = [
    {
        "id": "doc-1",
        "name": "Dr. Rajesh Sharma, MD (DVL)",
        "specialization": "Consultant Dermatologist & Venereologist",
        "experience": "12 years",
        "rating": 4.8,
        "consult_fee": "₹800",
        "avatar": "👨‍⚕️",
        "available_days": "Mon - Sat",
        "clinic": "Apollo Hospitals Dermatology Centre",
        "city": "Bengaluru",
        "address": "154/11, Opp. IIMB, Bannerghatta Road, Bengaluru 560076",
        "phone": "+91 80 2630 4050",
        "maps_url": "https://www.google.com/maps/search/Apollo+Hospitals+Bannerghatta+Road+Bengaluru"
    },
    {
        "id": "doc-2",
        "name": "Dr. Kavitha Reddy, MBBS, DDVL",
        "specialization": "Aesthetic & Clinical Dermatologist",
        "experience": "9 years",
        "rating": 4.9,
        "consult_fee": "₹750",
        "avatar": "👩‍⚕️",
        "available_days": "Mon - Fri",
        "clinic": "Manipal Hospital Dermatology Dept",
        "city": "Bengaluru",
        "address": "98, HAL Old Airport Road, Kodihalli, Bengaluru 560017",
        "phone": "+91 80 2502 4444",
        "maps_url": "https://www.google.com/maps/search/Manipal+Hospital+Old+Airport+Road+Bengaluru"
    },
    {
        "id": "doc-3",
        "name": "Dr. Priya Singh, MBBS, MD (DVL)",
        "specialization": "Clinical Dermatologist & Laser Specialist",
        "experience": "8 years",
        "rating": 4.7,
        "consult_fee": "₹600",
        "avatar": "👩‍⚕️",
        "available_days": "Mon - Fri",
        "clinic": "Fortis Healthcare Skin Centre",
        "city": "Delhi NCR",
        "address": "Sector B, Pocket 1, Aruna Asaf Ali Marg, Vasant Kunj, New Delhi 110070",
        "phone": "+91 11 4277 6222",
        "maps_url": "https://www.google.com/maps/search/Fortis+Hospital+Vasant+Kunj+New+Delhi"
    },
    {
        "id": "doc-4",
        "name": "Dr. Sameer Batra, MD, FAAD",
        "specialization": "Psoriasis & Dermato-Surgeon",
        "experience": "14 years",
        "rating": 4.9,
        "consult_fee": "₹850",
        "avatar": "👨‍⚕️",
        "available_days": "Tue - Sat",
        "clinic": "Max Super Speciality Hospital",
        "city": "Delhi NCR",
        "address": "1, 2, Press Enclave Marg, Saket Institutional Area, New Delhi 110017",
        "phone": "+91 11 2651 5050",
        "maps_url": "https://www.google.com/maps/search/Max+Hospital+Saket+New+Delhi"
    },
    {
        "id": "doc-5",
        "name": "Dr. Aisha Patel, MBBS, DDVL",
        "specialization": "Pediatric Dermatology & Dermatosurgery",
        "experience": "10 years",
        "rating": 4.9,
        "consult_fee": "₹700",
        "avatar": "👩‍⚕️",
        "available_days": "Tue - Sun",
        "clinic": "Nanavati Max Super Speciality Hospital",
        "city": "Mumbai",
        "address": "SV Road, near Vile Parle West, Mumbai 400056",
        "phone": "+91 22 2626 7500",
        "maps_url": "https://www.google.com/maps/search/Nanavati+Hospital+Vile+Parle+Mumbai"
    },
    {
        "id": "doc-6",
        "name": "Dr. Rohan Mehta, MD (DVL)",
        "specialization": "Hair Disorders & Inflammatory Dermatoses",
        "experience": "11 years",
        "rating": 4.8,
        "consult_fee": "₹800",
        "avatar": "👨‍⚕️",
        "available_days": "Mon - Sat",
        "clinic": "Kokilaben Dhirubhai Ambani Hospital",
        "city": "Mumbai",
        "address": "Rao Saheb Achutrao Patwardhan Marg, Four Bungalows, Andheri West, Mumbai 400053",
        "phone": "+91 22 4269 6969",
        "maps_url": "https://www.google.com/maps/search/Kokilaben+Hospital+Andheri+West+Mumbai"
    },
    {
        "id": "doc-7",
        "name": "Dr. Sneha Rao, MBBS, MD (DVL)",
        "specialization": "Pigmentary Disorders & Trichology",
        "experience": "9 years",
        "rating": 4.8,
        "consult_fee": "₹650",
        "avatar": "👩‍⚕️",
        "available_days": "Mon - Sat",
        "clinic": "Yashoda Hospitals Dermatology OPD",
        "city": "Hyderabad",
        "address": "Alexander Road, Somajiguda, Hyderabad 500082",
        "phone": "+91 40 4567 4567",
        "maps_url": "https://www.google.com/maps/search/Yashoda+Hospital+Somajiguda+Hyderabad"
    },
    {
        "id": "doc-8",
        "name": "Dr. Vikram Chary, DDVL, FAM",
        "specialization": "Dermatosurgeon & Eczema Specialist",
        "experience": "13 years",
        "rating": 4.7,
        "consult_fee": "₹750",
        "avatar": "👨‍⚕️",
        "available_days": "Mon - Fri",
        "clinic": "Continental Hospitals Dermatology",
        "city": "Hyderabad",
        "address": "Plot No 3, Road No 2, IT & Financial District, Gachibowli, Hyderabad 500032",
        "phone": "+91 40 6700 0000",
        "maps_url": "https://www.google.com/maps/search/Continental+Hospitals+Gachibowli+Hyderabad"
    },
    {
        "id": "doc-9",
        "name": "Dr. S. Annamalai, MD (DVL)",
        "specialization": "Senior Consultant Dermatologist",
        "experience": "15 years",
        "rating": 4.9,
        "consult_fee": "₹700",
        "avatar": "👨‍⚕️",
        "available_days": "Mon - Sat",
        "clinic": "Apollo Hospitals Skin Clinic",
        "city": "Chennai",
        "address": "21, Greams Lane, Thousand Lights, Chennai 600006",
        "phone": "+91 44 2829 0200",
        "maps_url": "https://www.google.com/maps/search/Apollo+Hospital+Greams+Lane+Chennai"
    },
    {
        "id": "doc-10",
        "name": "Dr. Divya Meenakshi, MBBS, DVD",
        "specialization": "Clinical Skin & Hair Specialist",
        "experience": "7 years",
        "rating": 4.7,
        "consult_fee": "₹600",
        "avatar": "👩‍⚕️",
        "available_days": "Tue - Sun",
        "clinic": "Gleneagles Global Health City",
        "city": "Chennai",
        "address": "439, Cheran Nagar, Perumbakkam, Chennai 600100",
        "phone": "+91 44 4477 7000",
        "maps_url": "https://www.google.com/maps/search/Gleneagles+Global+Health+City+Chennai"
    },
    {
        "id": "doc-11",
        "name": "Dr. Subhasish Ghosh, MD (DVL)",
        "specialization": "Clinical & Surgical Dermatology",
        "experience": "12 years",
        "rating": 4.8,
        "consult_fee": "₹600",
        "avatar": "👨‍⚕️",
        "available_days": "Mon - Fri",
        "clinic": "AMRI Hospitals Salt Lake",
        "city": "Kolkata",
        "address": "17, Lane, JC Block, Sector III, Bidhannagar, Kolkata 700098",
        "phone": "+91 33 6680 0000",
        "maps_url": "https://www.google.com/maps/search/AMRI+Hospital+Salt+Lake+Kolkata"
    },
    {
        "id": "doc-12",
        "name": "Dr. Neha Deshmukh, MBBS, DDV",
        "specialization": "Laser Dermatology & Acne Treatment",
        "experience": "8 years",
        "rating": 4.8,
        "consult_fee": "₹650",
        "avatar": "👩‍⚕️",
        "available_days": "Mon - Sat",
        "clinic": "Ruby Hall Clinic Dermatology OPD",
        "city": "Pune",
        "address": "40, Sassoon Road, Sangamvadi, Pune 411001",
        "phone": "+91 20 6645 5100",
        "maps_url": "https://www.google.com/maps/search/Ruby+Hall+Clinic+Sassoon+Road+Pune"
    }
]


def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_sqlite_db():
    conn = get_db_connection()
    c = conn.cursor()

    # Scans table
    c.execute('''
        CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY,
            username TEXT,
            disease TEXT,
            confidence REAL,
            risk_level TEXT,
            skin_tone INTEGER,
            symptoms TEXT,
            notes TEXT,
            preview_image TEXT,
            gradcam_heatmap TEXT,
            created_at TEXT
        )
    ''')

    try:
        c.execute('ALTER TABLE scans ADD COLUMN gradcam_heatmap TEXT')
    except Exception:
        pass

    # Appointments table
    c.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            patient_name TEXT,
            username TEXT,
            email TEXT,
            phone TEXT,
            doctor_id TEXT,
            doctor_name TEXT,
            preferred_date TEXT,
            preferred_time TEXT,
            symptoms TEXT,
            status TEXT,
            meeting_link TEXT,
            created_at TEXT
        )
    ''')

    # Tracking log table
    c.execute('''
        CREATE TABLE IF NOT EXISTS tracking (
            id TEXT PRIMARY KEY,
            username TEXT,
            date TEXT,
            symptoms TEXT,
            improvement TEXT,
            notes TEXT,
            created_at TEXT
        )
    ''')

    conn.commit()
    conn.close()


# Initialize tables on import
init_sqlite_db()


def save_scan(
    disease: str,
    confidence: float,
    risk_level: str = "Moderate",
    skin_tone: Optional[int] = None,
    symptoms: Optional[str] = "",
    notes: Optional[str] = "",
    username: Optional[str] = "guest",
    preview_image: Optional[str] = None,
    gradcam_heatmap: Optional[str] = None
) -> Dict[str, Any]:
    scan_id = f"SCAN-{uuid.uuid4().hex[:8].upper()}"
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO scans (id, username, disease, confidence, risk_level, skin_tone, symptoms, notes, preview_image, gradcam_heatmap, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (scan_id, username or "guest", disease, confidence, risk_level, skin_tone, symptoms, notes, preview_image, gradcam_heatmap, created_at))
    conn.commit()
    conn.close()

    return {
        "id": scan_id,
        "username": username or "guest",
        "disease": disease,
        "confidence": confidence,
        "risk_level": risk_level,
        "skin_tone": skin_tone,
        "symptoms": symptoms,
        "notes": notes,
        "created_at": created_at,
        "gradcam_heatmap": gradcam_heatmap
    }


def get_scans(username: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    c = conn.cursor()
    if username and username != "guest":
        c.execute('SELECT * FROM scans WHERE username = ? OR username = "guest" ORDER BY created_at DESC LIMIT ?', (username, limit))
    else:
        c.execute('SELECT * FROM scans ORDER BY created_at DESC LIMIT ?', (limit,))
    rows = c.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def get_scan_by_id(scan_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM scans WHERE id = ?', (scan_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_scan(scan_id: str) -> bool:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('DELETE FROM scans WHERE id = ?', (scan_id,))
    deleted = c.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def get_dashboard_metrics(username: Optional[str] = None) -> Dict[str, Any]:
    scans = get_scans(username, limit=100)
    total_scans = len(scans)

    # Count real active doctor appointments
    appointments = get_appointments(username)
    active_consults = len(appointments)

    # Real count of scans that flagged urgent clinical review
    urgent_alerts = len([s for s in scans if s.get("risk_level") == "Urgent"])

    if total_scans == 0:
        return {
            "total_scans": 0,
            "last_status": "No scans yet",
            "last_scan_date": "N/A",
            "urgent_alerts": 0,
            "active_consults": active_consults,
            "recent_scans": []
        }

    latest = scans[0]
    last_status = latest["disease"].replace(" Photos", "").replace(" and other Malignant Lesions", "")
    if len(last_status) > 24:
        last_status = last_status[:22] + "..."

    return {
        "total_scans": total_scans,
        "last_status": last_status,
        "last_scan_date": latest.get("created_at", "Recent"),
        "urgent_alerts": urgent_alerts,
        "active_consults": active_consults,
        "recent_scans": scans[:5]
    }


def get_doctors(city: Optional[str] = None) -> List[Dict[str, Any]]:
    if city and city.lower() not in ["all", "all cities"]:
        return [d for d in AVAILABLE_DOCTORS if d.get("city", "").lower() == city.lower()]
    return AVAILABLE_DOCTORS


def get_available_cities() -> List[str]:
    cities = sorted(list(set(d["city"] for d in AVAILABLE_DOCTORS)))
    return ["All Cities"] + cities


def book_doctor_appointment(
    patient_name: str,
    doctor_id: str,
    preferred_date: str,
    preferred_time: str = "10:00 AM",
    symptoms: Optional[str] = "",
    email: Optional[str] = "",
    phone: Optional[str] = "",
    username: Optional[str] = "guest"
) -> Dict[str, Any]:
    appt_id = f"APT-{uuid.uuid4().hex[:6].upper()}"
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    doctor = next((d for d in AVAILABLE_DOCTORS if d["id"] == doctor_id), AVAILABLE_DOCTORS[0])
    meeting_link = f"https://meet.google.com/skinans-{uuid.uuid4().hex[:4]}-{uuid.uuid4().hex[:4]}"

    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO appointments (id, patient_name, username, email, phone, doctor_id, doctor_name, preferred_date, preferred_time, symptoms, status, meeting_link, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (appt_id, patient_name, username or "guest", email, phone, doctor["id"], doctor["name"], preferred_date, preferred_time, symptoms, "Confirmed", meeting_link, created_at))
    conn.commit()
    conn.close()

    return {
        "appointment_id": appt_id,
        "patient_name": patient_name,
        "doctor": doctor,
        "preferred_date": preferred_date,
        "preferred_time": preferred_time,
        "status": "Confirmed",
        "meeting_link": meeting_link,
        "created_at": created_at
    }


def get_appointments(username: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    c = conn.cursor()
    if username and username != "guest":
        c.execute('SELECT * FROM appointments WHERE username = ? OR username = "guest" ORDER BY created_at DESC', (username,))
    else:
        c.execute('SELECT * FROM appointments ORDER BY created_at DESC')
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def save_tracking_log(
    date: str,
    symptoms: str,
    improvement: str,
    notes: Optional[str] = "",
    username: Optional[str] = "guest"
) -> Dict[str, Any]:
    track_id = f"TRK-{uuid.uuid4().hex[:6].upper()}"
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO tracking (id, username, date, symptoms, improvement, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (track_id, username or "guest", date, symptoms, improvement, notes, created_at))
    conn.commit()
    conn.close()

    return {
        "id": track_id,
        "date": date,
        "symptoms": symptoms,
        "improvement": improvement,
        "notes": notes,
        "created_at": created_at
    }


def get_tracking_logs(username: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    c = conn.cursor()
    if username and username != "guest":
        c.execute('SELECT * FROM tracking WHERE username = ? OR username = "guest" ORDER BY date DESC', (username,))
    else:
        c.execute('SELECT * FROM tracking ORDER BY date DESC')
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]
