import io
from datetime import datetime, timezone

import google.generativeai as genai
import cloudinary
import cloudinary.uploader
from PIL import Image
from bson import ObjectId
from fastapi import UploadFile, HTTPException

from config import get_settings
from database import get_database
from models.diagnosis import DiagnosisResult, DiagnosisLogOut

settings = get_settings()

# ── Cloudinary setup ───────────────────────────────────────────────────────────
def _configure_cloudinary():
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
    )


# ── Gemini Vision diagnosis ────────────────────────────────────────────────────
DIAGNOSIS_PROMPT = """You are an expert agricultural plant pathologist AI.
Analyze this plant image and respond ONLY in the following exact format (no extra text):

DISEASE: <disease name or "Healthy Crop">
CONFIDENCE: <a number between 0.0 and 1.0>
SEVERITY: <none|low|medium|high>
RECOMMENDATIONS:
- <recommendation 1>
- <recommendation 2>
- <recommendation 3>

Be specific and practical. If the plant looks healthy, say "Healthy Crop".
Common diseases to detect: Leaf Blight, Powdery Mildew, Root Rot, Aphid Infestation, Rust Disease, Yellow Mosaic Virus, Early Blight, Late Blight, Downy Mildew."""


def _run_gemini_vision(image_bytes: bytes) -> tuple[str, float, str, list[str]]:
    """Use Gemini Vision to analyze a plant image and return diagnosis."""
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(model_name="gemini-2.0-flash")

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    response = model.generate_content([DIAGNOSIS_PROMPT, image])
    text = response.text.strip()

    # Parse structured response
    disease_name = "Healthy Crop"
    confidence = 0.85
    severity = "none"
    recommendations = ["Continue regular watering and fertilization.", "Monitor for early pest signs."]

    try:
        lines = text.split("\n")
        recs = []
        in_recs = False
        for line in lines:
            line = line.strip()
            if line.startswith("DISEASE:"):
                disease_name = line.replace("DISEASE:", "").strip()
            elif line.startswith("CONFIDENCE:"):
                try:
                    confidence = float(line.replace("CONFIDENCE:", "").strip())
                except ValueError:
                    confidence = 0.80
            elif line.startswith("SEVERITY:"):
                severity = line.replace("SEVERITY:", "").strip().lower()
            elif line.startswith("RECOMMENDATIONS:"):
                in_recs = True
            elif in_recs and line.startswith("- "):
                recs.append(line[2:].strip())
        if recs:
            recommendations = recs
    except Exception:
        pass  # Use defaults if parsing fails

    return disease_name, confidence, severity, recommendations



async def diagnose_image(file: UploadFile, user_id: str) -> DiagnosisResult:
    # Validate file type
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are accepted.")

    contents = await file.read()

    # Run Gemini Vision diagnosis
    disease_name, confidence, severity, recommendations = _run_gemini_vision(contents)

    # Upload original image to Cloudinary
    _configure_cloudinary()
    upload_result = cloudinary.uploader.upload(
        io.BytesIO(contents),
        folder="kisan_sathi/diagnosis",
        resource_type="image",
    )
    image_url = upload_result["secure_url"]

    # Save diagnosis log to MongoDB
    db = get_database()
    now = datetime.now(timezone.utc)
    await db["diagnosis_logs"].insert_one({
        "user_id": user_id,
        "image_url": image_url,
        "disease_name": disease_name,
        "confidence": confidence,
        "severity": severity,
        "recommendations": recommendations,
        "created_at": now,
    })

    return DiagnosisResult(
        disease_name=disease_name,
        confidence=confidence,
        severity=severity,
        recommendations=recommendations,
        image_url=image_url,
    )


async def get_user_history(user_id: str) -> list[DiagnosisLogOut]:
    db = get_database()
    cursor = db["diagnosis_logs"].find({"user_id": user_id}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        results.append(DiagnosisLogOut(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            image_url=doc["image_url"],
            disease_name=doc["disease_name"],
            confidence=doc["confidence"],
            severity=doc["severity"],
            recommendations=doc["recommendations"],
            created_at=doc["created_at"],
        ))
    return results
