from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
import bcrypt
import random
import smtplib
from email.message import EmailMessage
from jose import jwt

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])


# =========================
# MongoDB
# =========================

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]

users_collection = db["users"]
otp_collection = db["otp_verifications"]


# =========================
# Request Models
# =========================

class RegisterRequest(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class LoginRequest(BaseModel):
    username: str
    password: str


# =========================
# SEND OTP EMAIL
# =========================

def send_otp_email(email, otp):

    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_APP_PASSWORD")

    if not smtp_email or not smtp_password:
        raise Exception("SMTP credentials are not configured.")

    message = EmailMessage()

    message["Subject"] = "SkinANS.AI - Email Verification OTP"
    message["From"] = smtp_email
    message["To"] = email

    message.set_content(
        f"""
Hello,

Your SkinANS.AI email verification OTP is:

{otp}

This OTP is valid for 10 minutes.

If you did not request this verification, please ignore this email.

Regards,
SkinANS.AI Team
"""
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(smtp_email, smtp_password)
        smtp.send_message(message)


# =========================
# REGISTER
# =========================

@router.post("/register")
def register_user(data: RegisterRequest):

    # Check username
    existing_username = users_collection.find_one({
        "username": data.username
    })

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already exists."
        )

    # Check email
    existing_email = users_collection.find_one({
        "email": data.email
    })

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered."
        )

    # Password validation
    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters."
        )

    # Generate OTP
    otp = str(random.randint(100000, 999999))

    # Hash password
    password_hash = bcrypt.hashpw(
        data.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    # Remove old OTP request
    otp_collection.delete_many({
        "email": data.email
    })

    # Store temporary registration
    otp_collection.insert_one({
        "name": data.name,
        "username": data.username,
        "email": data.email,
        "password_hash": password_hash,
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=10)
    })

    # Send OTP
    try:
        send_otp_email(data.email, otp)

    except Exception as e:

        otp_collection.delete_many({
            "email": data.email
        })

        print("Email error:", e)

        raise HTTPException(
            status_code=500,
            detail="Unable to send verification email."
        )

    return {
        "message": "OTP sent successfully.",
        "email": data.email
    }


# =========================
# VERIFY OTP
# =========================

@router.post("/verify-otp")
def verify_otp(data: VerifyOTPRequest):

    verification = otp_collection.find_one({
        "email": data.email
    })

    if not verification:
        raise HTTPException(
            status_code=400,
            detail="No verification request found."
        )

    # Check expiry
    if datetime.utcnow() > verification["expires_at"]:

        otp_collection.delete_many({
            "email": data.email
        })

        raise HTTPException(
            status_code=400,
            detail="OTP has expired."
        )

    # Check OTP
    if data.otp != verification["otp"]:

        raise HTTPException(
            status_code=400,
            detail="Invalid OTP."
        )

    # Create verified user
    user = {
        "name": verification["name"],
        "username": verification["username"],
        "email": verification["email"],
        "password_hash": verification["password_hash"],
        "email_verified": True,
        "created_at": datetime.utcnow()
    }

    users_collection.insert_one(user)

    # Delete temporary OTP data
    otp_collection.delete_many({
        "email": data.email
    })

    return {
        "message": "Email verified successfully.",
        "username": verification["username"]
    }


# =========================
# LOGIN
# =========================

@router.post("/login")
def login_user(data: LoginRequest):

    # Find user
    user = users_collection.find_one({
        "username": data.username
    })

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid User ID or password."
        )

    # Check password
    password_correct = bcrypt.checkpw(
        data.password.encode("utf-8"),
        user["password_hash"].encode("utf-8")
    )

    if not password_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid User ID or password."
        )

    # Check email verification
    if not user.get("email_verified", False):
        raise HTTPException(
            status_code=403,
            detail="Please verify your email first."
        )

    # JWT secret
    JWT_SECRET = os.getenv("JWT_SECRET")

    if not JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="JWT secret is not configured."
        )

    # Create JWT
    token_payload = {
        "user_id": str(user["_id"]),
        "username": user["username"],
        "exp": datetime.utcnow() + timedelta(hours=24)
    }

    access_token = jwt.encode(
        token_payload,
        JWT_SECRET,
        algorithm="HS256"
    )

    return {
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "username": user["username"],
        "name": user["name"]
    }