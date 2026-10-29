"""
Clinical AI Health Assistant Unit Tests
Tests clinical rule triggering, ADA recommendations, biomarker context binding,
and emergency triage detection.
"""

from app.routers.chat import (
    ChatMessageInput,
    ChatMessageResponse,
    chat_message,
    generate_clinical_assistant_reply,
)


def test_nutrition_guidance_with_elevated_glucose():
    payload = ChatMessageInput(
        message="What foods lower blood glucose?",
        patient_context={
            "glucose": 150.0,
            "bmi": 29.8,
            "risk_score": 0.68,
            "homa_ir": 3.4,
        },
    )
    resp = chat_message(payload)
    assert isinstance(resp, ChatMessageResponse)
    assert len(resp.suggested_prompts) > 0
    assert "150" in resp.reply
    assert "Plate Method" in resp.reply or "glycemic" in resp.reply.lower()


def test_emergency_red_flag_triage():
    payload = ChatMessageInput(
        message="I have sudden chest pain, shortness of breath, and feel like passing out",
        patient_context={"glucose": 210.0, "blood_pressure": 165.0},
    )
    resp = chat_message(payload)
    assert "Emergency" in resp.clinical_alert
    assert "911" in resp.reply or "Emergency" in resp.reply


def test_exercise_guidance_dpp_protocols():
    payload = ChatMessageInput(
        message="What workouts should I do to reverse prediabetes?",
        patient_context={"glucose": 118.0, "bmi": 32.1},
    )
    resp = chat_message(payload)
    assert "150-Minute" in resp.reply or "walk" in resp.reply.lower()
    assert "Dump" in resp.reply or "post-prandial" in resp.reply.lower() or "aerobic" in resp.reply.lower()


def test_homa_ir_and_insulin_resistance():
    payload = ChatMessageInput(
        message="Can you explain my homa-ir score and insulin resistance?",
        patient_context={"glucose": 135.0, "insulin": 18.0, "homa_ir": 5.9},
    )
    resp = chat_message(payload)
    assert "HOMA-IR" in resp.reply
    assert "5.9" in resp.reply
    assert "insulin" in resp.reply.lower()


def test_medication_inquiry_and_physician_disclaimer():
    payload = ChatMessageInput(
        message="Should I ask my doctor for metformin or ozempic?",
        patient_context={"glucose": 145.0, "bmi": 36.2},
    )
    resp = chat_message(payload)
    assert "Metformin" in resp.reply
    assert "physician" in resp.reply.lower()
    assert "Questions to Bring" in resp.reply
