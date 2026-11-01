import json
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form
from app.services.prediction_services import process_image

router = APIRouter()


@router.post("/predict")
async def predict(
    image: UploadFile = File(...),
    skin_tone: Optional[int] = Form(None),
    symptoms: Optional[str] = Form(None),
    additional_info: Optional[str] = Form(None)
):
    parsed_symptoms: List[str] = []
    if symptoms:
        try:
            val = json.loads(symptoms)
            if isinstance(val, list):
                parsed_symptoms = [str(x) for x in val]
            elif isinstance(val, str):
                parsed_symptoms = [val]
        except Exception:
            parsed_symptoms = [s.strip() for s in symptoms.split(",") if s.strip()]

    result = await process_image(
        image=image,
        skin_tone=skin_tone,
        symptoms=parsed_symptoms,
        additional_info=additional_info
    )

    return {
        "filename": image.filename,
        **result
    }