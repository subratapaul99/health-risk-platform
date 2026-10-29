import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/chat", tags=["Clinical AI Health Assistant"])


class ChatMessageInput(BaseModel):
    message: str = Field(..., min_length=1, examples=["What should I eat to lower my glucose?"])
    patient_context: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[Dict[str, str]]] = []


class ChatMessageResponse(BaseModel):
    reply: str
    suggested_prompts: List[str]
    clinical_alert: Optional[str] = None
    relevant_biomarkers: List[str] = []


def generate_clinical_assistant_reply(
    user_msg: str,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Clinically-grounded semantic reasoning engine aligned with American Diabetes Association
    (ADA) Standards of Care and the Diabetes Prevention Program (DPP).
    """
    msg = user_msg.lower().strip()
    ctx = context or {}

    glucose = float(ctx.get("glucose") or 0)
    bmi = float(ctx.get("bmi") or 0)
    bp = float(ctx.get("blood_pressure") or 0)
    insulin = float(ctx.get("insulin") or 0)
    age = float(ctx.get("age") or 0)
    risk_score = float(ctx.get("risk_score") or 0)
    risk_band = str(ctx.get("risk_band") or "moderate").lower()
    homa_ir = ctx.get("homa_ir")
    ascvd_risk = ctx.get("ascvd_10yr_risk")

    vitals_summary = []
    if glucose > 0:
        vitals_summary.append(f"Glucose: {glucose} mg/dL")
    if bmi > 0:
        vitals_summary.append(f"BMI: {bmi} kg/m²")
    if bp > 0:
        vitals_summary.append(f"Diastolic BP: {bp} mmHg")
    if homa_ir is not None:
        vitals_summary.append(f"HOMA-IR: {homa_ir}")

    vitals_text = f" (Current Vitals: {', '.join(vitals_summary)})" if vitals_summary else ""

    # 1. Emergency Red-Flag Triage
    if any(k in msg for k in ["chest pain", "shortness of breath", "fainting", "passed out", "vision loss"]):
        return {
            "reply": (
                "⚠️ **URGENT MEDICAL WARNING**: Your symptoms may indicate an acute cardiovascular or metabolic emergency. "
                "Please call emergency services (911 / 112) or seek immediate emergency department medical care. "
                "Do not wait for an online assessment."
            ),
            "suggested_prompts": [
                "Find nearest emergency center",
                "What are signs of diabetic ketoacidosis?",
                "Contact my primary care physician"
            ],
            "clinical_alert": "Emergency medical symptoms flagged. Immediate care required.",
            "relevant_biomarkers": ["blood_pressure", "glucose"],
        }

    # 2. Risk Score & Overall Health Status Interpretation
    if any(k in msg for k in ["what is my score", "explain score", "my risk", "score mean", "am i diabetic", "summary", "how am i"]):
        risk_pct = round(risk_score * 100, 1) if risk_score > 0 else "estimated"
        glycemic_stage = (
            "Diabetic Range (>125 mg/dL)" if glucose >= 126
            else "Prediabetic (100–125 mg/dL)" if glucose >= 100
            else "Normal Fasting Glycemia (<100 mg/dL)" if glucose > 0
            else "Unspecified Glycemia"
        )

        reply = (
            f"### 🩺 Clinical Risk Assessment Summary{vitals_text}\n\n"
            f"• **Calibrated Diabetes Risk:** **{risk_pct}%** ({risk_band.upper()} RISK BAND)\n"
            f"• **Fasting Glycemic Category:** **{glycemic_stage}**\n"
        )
        if homa_ir is not None:
            reply += f"• **Insulin Resistance Index (HOMA-IR):** **{homa_ir}** ({'Elevated Resistance' if float(homa_ir) > 2.5 else 'Normal Sensitivity'})\n"
        if ascvd_risk is not None:
            reply += f"• **10-Year Cardiovascular Event Risk:** **{round(float(ascvd_risk) * 100, 1)}%**\n"

        reply += (
            f"\n**What this means for you:**\n"
            f"Our calibrated machine learning model calculated your probability based on your biomarkers. "
            f"The primary driver of your risk is **{'fasting glucose' if glucose >= 110 else 'adiposity/BMI'}**, "
            f"compounded by **{'elevated blood pressure' if bp >= 85 else 'insulin resistance' if insulin > 90 else 'age'}**.\n\n"
            f"**Key Next Step:** Lifestyle modifications (nutrition and aerobic exercise) can dramatically reduce this risk. "
            f"Would you like a personalized 90-day nutrition plan, or shall we simulate your risk reduction in the What-If tool?"
        )

        return {
            "reply": reply,
            "suggested_prompts": [
                "What foods should I eat to lower glucose?",
                "How can I reduce my risk by 30%?",
                "Explain my HOMA-IR score",
                "What exercise routine is best for me?"
            ],
            "clinical_alert": None,
            "relevant_biomarkers": ["glucose", "bmi", "insulin"],
        }

    # 3. Dietary & Nutrition Guidance
    if any(k in msg for k in ["diet", "food", "eat", "meal", "nutrition", "breakfast", "dinner", "carbs", "sugar"]):
        glucose_context = f"With your fasting glucose at **{glucose} mg/dL**, " if glucose > 0 else "For metabolic glycemic management, "
        reply = (
            f"### 🥗 Personalized Medical Nutrition Protocol (ADA Guidelines)\n\n"
            f"{glucose_context}the goal is eliminating sharp glycemic spikes and improving insulin sensitivity.\n\n"
            f"**1. Recommended Core Foods (Low Glycemic Index):**\n"
            f"• **Non-starchy vegetables:** Spinach, kale, broccoli, cauliflower, zucchini, and bell peppers (unlimited portions).\n"
            f"• **Healthy monounsaturated fats:** Extra virgin olive oil, avocados, raw walnuts, and chia seeds (slows glucose absorption).\n"
            f"• **Clean lean proteins:** Wild-caught fish (salmon, sardines), skinless poultry, eggs, and tofu.\n"
            f"• **High-viscosity soluble fiber:** Lentils, chickpeas, steel-cut oats, and black beans (blunts post-meal insulin demands).\n\n"
            f"**2. Foods to Eliminate or Strictly Limit:**\n"
            f"• Refined grains (white bread, white rice, pasta, pastries).\n"
            f"• Sugar-sweetened beverages, soda, fruit juices, and sweetened teas.\n"
            f"• Ultra-processed snacks with hidden maltodextrin or high-fructose corn syrup.\n\n"
            f"**💡 The ADA Plate Method:** Fill **50%** of your plate with non-starchy vegetables, **25%** with lean protein, and **25%** with complex high-fiber carbohydrates."
        )

        return {
            "reply": reply,
            "suggested_prompts": [
                "What is a sample daily meal plan?",
                "How does exercise help my glucose?",
                "What snacks won't spike my blood sugar?",
                "Explain the ADA Plate Method"
            ],
            "clinical_alert": None,
            "relevant_biomarkers": ["glucose"],
        }

    # 4. Exercise & Physical Activity Guidance
    if any(k in msg for k in ["exercise", "workout", "walk", "activity", "running", "gym", "cardio", "steps"]):
        bmi_context = f"At your current BMI of **{bmi} kg/m²**, " if bmi > 0 else "For optimal metabolic control, "
        reply = (
            f"### 🏃 Evidence-Based Physical Activity Prescription (DPP Aligned)\n\n"
            f"{bmi_context}exercise acts as a natural insulin sensitizer by stimulating **GLUT4 glucose transporters** "
            f"directly into skeletal muscles without requiring excess insulin.\n\n"
            f"**1. The 150-Minute Weekly Standard:**\n"
            f"• **Target:** 30 minutes of moderate aerobic activity (e.g. brisk walking, cycling, water aerobics) 5 days a week.\n"
            f"• **Intensity:** You should be able to talk, but not sing, while exercising (target heart rate: 50–70% max).\n\n"
            f"**2. The Post-Meal 'Glucose Dump' Walk (High Leverage):**\n"
            f"• A **10–15 minute brisk walk immediately after your largest meal** (lunch or dinner) can lower post-prandial glucose peaks by up to **20–30 mg/dL**.\n\n"
            f"**3. Resistance & Muscle Mass (2 Days/Week):**\n"
            f"• Bodyweight squats, wall sits, light dumbbells, or resistance bands. Skeletal muscle is the primary disposal site for circulating blood glucose."
        )

        return {
            "reply": reply,
            "suggested_prompts": [
                "How can I track my 150 minutes?",
                "What is the best time of day to exercise?",
                "What foods should I eat before and after a workout?"
            ],
            "clinical_alert": None,
            "relevant_biomarkers": ["bmi", "glucose"],
        }

    # 5. HOMA-IR & Insulin Resistance Guidance
    if any(k in msg for k in ["homa", "insulin resistance", "insulin", "beta cell", "hyperinsulinemia"]):
        homa_str = f"**{homa_ir}**" if homa_ir is not None else "elevated"
        reply = (
            f"### 🧪 Understanding HOMA-IR & Peripheral Insulin Resistance\n\n"
            f"Your Homeostatic Model Assessment of Insulin Resistance (HOMA-IR) is {homa_str}.\n\n"
            f"**What is HOMA-IR?**\n"
            f"HOMA-IR is calculated from your fasting glucose and fasting insulin levels ($(\\text{{Glucose}} \\times \\text{{Insulin}}) / 405$). "
            f"It evaluates how hard your pancreas is working to maintain normal glucose levels:\n"
            f"• **< 1.9:** Optimal Insulin Sensitivity\n"
            f"• **1.9 – 2.9:** Early / Borderline Insulin Resistance\n"
            f"• **> 2.9:** Significant Insulin Resistance\n\n"
            f"**Why this matters:**\n"
            f"Insulin resistance precedes overt Type 2 Diabetes by 5 to 10 years! When muscle and liver cells resist insulin, "
            f"the pancreas secretes compensatory insulin. Over time, pancreatic beta-cells can exhaust. "
            f"The great news is that **insulin sensitivity is reversible** through targeted weight loss (5–10%), "
            f"reducing refined carbohydrates, and increasing physical activity."
        )

        return {
            "reply": reply,
            "suggested_prompts": [
                "How do I lower my HOMA-IR score?",
                "Can intermittent fasting help insulin resistance?",
                "What blood tests confirm insulin sensitivity?"
            ],
            "clinical_alert": None,
            "relevant_biomarkers": ["insulin", "glucose"],
        }

    # 6. Weight Loss, BMI & Adiposity
    if any(k in msg for k in ["weight", "bmi", "lose weight", "fat", "belly", "waist", "adipose", "pounds", "kg"]):
        bmi_str = f"**{bmi} kg/m²**" if bmi > 0 else "elevated"
        reply = (
            f"### ⚖️ Targeted Metabolic Weight Reduction Protocol\n\n"
            f"Your current BMI is {bmi_str}. In clinical diabetes prevention, extreme crash dieting is counterproductive; "
            f"sustainable fat reduction is what restores metabolic homeostasis.\n\n"
            f"**The Landmark 5–7% DPP Milestone:**\n"
            f"Clinical findings from the *National Diabetes Prevention Program (DPP)* proved that losing just **5% to 7% of body weight** "
            f"(about 10–14 lbs for a 200 lb adult) reduces the incidence of Type 2 Diabetes by **58%**.\n\n"
            f"**How to Achieve This Safely:**\n"
            f"• Aim for a gentle deficit of **300–500 kcal/day** to target steady fat loss of 1 to 2 lbs per week.\n"
            f"• Prioritize protein (1.2–1.6 g per kg of body weight) to preserve lean muscle while losing fat mass.\n"
            f"• Replace high-calorie refined drinks with water, seltzer, or herbal green tea."
        )

        return {
            "reply": reply,
            "suggested_prompts": [
                "Launch What-If simulator to test BMI drops",
                "What is my target healthy weight?",
                "How does belly fat affect diabetes?"
            ],
            "clinical_alert": None,
            "relevant_biomarkers": ["bmi"],
        }

    # 7. Blood Pressure & Cardiovascular Risk
    if any(k in msg for k in ["blood pressure", "bp", "hypertension", "heart", "ascvd", "cardiovascular", "stroke"]):
        bp_str = f"**{bp} mmHg**" if bp > 0 else "monitored"
        reply = (
            f"### ❤️ Cardiovascular & Blood Pressure Management (DASH Guidelines)\n\n"
            f"Your recorded diastolic blood pressure is {bp_str}. Diabetes and cardiovascular disease are closely linked, "
            f"as elevated glucose can accelerate vascular arterial stiffness.\n\n"
            f"**Key Cardiovascular Guidelines:**\n"
            f"• **Target Blood Pressure:** Maintain BP below **130/80 mmHg** according to ADA and AHA/ACC guidelines.\n"
            f"• **DASH Sodium Restriction:** Limit dietary sodium to less than **2,300 mg/day** (ideally 1,500 mg/day for elevated BP).\n"
            f"• **Potassium-Rich Foods:** Incorporate spinach, avocados, tomatoes, and beans to balance sodium and relax arterial walls.\n"
            f"• **Stress & Sleep:** Chronic cortisol spikes increase glucose and arterial pressure. Prioritize 7–8 hours of quality sleep."
        )

        return {
            "reply": reply,
            "suggested_prompts": [
                "What is the DASH diet protocol?",
                "How does sodium impact blood sugar?",
                "What is my 10-year heart attack risk?"
            ],
            "clinical_alert": None,
            "relevant_biomarkers": ["blood_pressure"],
        }

    # 8. Medications & Doctor Inquiries
    if any(k in msg for k in ["medicine", "medication", "pill", "metformin", "ozempic", "glp", "insulin shot", "drug", "doctor"]):
        gluc_val = str(glucose) if glucose else "level"
        reply = (
            f"### 💊 Clinical Medication & Physician Consultation Guidance\n\n"
            f"*(Medical Disclaimer: Always consult your licensed physician before initiating or modifying any medication.)*\n\n"
            f"**Common First-Line Clinical Considerations:**\n"
            f"• **Metformin:** Often considered as first-line therapy for patients with prediabetes who have a BMI >= 35 kg/m², "
            f"are aged under 60, or have a history of gestational diabetes.\n"
            f"• **GLP-1 Receptor Agonists / SGLT2 Inhibitors:** Frequently prescribed for individuals with high cardiovascular or renal co-morbidities.\n\n"
            f"**Questions to Bring to Your Next Appointment:**\n"
            f"1. *'Based on my fasting glucose ({gluc_val}) and HOMA-IR score, do you recommend an oral glucose tolerance test or HbA1c?'*\n"
            f"2. *'Would medical nutrition therapy or lifestyle coaching be appropriate before considering pharmacological options?'*\n"
            f"3. *'Can you generate an official lab requisition for my fasting lipid panel and kidney microalbumin?'*"
        )

        return {
            "reply": reply,
            "suggested_prompts": [
                "Generate clinical lab order requisition",
                "Generate EHR SOAP clinical note",
                "What questions should I ask my doctor?"
            ],
            "clinical_alert": None,
            "relevant_biomarkers": ["glucose", "bmi"],
        }

    # 9. Default Clinical Assistant Response
    return {
        "reply": (
            f"### 💬 Clinical AI Health Assistant{vitals_text}\n\n"
            f"I am your dedicated Clinical Health Assistant. I analyze your metabolic biomarkers and provide "
            f"personalized, evidence-based guidance aligned with the **American Diabetes Association (ADA)** guidelines.\n\n"
            f"**How can I help you today?**\n"
            f"• **Interpret Your Risk:** Ask me to explain your risk score, HOMA-IR score, or biomarker drivers.\n"
            f"• **Nutrition & Diet Plans:** Inquire about low-glycemic foods, meal timing, and carb limits.\n"
            f"• **Exercise Strategies:** Ask about safe aerobic and resistance routines tailored to your vitals.\n"
            f"• **Physician Lab Orders:** Ask me how to generate an official laboratory requisition slip or EHR SOAP note."
        ),
        "suggested_prompts": [
            "Explain my overall diabetes risk score",
            "What foods lower fasting glucose?",
            "How does exercise improve insulin resistance?",
            "Generate lab order requisition"
        ],
        "clinical_alert": None,
        "relevant_biomarkers": ["glucose", "bmi"],
    }


@router.post("/message", response_model=ChatMessageResponse, summary="Send message to Clinical AI Assistant")
def chat_message(payload: ChatMessageInput):
    """
    Evaluates patient inquiry in the context of their specific metabolic vitals,
    providing customized clinical guidance, nutrition recommendations, and lifestyle actions.
    """
    res = generate_clinical_assistant_reply(payload.message, payload.patient_context)
    return ChatMessageResponse(**res)
